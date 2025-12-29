import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    // Get basic metrics
    const [
      totalUsers,
      totalProducts,
      totalSales,
      recentSales
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.sale.count(),
      prisma.sale.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ])

    // Calculate revenue for today
    const todayRevenue = await prisma.sale.aggregate({
      _sum: {
        total: true
      },
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metrics: {
        users: {
          total: totalUsers
        },
        products: {
          total: totalProducts
        },
        sales: {
          total: totalSales,
          today: recentSales,
          revenue_today: todayRevenue._sum.total || 0
        }
      }
    })
  } catch (error) {
    console.error('Metrics fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}