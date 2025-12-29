import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"

interface DateFilter {
  createdAt?: {
    gte: Date
    lte: Date
  }
}

interface DailySales {
  date: string
  totalSales: number
  totalRevenue: number
  totalTax: number
  totalItems: number
}

interface CustomerSales {
  customerId: string
  customerName: string
  totalSales: number
  totalRevenue: number
  totalTax: number
  totalItems: number
}

interface ProductSales {
  productId: string
  productName: string
  productSku: string
  totalQuantity: number
  totalRevenue: number
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const url = new URL(request.url)
  const type = url.searchParams.get("type") || "summary" // summary, by_date, by_customer, by_product
  const startDate = url.searchParams.get("startDate")
  const endDate = url.searchParams.get("endDate")

  const dateFilter = startDate && endDate ? {
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  } : {}

  try {
    switch (type) {
      case "summary":
        const summary = await getSalesSummary(dateFilter)
        return NextResponse.json(summary)

      case "by_date":
        const byDate = await getSalesByDate(dateFilter)
        return NextResponse.json(byDate)

      case "by_customer":
        const byCustomer = await getSalesByCustomer(dateFilter)
        return NextResponse.json(byCustomer)

      case "by_product":
        const byProduct = await getSalesByProduct(dateFilter)
        return NextResponse.json(byProduct)

      default:
        return new NextResponse(JSON.stringify({ error: "Invalid type" }), { status: 400 })
    }
  } catch (error) {
    console.error('Error generating sales report:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

async function getSalesSummary(dateFilter: DateFilter) {
  const [totalSales, totalRevenue, totalTax, totalItems] = await Promise.all([
    prisma.sale.count({ where: dateFilter }),
    prisma.sale.aggregate({
      where: dateFilter,
      _sum: { total: true }
    }),
    prisma.sale.aggregate({
      where: dateFilter,
      _sum: { tax: true }
    }),
    prisma.saleItem.aggregate({
      where: {
        sale: dateFilter
      },
      _sum: { quantity: true }
    })
  ])

  return {
    totalSales: totalSales,
    totalRevenue: totalRevenue._sum.total || 0,
    totalTax: totalTax._sum.tax || 0,
    totalItems: totalItems._sum.quantity || 0,
    averageTicket: totalSales > 0 ? (totalRevenue._sum.total || 0) / totalSales : 0
  }
}

async function getSalesByDate(dateFilter: DateFilter) {
  const sales = await prisma.sale.findMany({
    where: dateFilter,
    select: {
      createdAt: true,
      total: true,
      tax: true,
      _count: {
        select: { items: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  // Group by date
  const grouped = sales.reduce((acc: Record<string, DailySales>, sale: { createdAt: Date; total: number; tax: number; _count: { items: number } }) => {
    const date = sale.createdAt.toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = {
        date,
        totalSales: 0,
        totalRevenue: 0,
        totalTax: 0,
        totalItems: 0
      }
    }
    acc[date].totalSales += 1
    acc[date].totalRevenue += sale.total
    acc[date].totalTax += sale.tax
    acc[date].totalItems += sale._count.items
    return acc
  }, {} as Record<string, DailySales>)

  return Object.values(grouped)
}

async function getSalesByCustomer(dateFilter: DateFilter) {
  const sales = await prisma.sale.findMany({
    where: {
      ...dateFilter,
      customerId: { not: null }
    },
    include: {
      customer: {
        select: { id: true, name: true }
      },
      _count: {
        select: { items: true }
      }
    }
  })

  const grouped = sales.reduce((acc: Record<string, CustomerSales>, sale: { customerId: string | null; total: number; tax: number; customer: { id: string; name: string } | null; _count: { items: number } }) => {
    const customerId = sale.customerId!
    if (!acc[customerId]) {
      acc[customerId] = {
        customerId,
        customerName: sale.customer!.name,
        totalSales: 0,
        totalRevenue: 0,
        totalTax: 0,
        totalItems: 0
      }
    }
    acc[customerId].totalSales += 1
    acc[customerId].totalRevenue += sale.total
    acc[customerId].totalTax += sale.tax
    acc[customerId].totalItems += sale._count.items
    return acc
  }, {} as Record<string, CustomerSales>)

  return (Object.values(grouped) as CustomerSales[]).sort((a, b) => b.totalRevenue - a.totalRevenue)
}

async function getSalesByProduct(dateFilter: DateFilter) {
  const items = await prisma.saleItem.findMany({
    where: {
      sale: dateFilter
    },
    include: {
      product: {
        select: { id: true, name: true, sku: true }
      }
    }
  })

  const grouped = items.reduce((acc: Record<string, ProductSales>, item: { productId: string; quantity: number; total: number; product: { id: string; name: string; sku: string } }) => {
    const productId = item.productId
    if (!acc[productId]) {
      acc[productId] = {
        productId,
        productName: item.product!.name,
        productSku: item.product!.sku,
        totalQuantity: 0,
        totalRevenue: 0
      }
    }
    acc[productId].totalQuantity += item.quantity
    acc[productId].totalRevenue += item.total
    return acc
  }, {} as Record<string, ProductSales>)

  return (Object.values(grouped) as ProductSales[]).sort((a, b) => b.totalRevenue - a.totalRevenue)
}