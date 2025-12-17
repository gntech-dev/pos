import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { validateBackup } from '@/lib/backup'
import fs from 'fs/promises'
import path from 'path'

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

    // Only admins can upload backups
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    console.log(`Backup upload initiated by ${session.userId}`)

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('backup') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No backup file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.backup')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .backup files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB' },
        { status: 400 }
      )
    }

    // Validate file name
    const fileName = file.name.replace('.backup', '')
    if (!fileName || fileName.length === 0) {
      return NextResponse.json(
        { error: 'Invalid file name' },
        { status: 400 }
      )
    }

    // Read file buffer
    const fileBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)

    console.log(`Validating backup file: ${file.name} (${buffer.length} bytes)`)

    // Validate backup file structure
    const validation = await validateBackup(buffer, true) // Assume encrypted by default
    if (!validation.valid) {
      console.log(`Backup validation failed: ${validation.error}`)
      
      // Try without encryption
      const validationUnencrypted = await validateBackup(buffer, false)
      if (!validationUnencrypted.valid) {
        return NextResponse.json(
          { 
            error: 'Invalid backup file',
            details: validation.error || validationUnencrypted.error
          },
          { status: 400 }
        )
      }
    }

    // Generate unique filename to avoid conflicts
    const timestamp = new Date().toISOString().split('T')[0]
    const uniqueFileName = `${fileName}-uploaded-${timestamp}`
    const backupDir = path.join(process.cwd(), 'backups')
    
    // Ensure backups directory exists
    await fs.mkdir(backupDir, { recursive: true })

    // Save the uploaded file
    const backupFilePath = path.join(backupDir, `${uniqueFileName}.backup`)
    await fs.writeFile(backupFilePath, buffer)

    // Create metadata file
    const metadata = {
      id: `uploaded-${Date.now()}`,
      name: uniqueFileName,
      type: 'uploaded' as const,
      size: buffer.length,
      compressed: true, // Assume compressed
      encrypted: validation.valid, // Keep original encryption status
      checksum: '', // Will be calculated when needed
      createdAt: new Date().toISOString(),
      createdBy: session.userId,
      components: [], // Will be populated when backup is opened
      retention: {
        keepUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        autoDelete: true
      },
      status: 'completed' as const,
      uploaded: true,
      originalFileName: file.name
    }

    const metadataPath = path.join(backupDir, `${uniqueFileName}.metadata.json`)
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    console.log(`Backup uploaded successfully: ${uniqueFileName}`)

    return NextResponse.json({
      success: true,
      message: 'Backup uploaded successfully',
      backup: {
        id: metadata.id,
        name: metadata.name,
        type: metadata.type,
        size: metadata.size,
        compressed: metadata.compressed,
        encrypted: metadata.encrypted,
        createdAt: metadata.createdAt,
        status: metadata.status,
        uploaded: true,
        originalFileName: metadata.originalFileName
      }
    })

  } catch (error) {
    console.error('Backup upload failed:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Backup upload failed',
        message,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check upload status and requirements
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

    // Only admins can view upload info
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      message: 'Use POST to upload a backup file',
      requirements: {
        fileType: '.backup',
        maxSize: '500MB',
        authentication: 'Required',
        permissions: 'ADMIN role required'
      },
      supportedFeatures: [
        'Encrypted backups',
        'Compressed backups',
        'Automatic validation',
        'Metadata generation'
      ],
      example: {
        method: 'POST',
        formData: {
          backup: 'file (.backup extension required)'
        }
      }
    })

  } catch (error) {
    console.error('Upload info request failed:', error)
    
    return NextResponse.json(
      { error: 'Failed to get upload info' },
      { status: 500 }
    )
  }
}