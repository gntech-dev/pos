import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { listBackups, cleanupOldBackups } from '@/lib/backup'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins and managers can view backups
    if (!['ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')

    // Get all backups
    const allBackups = await listBackups()

    // Apply filters
    let filteredBackups = allBackups

    if (status) {
      filteredBackups = filteredBackups.filter(backup => backup.status === status)
    }

    if (type) {
      filteredBackups = filteredBackups.filter(backup => backup.type === type)
    }

    // Calculate pagination
    const totalBackups = filteredBackups.length
    const totalPages = Math.ceil(totalBackups / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedBackups = filteredBackups.slice(startIndex, endIndex)

    // Calculate summary statistics
    const summary = {
      total: totalBackups,
      completed: filteredBackups.filter(b => b.status === 'completed').length,
      failed: filteredBackups.filter(b => b.status === 'failed').length,
      running: filteredBackups.filter(b => b.status === 'running').length,
      totalSize: filteredBackups
        .filter(b => b.status === 'completed')
        .reduce((sum: number, b: { size: number }) => sum + b.size, 0),
      oldest: filteredBackups.length > 0 ? filteredBackups[filteredBackups.length - 1].createdAt : null,
      newest: filteredBackups.length > 0 ? filteredBackups[0].createdAt : null
    }

    // Format backups for response (remove sensitive data)
    const formattedBackups = paginatedBackups.map(backup => ({
      id: backup.id,
      name: backup.name,
      type: backup.type,
      size: backup.size,
      compressed: backup.compressed,
      encrypted: backup.encrypted,
      checksum: backup.checksum,
      createdAt: backup.createdAt,
      createdBy: backup.createdBy,
      status: backup.status,
      components: backup.components.length,
      retention: {
        keepUntil: backup.retention.keepUntil,
        autoDelete: backup.retention.autoDelete
      },
      errorMessage: backup.errorMessage
    }))

    return NextResponse.json({
      success: true,
      backups: formattedBackups,
      pagination: {
        page,
        limit,
        total: totalBackups,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary
    })

  } catch (error) {
    console.error('Failed to list backups:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to list backups',
        message
      },
      { status: 500 }
    )
  }
}

// POST endpoint to cleanup old backups
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can cleanup backups
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'cleanup') {
      console.log(`Starting cleanup of old backups by ${session.userId}`)
      
      const cleanedCount = await cleanupOldBackups()
      
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${cleanedCount} old backups`,
        cleanedCount
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "cleanup"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Backup cleanup failed:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Backup cleanup failed',
        message
      },
      { status: 500 }
    )
  }
}