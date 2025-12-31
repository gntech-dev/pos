import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"

interface CustomerAnalytics {
  totalCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  topCustomersByRevenue: Array<{
    id: string
    name: string
    totalSpent: number
    totalPurchases: number
    lastPurchaseDate: string | null
  }>
  customerGrowth: Array<{
    month: string
    count: number
  }>
  customerRetention: {
    retained: number
    churned: number
    retentionRate: number
  }
  averageOrderValue: number
  customerLifetimeValue: {
    average: number
    highest: number
    lowest: number
  }
  customerSegments: {
    vip: number // > 100,000 RD$
    regular: number // 10,000 - 100,000 RD$
    occasional: number // < 10,000 RD$
  }
  geographicDistribution: Array<{
    region: string
    count: number
    percentage: number
  }>
  purchaseFrequency: {
    daily: number
    weekly: number
    monthly: number
    quarterly: number
    annually: number
  }
}

/**
 * GET /api/customers/analytics - Get comprehensive customer analytics
 */
export async function GET(_request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    // Get basic customer counts
    const [totalCustomers, newCustomersThisMonth] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({
        where: {
          createdAt: {
            gte: currentMonth
          }
        }
      })
    ])

    // Get active customers (customers with purchases in the last 6 months)
    const activeCustomers = await prisma.customer.count({
      where: {
        sales: {
          some: {
            status: 'COMPLETED',
            createdAt: {
              gte: sixMonthsAgo
            }
          }
        }
      }
    })

    // Get top customers by revenue
    const topCustomersByRevenue = await prisma.customer.findMany({
      take: 10,
      include: {
        _count: {
          select: {
            sales: {
              where: {
                status: 'COMPLETED'
              }
            }
          }
        },
        sales: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            total: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        sales: {
          _count: 'desc'
        }
      }
    })

    const topCustomersFormatted = topCustomersByRevenue.map(customer => {
      const totalSpent = customer.sales.reduce((sum, sale) => sum + sale.total, 0)
      const lastPurchaseDate = customer.sales.length > 0 ? customer.sales[0].createdAt.toISOString() : null

      return {
        id: customer.id,
        name: customer.name,
        totalSpent,
        totalPurchases: customer._count.sales,
        lastPurchaseDate
      }
    }).filter(customer => customer.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)

    // Customer growth over last 12 months
    const customerGrowth = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const count = await prisma.customer.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      })

      customerGrowth.push({
        month: monthStart.toLocaleDateString('es-DO', { month: 'short', year: 'numeric' }),
        count
      })
    }

    // Customer retention (simplified - customers who purchased in both last month and this month)
    const lastMonthPurchasers = await prisma.customer.findMany({
      where: {
        sales: {
          some: {
            status: 'COMPLETED',
            createdAt: {
              gte: lastMonth,
              lt: currentMonth
            }
          }
        }
      },
      select: { id: true }
    })

    const currentMonthPurchasers = await prisma.customer.findMany({
      where: {
        sales: {
          some: {
            status: 'COMPLETED',
            createdAt: {
              gte: currentMonth
            }
          }
        }
      },
      select: { id: true }
    })

    const retainedCustomerIds = lastMonthPurchasers
      .filter(customer => currentMonthPurchasers.some(curr => curr.id === customer.id))
      .map(customer => customer.id)

    const retained = retainedCustomerIds.length
    const churned = lastMonthPurchasers.length - retained
    const retentionRate = lastMonthPurchasers.length > 0 ? (retained / lastMonthPurchasers.length) * 100 : 0

    // Average order value
    const salesData = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED'
      },
      select: {
        total: true
      }
    })

    const averageOrderValue = salesData.length > 0
      ? salesData.reduce((sum, sale) => sum + sale.total, 0) / salesData.length
      : 0

    // Customer lifetime value
    const customerTotals = await prisma.customer.findMany({
      include: {
        sales: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            total: true
          }
        }
      }
    })

    const lifetimeValues = customerTotals
      .map(customer => customer.sales.reduce((sum, sale) => sum + sale.total, 0))
      .filter(value => value > 0)
      .sort((a, b) => b - a)

    const customerLifetimeValue = {
      average: lifetimeValues.length > 0 ? lifetimeValues.reduce((sum, val) => sum + val, 0) / lifetimeValues.length : 0,
      highest: lifetimeValues.length > 0 ? lifetimeValues[0] : 0,
      lowest: lifetimeValues.length > 0 ? lifetimeValues[lifetimeValues.length - 1] : 0
    }

    // Customer segments by spending
    const customerSegments = {
      vip: customerTotals.filter(customer => {
        const total = customer.sales.reduce((sum, sale) => sum + sale.total, 0)
        return total > 100000 // > 100,000 RD$
      }).length,
      regular: customerTotals.filter(customer => {
        const total = customer.sales.reduce((sum, sale) => sum + sale.total, 0)
        return total >= 10000 && total <= 100000 // 10,000 - 100,000 RD$
      }).length,
      occasional: customerTotals.filter(customer => {
        const total = customer.sales.reduce((sum, sale) => sum + sale.total, 0)
        return total > 0 && total < 10000 // < 10,000 RD$
      }).length
    }

    // Geographic distribution (simplified - based on address patterns)
    const customersWithAddresses = await prisma.customer.findMany({
      where: {
        address: {
          not: null
        }
      },
      select: {
        address: true
      }
    })

    const regionMap: Record<string, number> = {}
    customersWithAddresses.forEach(customer => {
      if (customer.address) {
        // Simple region detection based on common Dominican regions
        const address = customer.address.toLowerCase()
        let region = 'Otro'

        if (address.includes('santo domingo') || address.includes('distrito nacional')) {
          region = 'Santo Domingo'
        } else if (address.includes('santiago')) {
          region = 'Santiago'
        } else if (address.includes('la romana') || address.includes('miches') || address.includes('higuey')) {
          region = 'Este'
        } else if (address.includes('puerto plata') || address.includes('nagua') || address.includes('samana')) {
          region = 'Norte'
        } else if (address.includes('barahona') || address.includes('neyba')) {
          region = 'Sur'
        }

        regionMap[region] = (regionMap[region] || 0) + 1
      }
    })

    const totalWithAddresses = customersWithAddresses.length
    const geographicDistribution = Object.entries(regionMap)
      .map(([region, count]) => ({
        region,
        count,
        percentage: totalWithAddresses > 0 ? (count / totalWithAddresses) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)

    // Purchase frequency analysis
    const customerPurchaseFrequency = await prisma.customer.findMany({
      include: {
        sales: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            createdAt: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    const frequencyCounts = {
      daily: 0,
      weekly: 0,
      monthly: 0,
      quarterly: 0,
      annually: 0
    }

    customerPurchaseFrequency.forEach(customer => {
      if (customer.sales.length < 2) return

      const firstPurchase = customer.sales[0].createdAt
      const lastPurchase = customer.sales[customer.sales.length - 1].createdAt
      const daysBetween = (lastPurchase.getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24)
      const purchases = customer.sales.length

      if (daysBetween === 0) return // Same day purchase

      const avgDaysBetweenPurchases = daysBetween / (purchases - 1)

      if (avgDaysBetweenPurchases <= 1) {
        frequencyCounts.daily++
      } else if (avgDaysBetweenPurchases <= 7) {
        frequencyCounts.weekly++
      } else if (avgDaysBetweenPurchases <= 30) {
        frequencyCounts.monthly++
      } else if (avgDaysBetweenPurchases <= 90) {
        frequencyCounts.quarterly++
      } else {
        frequencyCounts.annually++
      }
    })

    const analytics: CustomerAnalytics = {
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      topCustomersByRevenue: topCustomersFormatted,
      customerGrowth,
      customerRetention: {
        retained,
        churned,
        retentionRate
      },
      averageOrderValue,
      customerLifetimeValue,
      customerSegments,
      geographicDistribution,
      purchaseFrequency: frequencyCounts
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching customer analytics:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch analytics' }), { status: 500 })
  }
}