import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { testEmail } = await req.json()

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Correo de prueba requerido' },
        { status: 400 }
      )
    }

    // Configure email transporter with advanced options
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465
    const smtpTls = process.env.SMTP_TLS !== 'false'
    const smtpTimeout = parseInt(process.env.SMTP_TIMEOUT || '30000')

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      requireTLS: smtpTls,
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: smtpTimeout,
      greetingTimeout: 30000,
      socketTimeout: smtpTimeout,
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    })

    // Verify connection
    try {
      await transporter.verify()
    } catch (error) {
      console.error('SMTP verification failed:', error)
      return NextResponse.json(
        { error: 'Error de conexión SMTP. Verifica la configuración.' },
        { status: 500 }
      )
    }

    // Send test email
    const senderName = process.env.SMTP_SENDER_NAME || 'GNTech POS'

    await transporter.sendMail({
      from: `"${senderName}" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: 'Prueba de Configuración - GNTech POS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 20px; }
            .company-name { color: #4f46e5; font-size: 28px; font-weight: bold; }
            .success { background: #d1fae5; border: 1px solid #10b981; color: #065f46; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">🏪 GNTech POS</div>
            <p>Sistema de Punto de Venta</p>
          </div>

          <div class="success">
            <h3 style="margin-top: 0;">✅ Configuración de Correo Exitosa</h3>
            <p>Esta es una prueba de configuración de correo electrónico.</p>
            <p><strong>Fecha de envío:</strong> ${new Date().toLocaleString('es-DO')}</p>
            <p><strong>Servidor:</strong> ${smtpHost}:${smtpPort}</p>
            <p><strong>Seguridad:</strong> ${smtpSecure ? 'SSL' : smtpTls ? 'TLS' : 'Sin encriptación'}</p>
          </div>

          <div class="footer">
            <p>Si recibiste este correo, la configuración SMTP está funcionando correctamente.</p>
            <p>GNTech POS - Sistema de Punto de Venta</p>
          </div>
        </body>
        </html>
      `,
      headers: {
        'X-Mailer': 'GNTech POS System - Test',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Correo de prueba enviado exitosamente'
    })

  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Error al enviar el correo de prueba. Verifica la configuración.' },
      { status: 500 }
    )
  }
}
