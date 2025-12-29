import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const url = new URL(request.url)
  const type = url.searchParams.get("type") || "summary" // summary, by_activity, top_customers

  try {
    switch (type) {
      case "summary":
        const summary = await getCustomerSummary()
        return NextResponse.json(summary)

      case "by_activity":
        const byActivity = await getCustomersByActivity()
        return NextResponse.json(byActivity)

      case "top_customers":
        const topCustomers = await getTopCustomers()
        return NextResponse.json(topCustomers)

      default:
        return new NextResponse(JSON.stringify({ error: "Invalid type" }), { status: 400 })
    }
  } catch (error) {
    console.error('Error generating customer report:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

async function getCustomerSummary() {
  const [totalCustomers, activeCustomers, customersWithSales, averageSalesPerCustomer] = await Promise.all([
    prisma.customer.count(),
    // Customers with sales in last 30 days
    prisma.customer.count({
      where: {
        sales: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    }),
    // Customers with any sales
    prisma.customer.count({
      where: {
        sales: {
          some: {}
        }
      }
    }),
    // Average sales per customer
    prisma.sale.aggregate({
      _sum: { total: true }
    }).then((result: { _sum: { total: number | null } }) => {
      return prisma.customer.count().then((count: number) => {
        return count > 0 ? (result._sum.total || 0) / count : 0
      })
    })
  ])

  return {
    totalCustomers,
    activeCustomers,
    customersWithSales,
    averageSalesPerCustomer
  }
}

async function getCustomersByActivity() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          sales: true,
          quotations: true
        }
      },
      sales: {
        select: {
          total: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  const categorized = customers.map(customer => {
    const lastSale = customer.sales[0]
    const daysSinceLastSale = lastSale
      ? Math.floor((Date.now() - new Date(lastSale.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : null

    let activityLevel = 'Nuevo'
    if (daysSinceLastSale === null) {
      activityLevel = 'Sin Compras'
    } else if (daysSinceLastSale <= 30) {
      activityLevel = 'Activo'
    } else if (daysSinceLastSale <= 90) {
      activityLevel = 'Regular'
    } else {
      activityLevel = 'Inactivo'
    }

    return {
      id: customer.id,
      name: customer.name,
      totalSales: customer._count.sales,
      totalQuotations: customer._count.quotations,
      lastSaleDate: lastSale?.createdAt || null,
      daysSinceLastSale,
      activityLevel
    }
  })

  return categorized
}

async function getTopCustomers() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          sales: true
        }
      },
      sales: {
        select: {
          total: true
        }
      }
    }
  })

  const withTotals = customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    totalSales: customer._count.sales,
    totalRevenue: customer.sales.reduce((sum: number, sale: { total: number }) => sum + sale.total, 0)
  }))

  return withTotals
    .filter(c => c.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 20)
}