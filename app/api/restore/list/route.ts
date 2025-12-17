import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { listRestores } from '@/lib/restore'

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

    // Only admins and managers can view restores
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

    // Get all restores
    const allRestores = await listRestores()

    // Apply filters
    let filteredRestores = allRestores

    if (status) {
      filteredRestores = filteredRestores.filter(restore => restore.status === status)
    }

    // Calculate pagination
    const totalRestores = filteredRestores.length
    const totalPages = Math.ceil(totalRestores / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedRestores = filteredRestores.slice(startIndex, endIndex)

    // Calculate summary statistics
    const summary = {
      total: totalRestores,
      completed: filteredRestores.filter(r => r.status === 'completed').length,
      failed: filteredRestores.filter(r => r.status === 'failed').length,
      running: filteredRestores.filter(r => r.status === 'restoring' || r.status === 'validating').length,
      rolledBack: filteredRestores.filter(r => r.status === 'rolled_back').length,
      validated: filteredRestores.filter(r => r.validated).length
    }

    // Format restores for response
    const formattedRestores = paginatedRestores.map(restore => ({
      id: restore.id,
      backupId: restore.backupId,
      backupName: restore.backupName,
      status: restore.status,
      startedAt: restore.startedAt,
      completedAt: restore.completedAt,
      userId: restore.userId,
      components: restore.components,
      validated: restore.validated,
      restorePath: restore.restorePath,
      errorMessage: restore.errorMessage,
      rollbackPerformed: restore.rollbackPerformed,
      originalDataBackup: restore.originalDataBackup
    }))

    return NextResponse.json({
      success: true,
      restores: formattedRestores,
      pagination: {
        page,
        limit,
        total: totalRestores,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary
    })

  } catch (error) {
    console.error('Failed to list restores:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to list restores',
        message
      },
      { status: 500 }
    )
  }
}