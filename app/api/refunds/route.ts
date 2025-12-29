import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { z } from "zod"
import { generateNCF } from "@/lib/ncf"

const RefundItemSchema = z.object({
  saleItemId: z.string(),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
})

const CreateRefundSchema = z.object({
  saleId: z.string(),
  items: z.array(RefundItemSchema).min(1),
  reason: z.string().optional(),
  generateCreditNote: z.boolean().optional().default(false),
})

/**
 * GET /api/refunds - List refunds with pagination and filters
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10), 100)
  const skip = (Math.max(page, 1) - 1) * limit
  const status = url.searchParams.get("status") || undefined
  const startDate = url.searchParams.get("startDate") || undefined
  const endDate = url.searchParams.get("endDate") || undefined

  const where: Record<string, unknown> = {}

  if (status) {
    where.status = status
  }

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)
    where.createdAt = dateFilter
  }

  // Users can only see their own refunds unless admin/manager
  if (!['ADMIN', 'MANAGER'].includes(session.role)) {
    where.userId = session.userId
  }

  try {
    const [items, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sale: {
            select: {
              id: true,
              saleNumber: true,
              ncf: true,
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              rnc: true,
              cedula: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                }
              }
            }
          },
          payments: true,
        }
      }),
      prisma.refund.count({ where })
    ])

    return NextResponse.json({ data: items, total, page, limit })
  } catch (error) {
    console.error('Error fetching refunds:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * POST /api/refunds - Create a new refund
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = CreateRefundSchema.safeParse(body)

  if (!parseResult.success) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }),
      { status: 400 }
    )
  }

  const data = parseResult.data

  try {
    // Get the original sale
    const sale = await prisma.sale.findUnique({
      where: { id: data.saleId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true,
      }
    })

    if (!sale) {
      return new NextResponse(
        JSON.stringify({ error: 'Sale not found' }),
        { status: 404 }
      )
    }

    // Validate that all items belong to the sale and check quantities
    const refundItems: Array<{
      productId: string
      quantity: number
      unitPrice: number
      taxRate: number
      subtotal: number
      total: number
    }> = []
    let subtotal = 0

    for (const refundItem of data.items) {
      const saleItem = sale.items.find(item => item.id === refundItem.saleItemId)
      if (!saleItem) {
        return new NextResponse(
          JSON.stringify({ error: `Sale item ${refundItem.saleItemId} not found in sale` }),
          { status: 400 }
        )
      }

      // Check if quantity to refund doesn't exceed sold quantity
      if (refundItem.quantity > saleItem.quantity) {
        return new NextResponse(
          JSON.stringify({
            error: `Cannot refund ${refundItem.quantity} units of ${saleItem.product.name}. Only ${saleItem.quantity} were sold.`
          }),
          { status: 400 }
        )
      }

      const itemSubtotal = refundItem.quantity * saleItem.unitPrice
      const itemTax = itemSubtotal * saleItem.taxRate
      const itemTotal = itemSubtotal + itemTax

      subtotal += itemSubtotal

      refundItems.push({
        productId: saleItem.productId,
        quantity: refundItem.quantity,
        unitPrice: saleItem.unitPrice,
        taxRate: saleItem.taxRate,
        subtotal: itemSubtotal,
        total: itemTotal,
      })
    }

    const tax = refundItems.reduce((sum: number, item: { subtotal: number; taxRate: number }) => sum + (item.subtotal * item.taxRate), 0)
    const total = subtotal + tax

    // Generate refund number
    const refundCount = await prisma.refund.count()
    const refundNumber = `REF-${(refundCount + 1).toString().padStart(8, '0')}`

    // Generate credit note NCF automatically for all refunds (DGII compliance)
    let ncf: string | null = null
    try {
      ncf = await generateNCF('B04')
      console.log(`Generated NCF ${ncf} for refund ${refundNumber}`)
    } catch (error) {
      console.error('Error generating NCF for refund:', error)
      // Continue without NCF but log the error
      // This allows refunds to proceed even if NCF generation fails
    }

    // Create refund with items in a transaction
    const refund = await prisma.$transaction(async (tx) => {
      // Create the refund
      const newRefund = await tx.refund.create({
        data: {
          refundNumber,
          saleId: data.saleId,
          customerId: sale.customerId,
          userId: session.userId,
          subtotal,
          tax,
          total,
          reason: data.reason,
          ncf,
          ncfType: ncf ? 'B04' : null, // Set NCF type if NCF was generated
          status: 'COMPLETED',
          items: {
            create: refundItems
          },
          payments: {
            create: {
              amount: total,
              method: sale.paymentMethod, // Refund using same method as original sale
              status: 'COMPLETED',
            }
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          sale: {
            select: {
              id: true,
              saleNumber: true,
              ncf: true,
            }
          },
          customer: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          },
          payments: true,
        }
      })

      // Update product stock and create stock movements for refunded items
      for (const item of refundItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        })

        if (product && product.trackInventory) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } } // Add back to stock
          })

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'REFUND',
              quantity: item.quantity,
              reference: newRefund.id,
              createdBy: session.userId,
            }
          })
        }
      }

      // Update sale status to REFUNDED if all items are refunded
      const totalRefunded = await tx.refundItem.aggregate({
        where: { refund: { saleId: data.saleId } },
        _sum: { quantity: true }
      })

      const totalSold = sale.items.reduce((sum, item) => sum + item.quantity, 0)
      const totalRefundedQuantity = totalRefunded._sum.quantity || 0

      if (totalRefundedQuantity >= totalSold) {
        await tx.sale.update({
          where: { id: data.saleId },
          data: { status: 'REFUNDED' }
        })
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'CREATE',
          entity: 'Refund',
          entityId: newRefund.id,
          newValue: JSON.stringify({
            refundNumber: newRefund.refundNumber,
            total: newRefund.total,
            saleId: newRefund.saleId,
            ncf: newRefund.ncf,
            ncfType: newRefund.ncfType,
            reason: newRefund.reason
          })
        }
      })

      return newRefund
    })

    return new NextResponse(JSON.stringify(refund), { status: 201 })
  } catch (error) {
    console.error('Error creating refund:', error)

    // Handle NCF generation errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as { message: string }).message
      if (errorMessage.includes('NCF')) {
        return new NextResponse(
          JSON.stringify({ error: errorMessage }),
          { status: 400 }
        )
      }
    }

    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}