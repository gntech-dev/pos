import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/audit - Get audit logs (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')

    const where: {
      userId?: string;
      action?: string;
      entity?: string;
    } = {}
    if (userId) where.userId = userId
    if (action) where.action = action
    if (entity) where.entity = entity

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { username: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    return NextResponse.json({
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Audit logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}