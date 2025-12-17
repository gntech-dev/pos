import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { createBackup } from '@/lib/backup'

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

    // Only admins can create backups
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      type = 'full',
      components,
      encrypt = true,
      compress = true,
      retentionDays = 30
    } = body

    // Validate input
    if (!['full', 'partial'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid backup type. Must be "full" or "partial"' },
        { status: 400 }
      )
    }

    if (retentionDays < 1 || retentionDays > 365) {
      return NextResponse.json(
        { error: 'Retention days must be between 1 and 365' },
        { status: 400 }
      )
    }

    // Validate components if partial backup
    if (type === 'partial' && (!components || !Array.isArray(components) || components.length === 0)) {
      return NextResponse.json(
        { error: 'Components are required for partial backup' },
        { status: 400 }
      )
    }

    const validComponents = ['database', 'config', 'cache', 'files']
    if (type === 'partial') {
      for (const component of components) {
        if (!validComponents.includes(component)) {
          return NextResponse.json(
            { error: `Invalid component: ${component}. Valid components: ${validComponents.join(', ')}` },
            { status: 400 }
          )
        }
      }
    }

    console.log(`Starting backup creation: ${name || 'Auto-generated'} by ${session.userId}`)

    // Create backup
    const backupMetadata = await createBackup({
      name,
      type,
      components,
      encrypt,
      compress,
      retentionDays,
      userId: session.userId
    })

    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        id: backupMetadata.id,
        name: backupMetadata.name,
        type: backupMetadata.type,
        size: backupMetadata.size,
        compressed: backupMetadata.compressed,
        encrypted: backupMetadata.encrypted,
        checksum: backupMetadata.checksum,
        createdAt: backupMetadata.createdAt,
        status: backupMetadata.status,
        components: backupMetadata.components.length
      }
    })

  } catch (error) {
    console.error('Backup creation failed:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Backup creation failed',
        message,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check backup creation status (for async operations)
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

    // Only admins can view backup status
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // For now, return info about the backup creation endpoint
    return NextResponse.json({
      message: 'Use POST to create a backup',
      requiredFields: {
        type: 'full | partial',
        components: 'array (required for partial backup)',
        encrypt: 'boolean (default: true)',
        compress: 'boolean (default: true)',
        retentionDays: 'number (default: 30, min: 1, max: 365)',
        name: 'string (optional)'
      },
      validComponents: ['database', 'config', 'cache', 'files'],
      example: {
        type: 'full',
        encrypt: true,
        compress: true,
        retentionDays: 30
      }
    })

  } catch (error) {
    console.error('Backup info request failed:', error)
    
    return NextResponse.json(
      { error: 'Failed to get backup info' },
      { status: 500 }
    )
  }
}