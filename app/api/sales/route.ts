import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { generateNCF, getNCFType } from "@/lib/ncf"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"

const SaleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().optional().default(0),
})

const CreateSaleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(SaleItemSchema).min(1),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'MIXED', 'CHECK', 'OTHER']),
  discount: z.number().nonnegative().optional().default(0),
  notes: z.string().optional(),
  generateNCF: z.boolean().optional().default(true),
})

/**
 * GET /api/sales - List sales with pagination and filters
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
  const search = url.searchParams.get("search") || undefined
  const customerSearch = url.searchParams.get("customerSearch") || undefined

  let where: Record<string, unknown> = {}

  if (status) {
    where.status = status
  }

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)
    where.createdAt = dateFilter
  }

  // Search functionality
  if (search) {
    where.OR = [
      { saleNumber: { contains: search, mode: 'insensitive' } },
      { ncf: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Customer search functionality
  if (customerSearch) {
    // Create a more complex OR condition for customer search
    const customerConditions = [
      { customer: { name: { contains: customerSearch } } },
      { customer: { name: { contains: customerSearch.toLowerCase() } } },
      { customer: { name: { contains: customerSearch.toUpperCase() } } },
      { customer: { rnc: { contains: customerSearch } } },
      { customer: { cedula: { contains: customerSearch } } },
    ]

    // Add to existing where conditions
    if (where.OR) {
      // If there's already an OR, we need to combine them
      where = {
        AND: [
          where,
          { OR: customerConditions }
        ]
      }
    } else {
      where.OR = customerConditions
    }
  }

  // Cashiers can only see their own sales
  if (session.role === 'CASHIER') {
    where.cashierId = session.userId
  }

  try {
    const [items, total] = await Promise.all([
      prisma.sale.findMany({
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
          cashier: {
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
      prisma.sale.count({ where })
    ])

    return NextResponse.json({ data: items, total, page, limit })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * POST /api/sales - Create a new sale
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = CreateSaleSchema.safeParse(body)
  
  if (!parseResult.success) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }), 
      { status: 400 }
    )
  }

  const data = parseResult.data

  console.log('Sale data received:', { customerId: data.customerId, customerIdType: typeof data.customerId })

  try {
    // Validate products exist and have sufficient stock
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

    // Check stock availability
    for (const item of data.items) {
      const product = products.find((p: { id: string; trackInventory: boolean; stock: number; name: string }) => p.id === item.productId)
      if (!product) continue

      if (product.trackInventory && product.stock < item.quantity) {
        return new NextResponse(
          JSON.stringify({
            error: `Insufficient stock for product: ${product.name}`,
            productId: product.id,
            available: product.stock,
            requested: item.quantity
          }),
          { status: 400 }
        )
      }
    }

    // Calculate totals
    let subtotal = 0
    const saleItems = data.items.map(item => {
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

    const tax = saleItems.reduce((sum: number, item: { subtotal: number; taxRate: number }) => sum + (item.subtotal * item.taxRate), 0)
    const total = subtotal + tax - data.discount

    // Generate sale number
    const saleCount = await prisma.sale.count()
    const saleNumber = `SALE-${(saleCount + 1).toString().padStart(8, '0')}`

    // Generate NCF if requested and customer has RNC
    let ncf: string | null = null
    let ncfType: string | null = null

    if (data.generateNCF && data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
      })

      if (customer) {
        const hasRNC = !!customer.rnc
        ncfType = getNCFType(hasRNC)
        if (ncfType) {
          ncf = await generateNCF(ncfType as 'B01' | 'B02' | 'B14' | 'B15' | 'B16')
        }
      }
    } else if (data.generateNCF) {
      // Consumer invoice (B02) for walk-in customers
      ncfType = 'B02'
      ncf = await generateNCF('B02')
    }

    // Create sale with items in a transaction
    const sale = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      // Create the sale
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          cashierId: session.userId,
          ...(typeof data.customerId === 'string' && data.customerId.length > 0 ? { customerId: data.customerId } : {}),
          subtotal,
          tax,
          discount: data.discount,
          total,
          status: 'COMPLETED',
          ncf,
          ncfType,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          items: {
            create: saleItems
          },
          payments: {
            create: {
              amount: total,
              method: data.paymentMethod,
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
          customer: true,
          cashier: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          },
          payments: true,
        }
      })

      // Update product stock and create stock movements
      for (const item of data.items) {
        const product = products.find((p) => p.id === item.productId)!
        
        if (product.trackInventory) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          })

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'SALE',
              quantity: -item.quantity,
              reason: `Venta ${newSale.saleNumber}`,
              reference: newSale.id,
              createdBy: session.userId,
            }
          })
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'CREATE',
          entity: 'Sale',
          entityId: newSale.id,
          newValue: JSON.stringify({
            saleNumber: newSale.saleNumber,
            total: newSale.total,
            ncf: newSale.ncf,
          })
        }
      })

      return newSale
    })

    return new NextResponse(JSON.stringify(sale), { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    
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
