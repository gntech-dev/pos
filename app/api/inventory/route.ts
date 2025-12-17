import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { z } from "zod"
import { getSessionFromCookie } from "../../../lib/session"

const StockAdjustmentSchema = z.object({
  productId: z.string(),
  adjustment: z.number().int(), // Positive for increase, negative for decrease
  reason: z.string().min(1),
  type: z.enum(['ADJUSTMENT', 'PURCHASE', 'LOSS', 'TRANSFER']),
  reference: z.string().optional()
})

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const url = new URL(request.url)
  const type = url.searchParams.get("type") || "all" // all, low_stock, summary

  try {
    switch (type) {
      case "summary":
        const summary = await getInventorySummary()
        return NextResponse.json(summary)

      case "low_stock":
        const lowStock = await getLowStockProducts()
        return NextResponse.json(lowStock)

      case "all":
      default:
        const products = await prisma.product.findMany({
          where: { isActive: true, trackInventory: true },
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            stock: true,
            minStock: true,
            category: true,
            cost: true,
            price: true,
            unit: true,
            stockMovements: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: {
                type: true,
                quantity: true,
                reason: true,
                createdAt: true,
                createdBy: true
              }
            }
          },
          orderBy: { name: 'asc' }
        })
        return NextResponse.json(products)
    }
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = StockAdjustmentSchema.safeParse(body)
  if (!parseResult.success) {
    return new NextResponse(JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }), { status: 400 })
  }

  const { productId, adjustment, reason, type, reference } = parseResult.data

  try {
    // Get current product stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, name: true }
    })

    if (!product) {
      return new NextResponse(JSON.stringify({ error: "Product not found" }), { status: 404 })
    }

    const newStock = product.stock + adjustment

    if (newStock < 0) {
      return new NextResponse(JSON.stringify({ error: "Stock cannot be negative" }), { status: 400 })
    }

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock }
    })

    // Create stock movement record
    const movement = await prisma.stockMovement.create({
      data: {
        productId,
        type,
        quantity: adjustment,
        reason,
        reference,
        createdBy: session.userId
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE',
        entity: 'Product',
        entityId: productId,
        oldValue: JSON.stringify({ stock: product.stock }),
        newValue: JSON.stringify({ stock: newStock })
      }
    })

    return NextResponse.json({
      success: true,
      product: { id: productId, name: product.name, stock: newStock },
      movement
    })

  } catch (error) {
    console.error('Error adjusting stock:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

async function getInventorySummary() {
  const [totalProducts, totalValue, lowStockCount, outOfStockCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true, trackInventory: true } }),
    prisma.product.aggregate({
      where: { isActive: true, trackInventory: true },
      _sum: { stock: true }
    }),
    prisma.product.count({
      where: {
        isActive: true,
        trackInventory: true,
        stock: { lte: prisma.product.fields.minStock }
      }
    }),
    prisma.product.count({
      where: {
        isActive: true,
        trackInventory: true,
        stock: 0
      }
    })
  ])

  // Calculate total value (stock * cost)
  const products = await prisma.product.findMany({
    where: { isActive: true, trackInventory: true },
    select: { stock: true, cost: true }
  })
  const totalInventoryValue = products.reduce((sum, product) => sum + (product.stock * product.cost), 0)

  return {
    totalProducts,
    totalStock: totalValue._sum.stock || 0,
    totalInventoryValue,
    lowStockCount,
    outOfStockCount
  }
}

async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      trackInventory: true,
      OR: [
        { stock: { lte: prisma.product.fields.minStock } },
        { stock: 0 }
      ]
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      minStock: true,
      category: true,
      cost: true
    },
    orderBy: { stock: 'asc' }
  })

  return products
}