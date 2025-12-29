import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const url = new URL(request.url)
  const type = url.searchParams.get("type") || "summary" // summary, low_stock, movements, by_category

  try {
    switch (type) {
      case "summary":
        const summary = await getInventorySummary()
        return NextResponse.json(summary)

      case "low_stock":
        const lowStock = await getLowStockProducts()
        return NextResponse.json(lowStock)

      case "movements":
        const startDate = url.searchParams.get("startDate")
        const endDate = url.searchParams.get("endDate")
        const dateFilter = startDate && endDate ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : {}
        const movements = await getStockMovements(dateFilter)
        return NextResponse.json(movements)

      case "by_category":
        const byCategory = await getInventoryByCategory()
        return NextResponse.json(byCategory)

      default:
        return new NextResponse(JSON.stringify({ error: "Invalid type" }), { status: 400 })
    }
  } catch (error) {
    console.error('Error generating inventory report:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

async function getInventorySummary() {
  const [totalProducts, totalValue, lowStockCount, outOfStockCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.aggregate({
      where: { isActive: true },
      _sum: { stock: true, cost: true }
    }),
    prisma.product.count({
      where: {
        isActive: true,
        stock: { lte: prisma.product.fields.minStock }
      }
    }),
    prisma.product.count({
      where: {
        isActive: true,
        stock: 0
      }
    })
  ])

  // Calculate total value (stock * cost)
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { stock: true, cost: true }
  })
  const totalInventoryValue = products.reduce((sum: number, product: { stock: number; cost: number }) => sum + (product.stock * product.cost), 0)

  return {
    totalProducts,
    totalInventoryValue,
    lowStockCount,
    outOfStockCount,
    averageStock: totalProducts > 0 ? (totalValue._sum.stock || 0) / totalProducts : 0
  }
}

async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
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
      category: true
    },
    orderBy: { stock: 'asc' }
  })

  return products
}

async function getStockMovements(dateFilter: { createdAt?: { gte: Date; lte: Date } }) {
  const movements = await prisma.stockMovement.findMany({
    where: dateFilter,
    include: {
      product: {
        select: { name: true, sku: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return movements
}

async function getInventoryByCategory() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      category: true,
      stock: true,
      cost: true
    }
  })

interface CategorySummary {
  category: string
  totalProducts: number
  totalStock: number
  totalValue: number
}

  const grouped = products.reduce((acc, product) => {
    const category = product.category || 'Sin Categoría'
    if (!acc[category]) {
      acc[category] = {
        category,
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0
      }
    }
    acc[category].totalProducts += 1
    acc[category].totalStock += product.stock
    acc[category].totalValue += product.stock * product.cost
    return acc
  }, {} as Record<string, CategorySummary>)

  return Object.values(grouped).sort((a: CategorySummary, b: CategorySummary) => b.totalValue - a.totalValue)
}