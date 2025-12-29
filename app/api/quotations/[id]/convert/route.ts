import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"

interface RouteParams {
  params: Promise<{ id: string }>
}

const ConvertQuotationSchema = z.object({
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
})

/**
 * POST /api/quotations/[id]/convert - Convert quotation to sale
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { paymentMethod, notes } = ConvertQuotationSchema.parse(body)

    // Get quotation with items
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    })

    if (!quotation) {
      return new NextResponse(JSON.stringify({ error: 'Quotation not found' }), { status: 404 })
    }

    // Check permissions
    if (!['ADMIN', 'MANAGER'].includes(session.role) && quotation.userId !== session.userId) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 })
    }

    // Check if quotation can be converted
    if (quotation.status !== 'APPROVED' && quotation.status !== 'PENDING') {
      return new NextResponse(JSON.stringify({ error: 'Quotation must be approved or pending to convert' }), { status: 400 })
    }

    if (quotation.convertedToSale) {
      return new NextResponse(JSON.stringify({ error: 'Quotation already converted to sale' }), { status: 400 })
    }

    // Check if quotation has expired
    if (new Date() > quotation.expiresAt) {
      return new NextResponse(JSON.stringify({ error: 'Quotation has expired' }), { status: 400 })
    }

    // Check stock availability
    for (const item of quotation.items) {
      if (item.product.trackInventory && item.quantity > item.product.stock) {
        return new NextResponse(JSON.stringify({
          error: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}`
        }), { status: 400 })
      }
    }

    // Generate sale number
    const lastSale = await prisma.sale.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { saleNumber: true }
    })

    let nextNumber = 1
    if (lastSale?.saleNumber) {
      const match = lastSale.saleNumber.match(/(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }
    const saleNumber = `V${nextNumber.toString().padStart(6, '0')}`

    // Generate NCF with duplicate checking
    const ncfSequence = await prisma.nCFSequence.findFirst({
      where: { type: 'B02', isActive: true },
      orderBy: { updatedAt: 'desc' }
    })

    if (!ncfSequence) {
      return new NextResponse(JSON.stringify({ error: 'No active NCF sequence found for B02' }), { status: 400 })
    }

    // Generate unique NCF
    let currentNumber = ncfSequence.currentNumber
    let ncf = `${ncfSequence.prefix}${currentNumber.toString().padStart(8, '0')}`
    let attempts = 0
    const maxAttempts = 100 // Prevent infinite loop

    while (attempts < maxAttempts) {
      const existingSale = await prisma.sale.findUnique({
        where: { ncf },
        select: { id: true }
      })

      if (!existingSale) {
        break // NCF is unique, we can use it
      }

      // NCF exists, try next number
      currentNumber++
      ncf = `${ncfSequence.prefix}${currentNumber.toString().padStart(8, '0')}`
      attempts++
    }

    if (attempts >= maxAttempts) {
      return new NextResponse(JSON.stringify({ error: 'Unable to generate unique NCF' }), { status: 500 })
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      // Update NCF sequence to the next available number
      await tx.nCFSequence.update({
        where: { id: ncfSequence.id },
        data: { currentNumber: currentNumber + 1 }
      })

      // Create sale
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: quotation.customerId,
          cashierId: session.userId,
          subtotal: quotation.subtotal,
          tax: quotation.tax,
          discount: quotation.discount,
          total: quotation.total,
          ncf,
          ncfType: 'B02',
          paymentMethod,
          notes: notes || quotation.notes,
          items: {
            create: quotation.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              discount: item.discount,
              subtotal: item.subtotal,
              total: item.total
            }))
          }
        }
      })

      // Update stock
      for (const item of quotation.items) {
        if (item.product.trackInventory) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          })

          // Create stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'SALE',
              quantity: -item.quantity,
              reason: `Sale from quotation ${quotation.quotationNumber}`,
              reference: sale.id,
              createdBy: session.userId
            }
          })
        }
      }

      // Update quotation status
      await tx.quotation.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedToSale: true,
          saleId: sale.id
        }
      })

      return sale
    })

    return NextResponse.json({
      success: true,
      sale: result,
      message: 'Quotation converted to sale successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: 'Invalid data', details: error.issues }), { status: 400 })
    }
    console.error('Error converting quotation:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}