import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`Dashboard stats requested by ${session.userId}`)

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's sales total
    const todaySales = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: 'COMPLETED'
      },
      _sum: {
        total: true
      }
    })

    // Get today's transaction count
    const todayTransactions = await prisma.sale.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: 'COMPLETED'
      }
    })

    // Get total products count
    const totalProducts = await prisma.product.count()

    // Get low stock products (less than 10 units)
    const lowStockProducts = await prisma.product.count({
      where: {
        stock: {
          lt: 10
        }
      }
    })

    // Get products with very low stock (less than 5 units)
    const criticalStockProducts = await prisma.product.count({
      where: {
        stock: {
          lt: 5
        }
      }
    })

    // Get yesterday's sales for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayEnd = new Date(today)

    const yesterdaySales = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: yesterday,
          lt: yesterdayEnd
        },
        status: 'COMPLETED'
      },
      _sum: {
        total: true
      }
    })

    // Get average sale amount today
    const todaySalesData = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: 'COMPLETED'
      },
      select: {
        total: true
      }
    })

    const averageSale = todaySalesData.length > 0
      ? todaySalesData.reduce((sum: number, sale: { total: number }) => sum + sale.total, 0) / todaySalesData.length
      : 0

    // Get top selling products (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: {
            gte: thirtyDaysAgo
          },
          status: 'COMPLETED'
        }
      },
      _sum: {
        quantity: true,
        total: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    })

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item: { productId: string; _sum: { quantity: number | null; total: number | null } }) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true }
        })
        return {
          ...item,
          product: product || { name: 'Producto desconocido', sku: '' }
        }
      })
    )

    // Get hourly sales for today
    const hourlySales = []
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(today)
      hourStart.setHours(hour, 0, 0, 0)
      const hourEnd = new Date(hourStart)
      hourEnd.setHours(hour + 1, 0, 0, 0)

      const hourData = await prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: hourStart,
            lt: hourEnd
          },
          status: 'COMPLETED'
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      })

      hourlySales.push({
        hour,
        total: hourData._sum.total || 0,
        count: hourData._count.id || 0
      })
    }

    // Calculate growth percentage
    const yesterdayTotal = yesterdaySales._sum.total || 0
    const todayTotal = todaySales._sum.total || 0
    const growthPercentage = yesterdayTotal > 0 
      ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 
      : todayTotal > 0 ? 100 : 0

    // Get recent sales for additional context
    const recentSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: today
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        total: true,
        createdAt: true,
        customer: {
          select: {
            name: true
          }
        }
      }
    })

    // Get weekly sales trend (last 7 days)
    const weeklySales = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const daySales = await prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          },
          status: 'COMPLETED'
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      })

      weeklySales.push({
        date: date.toISOString().split('T')[0],
        total: daySales._sum.total || 0,
        count: daySales._count.id || 0
      })
    }

    const stats = {
      todaySales: {
        total: todaySales._sum.total || 0,
        formatted: `RD$ ${(todaySales._sum.total || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
      },
      todayTransactions,
      totalProducts,
      lowStockProducts,
      criticalStockProducts,
      recentSales,
      weeklySales,
      averageSale,
      topProducts: topProductsWithDetails,
      hourlySales,
      growthPercentage,
      yesterdaySales: {
        total: yesterdaySales._sum.total || 0,
        formatted: `RD$ ${(yesterdaySales._sum.total || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
      },
      lastUpdated: new Date().toISOString()
    }

    console.log('Dashboard stats calculated:', stats)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to get dashboard stats',
        message,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}