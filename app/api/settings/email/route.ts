import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'email-config.json')

export async function POST(req: NextRequest) {
  try {
    const emailConfig = await req.json()

    // Validate required fields
    if (!emailConfig.host || !emailConfig.port || !emailConfig.user) {
      return NextResponse.json(
        { error: 'Servidor SMTP, puerto y usuario son requeridos' },
        { status: 400 }
      )
    }

    // Save configuration to file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(emailConfig, null, 2))

    // Update environment variables for current session
    process.env.SMTP_HOST = emailConfig.host
    process.env.SMTP_PORT = emailConfig.port
    process.env.SMTP_SECURE = emailConfig.secure.toString()
    process.env.SMTP_TLS = emailConfig.tls.toString()
    process.env.SMTP_TIMEOUT = emailConfig.timeout
    process.env.SMTP_USER = emailConfig.user
    process.env.SMTP_PASS = emailConfig.password || process.env.SMTP_PASS || ''
    process.env.SMTP_SENDER_NAME = emailConfig.senderName

    return NextResponse.json({
      success: true,
      message: 'Configuración de correo guardada exitosamente'
    })

  } catch (error) {
    console.error('Error saving email configuration:', error)
    return NextResponse.json(
      { error: 'Error al guardar la configuración de correo' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Load configuration from file if it exists
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8')
      const config = JSON.parse(configData)
      return NextResponse.json(config)
    }

    // Return default configuration
    return NextResponse.json({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      secure: process.env.SMTP_SECURE === 'true',
      tls: process.env.SMTP_TLS !== 'false',
      timeout: process.env.SMTP_TIMEOUT || '30000',
      user: process.env.SMTP_USER || '',
      senderName: process.env.SMTP_SENDER_NAME || 'Sistema POS - GNTech'
    })

  } catch (error) {
    console.error('Error loading email configuration:', error)
    return NextResponse.json(
      { error: 'Error al cargar la configuración de correo' },
      { status: 500 }
    )
  }
}
