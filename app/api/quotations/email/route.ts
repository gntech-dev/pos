import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'
import { prisma } from '@/lib/prisma'

interface BusinessSettings {
  name: string;
  rnc: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

const CONFIG_FILE = path.join(process.cwd(), 'email-config.json')

// Type definition for nodemailer attachments
interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

// Helper function to convert logo to data URL for email embedding
function convertLogoToDataUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null

  try {
    let fullPath: string

    if (logoPath.startsWith('/logos/')) {
      // Pre-made logos in public/logos/
      fullPath = path.join(process.cwd(), 'public', logoPath)
    } else if (logoPath.startsWith('/api/storage/uploads/')) {
      // Uploaded logos in storage/uploads/
      const filename = logoPath.replace('/api/storage/uploads/', '')
      fullPath = path.join(process.cwd(), 'storage', 'uploads', filename)
    } else {
      // Unknown path, return as is
      return logoPath
    }

    if (fs.existsSync(fullPath)) {
      const fileContent = fs.readFileSync(fullPath)
      const ext = logoPath.split('.').pop()?.toLowerCase()
      let mimeType = 'image/png' // default

      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
      else if (ext === 'png') mimeType = 'image/png'
      else if (ext === 'gif') mimeType = 'image/gif'
      else if (ext === 'webp') mimeType = 'image/webp'
      else if (ext === 'svg') mimeType = 'image/svg+xml'

      const base64 = fileContent.toString('base64')
      return `data:${mimeType};base64,${base64}`
    }
  } catch (error) {
    console.error('convertLogoToDataUrl: Error converting logo to data URL:', error)
  }

  return logoPath
}

// Function to generate PDF from quotation HTML
async function generateQuotationPDF(quotation: Quotation, businessSettings: BusinessSettings, logoDataUrl: string | null): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })

  try {
    const page = await browser.newPage()

    // Generate HTML optimized for PDF
    const pdfHTML = generateQuotationHTML(quotation, businessSettings, logoDataUrl, true)

    // Set content and wait for loading
    await page.setContent(pdfHTML, { waitUntil: 'networkidle0' })

    // Generate PDF with professional settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

// Load email configuration from file
function loadEmailConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8')
      return JSON.parse(configData)
    }
  } catch (error) {
    console.error('Error loading email config:', error)
  }

  // Fallback to environment variables
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    tls: process.env.SMTP_TLS !== 'false',
    timeout: process.env.SMTP_TIMEOUT || '30000',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
    senderName: process.env.SMTP_SENDER_NAME || 'Sistema POS - GNTech'
  }
}

