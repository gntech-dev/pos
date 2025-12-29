import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"

const QuotationItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().optional().default(0),
})

const CreateQuotationSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(QuotationItemSchema).min(1),
  discount: z.number().nonnegative().optional().default(0),
  expiresAt: z.string().optional(), // ISO date string
  notes: z.string().optional(),
})

/**
 * GET /api/quotations - List quotations with pagination and filters
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
  const customerId = url.searchParams.get("customerId") || undefined
  const startDate = url.searchParams.get("startDate") || undefined
  const endDate = url.searchParams.get("endDate") || undefined

  const where: Record<string, unknown> = {}

  if (status) {
    where.status = status
  }

  if (customerId) {
    where.customerId = customerId
  }

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)
    where.createdAt = dateFilter
  }

  // Users can only see their own quotations unless admin/manager
  if (!['ADMIN', 'MANAGER'].includes(session.role)) {
    where.userId = session.userId
  }

  try {
    const [items, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
        }
      }),
      prisma.quotation.count({ where })
    ])

    return NextResponse.json({ data: items, total, page, limit })
  } catch (error) {
    console.error('Error fetching quotations:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * POST /api/quotations - Create a new quotation
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = CreateQuotationSchema.safeParse(body)

  if (!parseResult.success) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }),
      { status: 400 }
    )
  }

  const data = parseResult.data

  try {
    // Validate products exist
    const productIds = data.items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    if (products.length !== productIds.length) {
      return new NextResponse(
        JSON.stringify({ error: 'One or more products not found' }),
        { status: 404 }
      )
    }

    // Calculate totals
    let subtotal = 0
    const quotationItems = data.items.map(item => {
      const product = products.find((p) => p.id === item.productId)!
      const itemSubtotal = item.quantity * item.unitPrice - item.discount
      const itemTax = itemSubtotal * product.taxRate
      const itemTotal = itemSubtotal + itemTax

      subtotal += itemSubtotal

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: product.taxRate,
        discount: item.discount,
        subtotal: itemSubtotal,
        total: itemTotal,
      }
    })

    const tax = quotationItems.reduce((sum: number, item: { subtotal: number; taxRate: number }) => sum + (item.subtotal * item.taxRate), 0)
    const total = subtotal + tax - data.discount

    // Generate quotation number
    const quotationCount = await prisma.quotation.count()
    const quotationNumber = `QUOT-${(quotationCount + 1).toString().padStart(8, '0')}`

    // Set expiry date (default 30 days if not provided)
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Create quotation with items
    const quotation = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      // Create the quotation
      const newQuotation = await tx.quotation.create({
        data: {
          quotationNumber,
          userId: session.userId,
          ...(typeof data.customerId === 'string' && data.customerId.length > 0 ? { customerId: data.customerId } : {}),
          subtotal,
          tax,
          discount: data.discount,
          total,
          status: 'PENDING',
          expiresAt,
          notes: data.notes,
          items: {
            create: quotationItems
          }
        },
        include: {
          items: {
            include: {
              product: true
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
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'CREATE',
          entity: 'Quotation',
          entityId: newQuotation.id,
          newValue: JSON.stringify({
            quotationNumber: newQuotation.quotationNumber,
            total: newQuotation.total,
          })
        }
      })

      return newQuotation
    })

    return new NextResponse(JSON.stringify(quotation), { status: 201 })
  } catch (error) {
    console.error('Error creating quotation:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}