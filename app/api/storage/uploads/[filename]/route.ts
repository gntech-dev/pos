import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { stat } from 'fs/promises'

const UPLOAD_DIR = join(process.cwd(), 'storage', 'uploads')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params
    const filename = resolvedParams.filename

    // Allow subdirectories like logos/filename
    const pathParts = filename.split('/')
    const cleanParts = pathParts.filter(part => part && !part.includes('..'))

    if (cleanParts.length === 0) {
      return new NextResponse('Invalid filename', { status: 400 })
    }

    const filePath = join(UPLOAD_DIR, ...cleanParts)

    // Check if file exists
    try {
      await stat(filePath)
    } catch {
      return new NextResponse('File not found', { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Determine content type based on file extension
    const ext = filename.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'

    switch (ext) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'webp':
        contentType = 'image/webp'
        break
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}