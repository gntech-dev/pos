import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { NCFType } from "@/lib/ncf"
import { endpointLimiters, createRateLimitResponse } from "@/lib/rate-limit"

interface NCFStatus {
  type: NCFType
  prefix: string
  currentNumber: number
  startNumber: number
  endNumber: number
  expiryDate: Date
  isActive: boolean
  daysLeft: number
  status: 'EXPIRED' | 'EXPIRING_SOON' | 'NORMAL' | 'LOW_STOCK' | 'EXHAUSTED'
  remaining: number
  percentageUsed: number
  alertLevel: 'NONE' | 'WARNING' | 'CRITICAL' | 'DANGER'
}

/**
 * GET /api/ncf/monitor - Get comprehensive NCF status monitoring
 */
export async function GET(_request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  // Only admins and managers can access NCF monitoring
  if (!['ADMIN', 'MANAGER'].includes(session.role)) {
    return new NextResponse(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 })
  }

  // Check rate limiting
  const rateLimitResult = await endpointLimiters.admin(_request)
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult, { limiter: 'admin' })
  }

  try {
    const sequences = await prisma.nCFSequence.findMany({
      orderBy: { type: 'asc' }
    })

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
    // const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))

    const ncfStatuses: NCFStatus[] = sequences.map((sequence: { expiryDate: Date; endNumber: number; currentNumber: number; startNumber: number; type: string; prefix: string; isActive: boolean }) => {
      const expiryDate = new Date(sequence.expiryDate)
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const remaining = sequence.endNumber - sequence.currentNumber
      const totalNumbers = sequence.endNumber - sequence.startNumber + 1
      const usedNumbers = sequence.currentNumber - sequence.startNumber + 1
      const percentageUsed = (usedNumbers / totalNumbers) * 100

      let status: NCFStatus['status']
      let alertLevel: NCFStatus['alertLevel']

      // Determine status based on multiple factors
      if (remaining <= 0) {
        status = 'EXHAUSTED'
        alertLevel = 'DANGER'
      } else if (daysLeft < 0) {
        status = 'EXPIRED'
        alertLevel = 'DANGER'
      } else if (daysLeft <= 7) {
        status = 'EXPIRING_SOON'
        alertLevel = 'CRITICAL'
      } else if (daysLeft <= 30) {
        status = 'EXPIRING_SOON'
        alertLevel = 'WARNING'
      } else if (remaining < 100) {
        status = 'LOW_STOCK'
        alertLevel = 'WARNING'
      } else {
        status = 'NORMAL'
        alertLevel = 'NONE'
      }

      return {
        type: sequence.type as NCFType,
        prefix: sequence.prefix,
        currentNumber: sequence.currentNumber,
        startNumber: sequence.startNumber,
        endNumber: sequence.endNumber,
        expiryDate: sequence.expiryDate,
        isActive: sequence.isActive,
        daysLeft,
        status,
        remaining,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        alertLevel
      }
    })

    // Calculate summary statistics
    const summary = {
      totalSequences: sequences.length,
      activeSequences: sequences.filter(s => s.isActive).length,
      expiredSequences: ncfStatuses.filter(s => s.status === 'EXPIRED').length,
      expiringSequences: ncfStatuses.filter(s => s.status === 'EXPIRING_SOON').length,
      lowStockSequences: ncfStatuses.filter(s => s.status === 'LOW_STOCK').length,
      exhaustedSequences: ncfStatuses.filter(s => s.status === 'EXHAUSTED').length,
      criticalAlerts: ncfStatuses.filter(s => s.alertLevel === 'CRITICAL').length,
      warningAlerts: ncfStatuses.filter(s => s.alertLevel === 'WARNING').length,
      dangerAlerts: ncfStatuses.filter(s => s.alertLevel === 'DANGER').length
    }

    return NextResponse.json({
      data: ncfStatuses,
      summary,
      lastChecked: now.toISOString(),
      nextCheck: thirtyDaysFromNow.toISOString()
    })
  } catch (error) {
    console.error('Error monitoring NCF sequences:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * POST /api/ncf/monitor/check - Trigger manual NCF status check
 */
export async function POST(_request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  // Only admins can trigger manual checks
  if (session.role !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 })
  }

  // Check rate limiting
  const rateLimitResult = await endpointLimiters.admin(_request)
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult, { limiter: 'admin' })
  }

  try {
    const sequences = await prisma.nCFSequence.findMany()
    const now = new Date()
    const alerts: Array<{
      type: string
      message: string
      severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'DANGER'
      sequenceType: NCFType
      actionRequired: boolean
    }> = []

    for (const sequence of sequences) {
      const expiryDate = new Date(sequence.expiryDate)
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const remaining = sequence.endNumber - sequence.currentNumber

      if (daysLeft < 0) {
        alerts.push({
          type: 'EXPIRED',
          message: `La secuencia NCF ${sequence.type} ha EXPIRADO. Ya no se pueden generar más NCF de este tipo.`,
          severity: 'DANGER',
          sequenceType: sequence.type as NCFType,
          actionRequired: true
        })
      } else if (daysLeft <= 7) {
        alerts.push({
          type: 'EXPIRING_SOON',
          message: `La secuencia NCF ${sequence.type} expira en ${daysLeft} día${daysLeft === 1 ? '' : 's'}.`,
          severity: 'CRITICAL',
          sequenceType: sequence.type as NCFType,
          actionRequired: true
        })
      } else if (daysLeft <= 30) {
        alerts.push({
          type: 'EXPIRING_SOON',
          message: `La secuencia NCF ${sequence.type} expira en ${daysLeft} días.`,
          severity: 'WARNING',
          sequenceType: sequence.type as NCFType,
          actionRequired: true
        })
      }

      if (remaining < 100) {
        const severity = remaining < 20 ? 'CRITICAL' : 'WARNING'
        alerts.push({
          type: 'LOW_STOCK',
          message: `La secuencia NCF ${sequence.type} tiene pocos números disponibles (${remaining} restantes).`,
          severity,
          sequenceType: sequence.type as NCFType,
          actionRequired: true
        })
      }
    }

    // Log the check in audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CHECK',
        entity: 'NCF',
        entityId: 'monitor',
        newValue: JSON.stringify({
          alertsGenerated: alerts.length,
          sequencesChecked: sequences.length,
          timestamp: now.toISOString()
        })
      }
    })

    return NextResponse.json({
      success: true,
      alerts,
      sequencesChecked: sequences.length,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Error checking NCF status:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}