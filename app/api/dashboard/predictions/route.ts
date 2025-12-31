import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// Simple linear regression for forecasting
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length
  const sumX = data.reduce((sum, point) => sum + point.x, 0)
  const sumY = data.reduce((sum, point) => sum + point.y, 0)
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0)
  const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

// Moving average calculation
function movingAverage(data: number[], window: number): number[] {
  const result: number[] = []
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push(sum / window)
  }
  return result
}

// Seasonal decomposition (simple)
function detectSeasonalPattern(data: number[], period: number = 7): {
  trend: number[]
  seasonal: number[]
  residual: number[]
} {
  const trend: number[] = []
  const seasonal: number[] = []
  const residual: number[] = []

  // Simple moving average for trend
  const ma = movingAverage(data, period)

  // Calculate seasonal component
  for (let i = 0; i < data.length; i++) {
    const seasonalIndex = i % period
    const seasonalValue = data[i] - (ma[Math.floor(i / period)] || data[i])
    seasonal[seasonalIndex] = (seasonal[seasonalIndex] || 0) + seasonalValue
  }

  // Average seasonal values
  for (let i = 0; i < period; i++) {
    seasonal[i] = seasonal[i] / Math.ceil(data.length / period)
  }

  // Calculate trend and residual
  for (let i = 0; i < data.length; i++) {
    const seasonalIndex = i % period
    trend[i] = ma[Math.floor(i / period)] || data[i]
    residual[i] = data[i] - trend[i] - seasonal[seasonalIndex]
  }

  return { trend, seasonal, residual }
}

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

    console.log(`Dashboard predictions requested by ${session.userId}`)

    // Get historical sales data for forecasting (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const salesData = await prisma.$queryRaw<Array<{ date: string; total: number }>>`
      SELECT
        DATE(createdAt) as date,
        SUM(total) as total
      FROM sales
      WHERE createdAt >= ${ninetyDaysAgo} AND status = 'COMPLETED'
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `

    // Convert to array of numbers for analysis
    const salesValues = salesData.map((d) => Number(d.total) || 0)

    // Sales Forecasting using linear regression
    const regressionData = salesValues.map((value, index) => ({
      x: index,
      y: value
    }))

    const { slope, intercept } = linearRegression(regressionData)

    // Forecast next 30 days
    const salesForecast = []
    for (let i = 1; i <= 30; i++) {
      const predictedValue = slope * (salesValues.length + i - 1) + intercept
      const forecastDate = new Date()
      forecastDate.setDate(forecastDate.getDate() + i)

      salesForecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: Math.max(0, predictedValue), // Ensure non-negative
        confidence: 0.8 // Placeholder confidence score
      })
    }

    // Seasonal Pattern Analysis
    const seasonalAnalysis = detectSeasonalPattern(salesValues, 7) // Weekly patterns

    // Inventory Reorder Point Calculations
    const products = await prisma.product.findMany({
      include: {
        _count: {
          select: {
            saleItems: {
              where: {
                sale: {
                  createdAt: {
                    gte: ninetyDaysAgo
                  },
                  status: 'COMPLETED'
                }
              }
            }
          }
        }
      }
    })

    const inventoryPredictions = await Promise.all(
      products.map(async (product) => {
        // Get daily sales for this product
        const productSales = await prisma.$queryRaw<Array<{ date: string; quantity: number }>>`
          SELECT
            DATE(s.createdAt) as date,
            SUM(si.quantity) as quantity
          FROM sales s
          JOIN sale_items si ON s.id = si.saleId
          WHERE si.productId = ${product.id}
            AND s.createdAt >= ${ninetyDaysAgo}
            AND s.status = 'COMPLETED'
          GROUP BY DATE(s.createdAt)
          ORDER BY date ASC
        `

        const dailySales = productSales.map((d) => Number(d.quantity) || 0)

        if (dailySales.length === 0) {
          return {
            productId: product.id,
            productName: product.name,
            currentStock: product.stock,
            reorderPoint: 0,
            predictedDemand: 0,
            daysUntilStockout: Infinity
          }
        }

        // Calculate average daily demand
        const avgDailyDemand = dailySales.reduce((sum, qty) => sum + qty, 0) / dailySales.length

        // Calculate demand variability (standard deviation)
        const variance = dailySales.reduce((sum, qty) => sum + Math.pow(qty - avgDailyDemand, 2), 0) / dailySales.length
        const stdDev = Math.sqrt(variance)

        // Reorder point: average demand during lead time + safety stock
        // Assuming 7-day lead time and 95% service level (1.96 standard deviations)
        const leadTime = 7 // days
        const serviceLevel = 1.96 // 95% confidence
        const safetyStock = serviceLevel * stdDev * Math.sqrt(leadTime)
        const reorderPoint = (avgDailyDemand * leadTime) + safetyStock

        // Predict demand for next 30 days
        const predictedDemand = avgDailyDemand * 30

        // Days until stockout
        const daysUntilStockout = product.stock > 0 ? product.stock / avgDailyDemand : 0

        return {
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          reorderPoint: Math.ceil(reorderPoint),
          predictedDemand: Math.ceil(predictedDemand),
          daysUntilStockout: Math.ceil(daysUntilStockout),
          avgDailyDemand: avgDailyDemand.toFixed(2)
        }
      })
    )

    // Customer Behavior Predictions
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          where: {
            createdAt: {
              gte: thirtyDaysAgo
            },
            status: 'COMPLETED'
          },
          select: {
            total: true,
            createdAt: true
          }
        }
      }
    })

    const customerPredictions = customers.map((customer) => {
      const salesCount = customer.sales.length
      const totalSpent = customer.sales.reduce((sum, sale) => sum + sale.total, 0)
      const avgOrderValue = salesCount > 0 ? totalSpent / salesCount : 0

      // Simple churn risk based on recency and frequency
      const lastPurchase = customer.sales.length > 0
        ? Math.max(...customer.sales.map(s => new Date(s.createdAt).getTime()))
        : 0

      const daysSinceLastPurchase = lastPurchase > 0
        ? (Date.now() - lastPurchase) / (1000 * 60 * 60 * 24)
        : Infinity

      // Churn risk: higher if no purchases in last 30 days
      const churnRisk = daysSinceLastPurchase > 30 ? 'HIGH' :
                       daysSinceLastPurchase > 14 ? 'MEDIUM' : 'LOW'

      // Purchase likelihood prediction (simple frequency-based)
      const purchaseLikelihood = Math.min(1, salesCount / 10) // Scale based on purchase frequency

      return {
        customerId: customer.id,
        customerName: customer.name,
        churnRisk,
        purchaseLikelihood: (purchaseLikelihood * 100).toFixed(1) + '%',
        predictedNextPurchase: churnRisk === 'LOW' ? 'Within 7 days' :
                              churnRisk === 'MEDIUM' ? 'Within 14 days' : 'Uncertain',
        avgOrderValue: avgOrderValue.toFixed(2),
        totalSpent: totalSpent.toFixed(2)
      }
    })

    // Demand Forecasting for top products
    const topProducts = await prisma.product.findMany({
      take: 10,
      orderBy: {
        saleItems: {
          _count: 'desc'
        }
      },
      include: {
        saleItems: {
          where: {
            sale: {
              createdAt: {
                gte: ninetyDaysAgo
              },
              status: 'COMPLETED'
            }
          },
          select: {
            quantity: true,
            sale: {
              select: {
                createdAt: true
              }
            }
          }
        }
      }
    })

    const demandForecast = topProducts.map((product) => {
      const sales = product.saleItems.map(item => ({
        date: new Date(item.sale.createdAt),
        quantity: item.quantity
      }))

      // Group by week for forecasting
      const weeklyDemand: { [key: string]: number } = {}
      sales.forEach(sale => {
        const weekKey = `${sale.date.getFullYear()}-W${Math.ceil((sale.date.getDate() - sale.date.getDay() + 1) / 7)}`
        weeklyDemand[weekKey] = (weeklyDemand[weekKey] || 0) + sale.quantity
      })

      const weeklyValues = Object.values(weeklyDemand)
      const avgWeeklyDemand = weeklyValues.reduce((sum, qty) => sum + qty, 0) / weeklyValues.length

      // Simple trend analysis
      const trend = weeklyValues.length > 1
        ? (weeklyValues[weeklyValues.length - 1] - weeklyValues[0]) / weeklyValues.length
        : 0

      // Forecast next 4 weeks
      const forecast = []
      for (let i = 1; i <= 4; i++) {
        const predicted = Math.max(0, avgWeeklyDemand + (trend * i))
        forecast.push(Math.ceil(predicted))
      }

      return {
        productId: product.id,
        productName: product.name,
        currentAvgWeeklyDemand: avgWeeklyDemand.toFixed(1),
        trend: trend > 0 ? 'Increasing' : trend < 0 ? 'Decreasing' : 'Stable',
        forecastNext4Weeks: forecast,
        totalForecast: forecast.reduce((sum, qty) => sum + qty, 0)
      }
    })

    return NextResponse.json({
      salesForecast,
      seasonalAnalysis: {
        detected: seasonalAnalysis.seasonal.some(s => Math.abs(s) > 0.1), // Simple detection
        pattern: seasonalAnalysis.seasonal.map(s => s.toFixed(2))
      },
      inventoryPredictions,
      customerPredictions,
      demandForecast,
      metadata: {
        forecastPeriod: '30 days',
        historicalDataPoints: salesValues.length,
        confidenceLevel: 'Medium (basic statistical models)',
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard predictions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}