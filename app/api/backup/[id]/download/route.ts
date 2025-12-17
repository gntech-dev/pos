import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { getBackup } from '@/lib/backup'
import fs from 'fs/promises'
import path from 'path'
import { BACKUP_DIR } from '@/lib/backup'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can download backups
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const backupId = (await context.params).id
    const backup = await getBackup(backupId)

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }

    // Check if backup is completed
    if (backup.status !== 'completed') {
      return NextResponse.json(
        { error: `Backup is not completed. Current status: ${backup.status}` },
        { status: 400 }
      )
    }

    // Construct backup file path
    const backupFilePath = path.join(BACKUP_DIR, `${backup.name}.backup`)
    
    try {
      // Check if file exists
      await fs.access(backupFilePath)
    } catch {
      return NextResponse.json(
        { error: 'Backup file not found on disk' },
        { status: 404 }
      )
    }

    // Get file stats
    const stats = await fs.stat(backupFilePath)
    
    // Check if file is too large for memory (limit to 100MB for streaming)
    const maxFileSize = 100 * 1024 * 1024 // 100MB
    
    if (stats.size > maxFileSize) {
      return NextResponse.json(
        { error: 'Backup file is too large to download through API' },
        { status: 413 }
      )
    }

    // Read file
    const backupBuffer = await fs.readFile(backupFilePath)

    // Set appropriate headers
    const filename = `${backup.name}.backup`
    const headers = new Headers()
    
    headers.set('Content-Type', 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Content-Length', stats.size.toString())
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    // Add security headers
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'DENY')
    headers.set('X-XSS-Protection', '1; mode=block')

    console.log(`Backup downloaded: ${backup.name} (${stats.size} bytes) by ${session.userId}`)

    return new NextResponse(backupBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Failed to download backup:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to download backup',
        message
      },
      { status: 500 }
    )
  }
}