import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/session'

interface ChartDataPoint {
  date: string;
  revenue?: number;
  sales?: number;
  products?: number;
  tax?: number;
  profit?: number;
  customers?: number;
}

interface SummaryData {
  revenue?: number;
  sales?: number;
  products?: number;
  tax?: number;
  profit?: number;
  customers?: number;
}

interface PieDataPoint {
  name: string;
  value: number;
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  // Only admins and managers can access advanced reports
  if (!['ADMIN', 'MANAGER'].includes(session.role)) {
    return new NextResponse(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const metrics = searchParams.get('metrics')?.split(',') || ['revenue', 'sales']
    const range = searchParams.get('range') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Build the data based on requested metrics
    const chartData: ChartDataPoint[] = []
    const summary: SummaryData = {}

    // Generate date points for the chart
    const datePoints = []
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      datePoints.push(date)
    }

    // Fetch data for each date point
    for (const date of datePoints) {
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      const dataPoint: ChartDataPoint = { date: dateStr }

      // Revenue
      if (metrics.includes('revenue')) {
        const revenueResult = await prisma.sale.aggregate({
          _sum: { total: true },
          where: {
            createdAt: {
              gte: date,
              lt: nextDay
            }
          }
        })
        dataPoint.revenue = revenueResult._sum.total || 0
      }

      // Sales count
      if (metrics.includes('sales')) {
        const salesCount = await prisma.sale.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDay
            }
          }
        })
        dataPoint.sales = salesCount
      }

      // Customers
      if (metrics.includes('customers')) {
        const customerCount = await prisma.customer.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDay
            }
          }
        })
        dataPoint.customers = customerCount
      }

      // Products sold
      if (metrics.includes('products')) {
        const productsResult = await prisma.saleItem.aggregate({
          _sum: { quantity: true },
          where: {
            sale: {
              createdAt: {
                gte: date,
                lt: nextDay
              }
            }
          }
        })
        dataPoint.products = productsResult._sum.quantity || 0
      }

      // Tax
      if (metrics.includes('tax')) {
        const taxResult = await prisma.sale.aggregate({
          _sum: { tax: true },
          where: {
            createdAt: {
              gte: date,
              lt: nextDay
            }
          }
        })
        dataPoint.tax = taxResult._sum.tax || 0
      }

      // Profit (simplified - revenue minus cost if available)
      if (metrics.includes('profit')) {
        const revenueResult = await prisma.sale.aggregate({
          _sum: { total: true },
          where: {
            createdAt: {
              gte: date,
              lt: nextDay
            }
          }
        })
        // For now, assume profit is 70% of revenue (this could be enhanced with actual cost data)
        dataPoint.profit = (revenueResult._sum.total || 0) * 0.7
      }

      chartData.push(dataPoint)
    }

    // Calculate summary statistics
    for (const metric of metrics) {
      if (metric === 'revenue') {
        const totalRevenue = await prisma.sale.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: startDate } }
        })
        summary.revenue = totalRevenue._sum.total || 0
      }

      if (metric === 'sales') {
        const totalSales = await prisma.sale.count({
          where: { createdAt: { gte: startDate } }
        })
        summary.sales = totalSales
      }

      if (metric === 'customers') {
        const totalCustomers = await prisma.customer.count({
          where: { createdAt: { gte: startDate } }
        })
        summary.customers = totalCustomers
      }

      if (metric === 'products') {
        const totalProducts = await prisma.saleItem.aggregate({
          _sum: { quantity: true },
          where: {
            sale: { createdAt: { gte: startDate } }
          }
        })
        summary.products = totalProducts._sum.quantity || 0
      }

      if (metric === 'tax') {
        const totalTax = await prisma.sale.aggregate({
          _sum: { tax: true },
          where: { createdAt: { gte: startDate } }
        })
        summary.tax = totalTax._sum.tax || 0
      }

      if (metric === 'profit') {
        const totalRevenue = await prisma.sale.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: startDate } }
        })
        summary.profit = (totalRevenue._sum.total || 0) * 0.7
      }
    }

    // Generate pie chart data for categorical analysis
    let pieData: PieDataPoint[] = []

    if (metrics.includes('products')) {
      // Top products by sales
      const topProducts = await prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      })

      const productDetails = await Promise.all(
        topProducts.map(async (item: { productId: string; _sum: { quantity: number | null } }) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true }
          })
          return {
            name: product?.name || 'Producto desconocido',
            value: item._sum.quantity || 0
          }
        })
      )

      pieData = productDetails
    } else if (metrics.includes('customers')) {
      // Customer distribution by region (if available)
      // For now, just show total customers
      pieData = [{ name: 'Clientes Activos', value: summary.customers || 0 }]
    }

    return NextResponse.json({
      chartData,
      summary,
      pieData,
      metadata: {
        dateRange: { start: startDate.toISOString(), end: now.toISOString() },
        metrics,
        totalDataPoints: chartData.length
      }
    })

  } catch (error) {
    console.error('Error generating advanced report:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}