export async function POST(req: NextRequest) {
  try {
    const { quotationId, email } = await req.json()

    if (!quotationId || !email) {
      return NextResponse.json(
        { error: 'Quotation ID and email are required' },
        { status: 400 }
      )
    }

    // Get quotation details
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true,
        user: true
      }
    })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    // Fetch business settings
    const businessSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['business_name', 'business_rnc', 'business_address', 'business_phone', 'business_email', 'business_logo']
        }
      }
    })

    // Transform to object format
    const businessData = {
      name: 'GNTech Demo',
      rnc: '000-00000-0',
      address: 'Santo Domingo, República Dominicana',
      phone: '809-555-5555',
      email: 'info@gntech.com',
      logo: undefined as string | undefined
    }

    // Override with database values
    businessSettings.forEach(setting => {
      switch (setting.key) {
        case 'business_name':
          businessData.name = setting.value
          break
        case 'business_rnc':
          businessData.rnc = setting.value
          break
        case 'business_address':
          businessData.address = setting.value
          break
        case 'business_phone':
          businessData.phone = setting.value
          break
        case 'business_email':
          businessData.email = setting.value
          break
        case 'business_logo':
          businessData.logo = setting.value
          break
      }
    })

    // Convert logo to data URL for email embedding
    const logoDataUrl = businessData.logo ? convertLogoToDataUrl(businessData.logo) : null

    // Load current email configuration
    const emailConfig = loadEmailConfig()

    // Configure email transporter with loaded configuration
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: parseInt(emailConfig.port.toString()),
      secure: emailConfig.secure || parseInt(emailConfig.port.toString()) === 465,
      requireTLS: emailConfig.tls,
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false // For self-signed certificates
      },
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password || process.env.SMTP_PASS || ''
      },
      connectionTimeout: parseInt(emailConfig.timeout || '30000'),
      greetingTimeout: 30000,
      socketTimeout: parseInt(emailConfig.timeout || '30000'),
      // Additional options for Office 365 and complex providers
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

    // Generate email HTML
    const emailHTML = generateQuotationHTML(quotation, businessData, logoDataUrl, false)

    // Generate PDF attachment
    console.log('Generating PDF attachment for quotation...')
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await generateQuotationPDF(quotation, businessData, logoDataUrl)
      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Continue without PDF but log the error
      pdfBuffer = Buffer.alloc(0)
    }

    // Prepare attachments
    const attachments: EmailAttachment[] = []
    if (pdfBuffer.length > 0) {
      attachments.push({
        filename: `Cotizacion-${quotation.quotationNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      })
      console.log('PDF attachment added to email')
    } else {
      console.log('Sending email without PDF attachment due to generation error')
    }

    // Send email with enhanced options
    const senderName = emailConfig.senderName || 'GNTech POS'
    const senderEmail = emailConfig.user

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: email,
      subject: `Cotización #${quotation.quotationNumber} - ${senderName}`,
      html: emailHTML,
      // Additional headers for better deliverability
      headers: {
        'X-Mailer': 'GNTech POS System',
        'List-Unsubscribe': `<mailto:${senderEmail}?subject=Unsubscribe>`,
      },
      attachments
    })

    return NextResponse.json({ success: true, message: 'Cotización enviada por email exitosamente' })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Error al enviar el correo electrónico' },
      { status: 500 }
    )
  }
}

// Simplified types that match the actual data structure
interface QuotationItem {
  product: {
    name: string
    sku: string
  }
  quantity: number
  unitPrice: number
  discount: number
}

interface QuotationCustomer {
  name: string
  rnc: string | null
  cedula: string | null
  address: string | null
  phone: string | null
  email: string | null
}

interface Quotation {
  quotationNumber: string
  createdAt: Date
  expiresAt: Date
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  notes: string | null
  customer: QuotationCustomer | null
  items: QuotationItem[]
}

