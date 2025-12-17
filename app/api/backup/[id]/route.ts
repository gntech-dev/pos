import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { getBackup, deleteBackup } from '@/lib/backup'
import fs from 'fs/promises'
import path from 'path'
import { BACKUP_DIR } from '@/lib/backup'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET endpoint to get backup details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins and managers can view backup details
    if (!['ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const backupId = (await params).id
    const backup = await getBackup(backupId)

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }

    // Format backup for response
    const formattedBackup = {
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
      components: backup.components,
      retention: backup.retention,
      errorMessage: backup.errorMessage
    }

    return NextResponse.json({
      success: true,
      backup: formattedBackup
    })

  } catch (error) {
    console.error('Failed to get backup details:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to get backup details',
        message
      },
      { status: 500 }
    )
  }
}

// DELETE endpoint to delete a backup
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can delete backups
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const backupId = (await params).id
    const backup = await getBackup(backupId)

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }

    // Delete the backup
    await deleteBackup(backupId)

    console.log(`Backup deleted: ${backup.name} by ${session.userId}`)

    return NextResponse.json({
      success: true,
      message: `Backup "${backup.name}" deleted successfully`,
      deletedBackup: {
        id: backup.id,
        name: backup.name,
        size: backup.size,
        createdAt: backup.createdAt
      }
    })

  } catch (error) {
    console.error('Failed to delete backup:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to delete backup',
        message
      },
      { status: 500 }
    )
  }
}

// PUT endpoint to update backup metadata (e.g., retention settings)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can update backup settings
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const backupId = (await params).id
    const backup = await getBackup(backupId)

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { retentionDays, autoDelete } = body

    // Update retention settings
    if (retentionDays !== undefined) {
      if (retentionDays < 1 || retentionDays > 365) {
        return NextResponse.json(
          { error: 'Retention days must be between 1 and 365' },
          { status: 400 }
        )
      }
      backup.retention.keepUntil = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
    }

    if (autoDelete !== undefined) {
      backup.retention.autoDelete = autoDelete
    }

    // Save updated metadata
    const metadataPath = path.join(BACKUP_DIR, `${backup.name}.metadata.json`)
    await fs.writeFile(metadataPath, Buffer.from(JSON.stringify(backup, null, 2)))

    console.log(`Backup metadata updated: ${backup.name} by ${session.userId}`)

    return NextResponse.json({
      success: true,
      message: 'Backup metadata updated successfully',
      backup: {
        id: backup.id,
        name: backup.name,
        retention: backup.retention
      }
    })

  } catch (error) {
    console.error('Failed to update backup metadata:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to update backup metadata',
        message
      },
      { status: 500 }
    )
  }
}