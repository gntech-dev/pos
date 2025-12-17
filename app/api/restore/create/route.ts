import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { createRestore } from '@/lib/restore'
import { getBackup } from '@/lib/backup'

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

    // Only admins can create restores
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      backupId,
      components,
      overwrite = false,
      validateOnly = false
    } = body

    // Validate input
    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      )
    }

    // Check if backup exists and is completed
    const backup = await getBackup(backupId)
    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }

    if (backup.status !== 'completed') {
      return NextResponse.json(
        { error: `Backup is not completed. Current status: ${backup.status}` },
        { status: 400 }
      )
    }

    // Validate components if specified
    const validComponents = ['database', 'config', 'cache', 'files']
    if (components && Array.isArray(components)) {
      for (const component of components) {
        if (!validComponents.includes(component)) {
          return NextResponse.json(
            { error: `Invalid component: ${component}. Valid components: ${validComponents.join(', ')}` },
            { status: 400 }
          )
        }
      }
    }

    // Check if backup contains the requested components
    if (components && Array.isArray(components)) {
      const backupComponentTypes = backup.components.map(c => c.type)
      for (const component of components) {
        if (!backupComponentTypes.includes(component)) {
          return NextResponse.json(
            { error: `Component "${component}" not found in backup` },
            { status: 400 }
          )
        }
      }
    }

    console.log(`Starting restore from backup: ${backup.name} by ${session.userId}`)

    // Create restore
    const restoreMetadata = await createRestore({
      backupId,
      components,
      overwrite,
      validateOnly,
      userId: session.userId
    })

    return NextResponse.json({
      success: true,
      message: validateOnly ? 'Backup validation completed' : 'Restore process started',
      restore: {
        id: restoreMetadata.id,
        backupId: restoreMetadata.backupId,
        backupName: restoreMetadata.backupName,
        status: restoreMetadata.status,
        validated: restoreMetadata.validated,
        components: restoreMetadata.components,
        startedAt: restoreMetadata.startedAt,
        completedAt: restoreMetadata.completedAt,
        errorMessage: restoreMetadata.errorMessage
      }
    })

  } catch (error) {
    console.error('Restore creation failed:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Restore creation failed',
        message,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint to get restore creation info
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

    // Only admins can view restore info
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Return info about the restore creation endpoint
    return NextResponse.json({
      message: 'Use POST to create a restore',
      requiredFields: {
        backupId: 'string (required)',
        components: 'array (optional, valid: database, config, cache, files)',
        overwrite: 'boolean (default: false)',
        validateOnly: 'boolean (default: false, validate backup without restoring)'
      },
      validComponents: ['database', 'config', 'cache', 'files'],
      warnings: [
        'Database restore will overwrite current data',
        'Configuration restore may affect system behavior',
        'Cache restore will replace cached data',
        'Files restore may overwrite user files'
      ],
      example: {
        backupId: 'backup-id-here',
        components: ['database', 'config'],
        overwrite: false,
        validateOnly: false
      }
    })

  } catch (error) {
    console.error('Restore info request failed:', error)
    
    return NextResponse.json(
      { error: 'Failed to get restore info' },
      { status: 500 }
    )
  }
}