function generateQuotationHTML(quotation: Quotation, businessSettings: BusinessSettings, logoDataUrl: string | null, forPDF: boolean = false): string {
  // PDF-specific styles and optimizations
  const pdfStyles = forPDF ? `
    @page {
      size: A4;
      margin: 1cm;
    }
    body {
      font-size: 12px;
    }
    .no-print {
      display: none !important;
    }
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Times New Roman', serif;
          max-width: ${forPDF ? 'none' : '800px'};
          margin: 0 auto;
          padding: ${forPDF ? '0' : '20px'};
          line-height: 1.4;
          background: ${forPDF ? 'white' : '#f9fafb'};
        }
        ${pdfStyles}
        .header {
          text-align: center;
          border-bottom: 3px solid #1f2937;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          color: #1f2937;
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .company-info {
          color: #6b7280;
          font-size: 14px;
          margin: 2px 0;
        }
        .quotation-title {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          text-align: center;
          margin: 30px 0;
          text-decoration: underline;
        }
        .quotation-details {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .detail-section h3 {
          color: #1f2937;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .detail-section p {
          margin: 3px 0;
          font-size: 14px;
        }
        .customer-info {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #3b82f6;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 25px 0;
          border: 1px solid #e5e7eb;
        }
        th {
          background: #1f2937;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #374151;
        }
        td {
          padding: 10px;
          border: 1px solid #e5e7eb;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals {
          text-align: right;
          margin-top: 20px;
          max-width: 300px;
          margin-left: auto;
        }
        .totals table {
          width: 100%;
          border: none;
        }
        .totals td {
          border: none;
          padding: 5px;
        }
        .total-row {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          border-top: 2px solid #1f2937;
        }
        .status-info {
          background: #fef3c7;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #f59e0b;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        .notes {
          background: #f0f9ff;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #0ea5e9;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Logo" style="max-width: 80px; max-height: 80px; margin-bottom: 10px;">` : ''}
        <div class="company-name">${businessSettings.name}</div>
        <div class="company-info">RNC: ${businessSettings.rnc}</div>
        <div class="company-info">${businessSettings.address}</div>
        <div class="company-info">Tel: ${businessSettings.phone} | Email: ${businessSettings.email}</div>
      </div>

      <div class="quotation-title">COTIZACIÓN</div>

      <div class="quotation-details">
        <div class="detail-section">
          <h3>Número de Cotización</h3>
          <p><strong>${quotation.quotationNumber}</strong></p>
        </div>
        <div class="detail-section">
          <h3>Fecha de Emisión</h3>
          <p><strong>${new Date(quotation.createdAt).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</strong></p>
          <p>${new Date(quotation.createdAt).toLocaleTimeString('es-DO')}</p>
        </div>
        <div class="detail-section">
          <h3>Válida Hasta</h3>
          <p><strong>${new Date(quotation.expiresAt).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</strong></p>
        </div>
      </div>

      ${quotation.customer ? `
        <div class="customer-info">
          <h3>COTIZADO A:</h3>
          <p><strong>${quotation.customer.name}</strong></p>
          ${quotation.customer.rnc ? `<p><strong>RNC:</strong> ${quotation.customer.rnc}</p>` : ''}
          ${quotation.customer.cedula ? `<p><strong>Cédula:</strong> ${quotation.customer.cedula}</p>` : ''}
          ${quotation.customer.address ? `<p><strong>Dirección:</strong> ${quotation.customer.address}</p>` : ''}
          ${quotation.customer.phone ? `<p><strong>Teléfono:</strong> ${quotation.customer.phone}</p>` : ''}
          ${quotation.customer.email ? `<p><strong>Email:</strong> ${quotation.customer.email}</p>` : ''}
        </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            <th>Descripción del Producto</th>
            <th class="text-center">Cantidad</th>
            <th class="text-right">Precio Unitario</th>
            <th class="text-right">Descuento</th>
            <th class="text-right">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          ${quotation.items.map((item) => `
            <tr>
              <td>
                <strong>${item.product.name}</strong><br>
                <small style="color: #6b7280;">Código: ${item.product.sku}</small>
              </td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">RD$ ${item.unitPrice.toFixed(2)}</td>
              <td class="text-right">${item.discount > 0 ? `RD$ ${item.discount.toFixed(2)}` : '-'}</td>
              <td class="text-right"><strong>RD$ ${(item.unitPrice * item.quantity - item.discount).toFixed(2)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">RD$ ${quotation.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>ITBIS (18%):</td>
            <td class="text-right">RD$ ${quotation.tax.toFixed(2)}</td>
          </tr>
          ${quotation.discount > 0 ? `
            <tr style="color: #dc2626;">
              <td>Descuento Aplicado:</td>
              <td class="text-right">-RD$ ${quotation.discount.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td><strong>TOTAL ESTIMADO:</strong></td>
            <td class="text-right"><strong>RD$ ${quotation.total.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>

      <div class="status-info">
        <p><strong>Estado de la Cotización:</strong> ${
          quotation.status === 'PENDING' ? 'Pendiente de Aprobación' :
          quotation.status === 'APPROVED' ? 'Aprobada' :
          quotation.status === 'REJECTED' ? 'Rechazada' :
          quotation.status === 'EXPIRED' ? 'Expirada' : 'Convertida a Venta'
        }</p>
        <p><strong>Nota:</strong> Esta cotización es válida por 30 días a partir de la fecha de emisión. Los precios pueden variar según la disponibilidad y condiciones del mercado.</p>
      </div>

      ${quotation.notes ? `
        <div class="notes">
          <p><strong>Notas Adicionales:</strong></p>
          <p>${quotation.notes.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      <div class="footer">
        <p><strong>¡Gracias por considerar nuestros productos y servicios!</strong></p>
        <p>Documento generado electrónicamente por GNTech POS</p>
        <p>Sistema de Punto de Venta Autorizado - República Dominicana</p>
        <p>Para aprobar esta cotización, por favor contacte a nuestro equipo de ventas.</p>
      </div>
    </body>
    </html>
  `
}