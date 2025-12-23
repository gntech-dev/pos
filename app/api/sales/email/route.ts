import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'
import { prisma } from '@/lib/prisma'

interface SaleItem {
  id: string
  quantity: number
  unitPrice: number
  discount: number
  product: {
    name: string
    sku: string
  }
}

interface Customer {
  name: string
  rnc: string | null
  cedula: string | null
  address: string | null
  phone: string | null
}

interface Sale {
  id: string
  saleNumber: string
  customerId: string | null
  cashierId: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  ncf: string | null
  ncfType: string | null
  paymentMethod: string
  notes: string | null
  createdAt: Date
  updatedAt: Date
  items: SaleItem[]
  customer: Customer | null
}

const CONFIG_FILE = path.join(process.cwd(), 'email-config.json')

// Generate PDF using Puppeteer
async function generateInvoicePDF(saleId: string, type: string = 'invoice'): Promise<Buffer> {
  console.log('Starting PDF generation for sale:', saleId, 'type:', type)
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    // Set viewport for A4
    await page.setViewport({ width: 794, height: 1123 }) // A4 dimensions in pixels

    // Navigate to the print page
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const printUrl = `${baseUrl}/print/${saleId}?type=${type}&pdf=true`
    console.log('Navigating to:', printUrl)
    await page.goto(printUrl, { waitUntil: 'domcontentloaded' })

    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if the element exists
    const elementExists = await page.$('.print-container') !== null
    console.log('Element .print-container exists:', elementExists)

    if (!elementExists) {
      const bodyContent = await page.evaluate(() => document.body.innerHTML)
      console.log('Page body content length:', bodyContent.length)
      console.log('Page title:', await page.title())
    }

    // Wait for content to load with shorter timeout
    await page.waitForSelector('.print-container', { timeout: 5000 })

    // Check if logo image exists and has content
    const logoInfo = await page.evaluate(() => {
      const img = document.querySelector('.print-container img')
      if (img) {
        return {
          src: (img as HTMLImageElement).src,
          srcLength: (img as HTMLImageElement).src.length,
          naturalWidth: (img as HTMLImageElement).naturalWidth,
          naturalHeight: (img as HTMLImageElement).naturalHeight
        }
      }
      return null
    })
    console.log('Logo info:', logoInfo)

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5cm',
        right: '0.5cm',
        bottom: '0.5cm',
        left: '0.5cm'
      }
    })

    console.log('PDF generated, buffer size:', pdfBuffer.length)
    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

// Helper function to convert logo to data URL for email embedding
function convertLogoToDataUrl(logoPath: string | null): string | null {
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
    console.error('Error converting logo to data URL:', error)
  }

  return logoPath
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
    const { saleId, email, type = 'invoice' } = await req.json()

    if (!saleId || !email) {
      return NextResponse.json(
        { error: 'Sale ID and email are required' },
        { status: 400 }
      )
    }

    // Get sale details
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: {
        id: true,
        saleNumber: true,
        customerId: true,
        cashierId: true,
        subtotal: true,
        tax: true,
        discount: true,
        total: true,
        status: true,
        ncf: true,
        ncfType: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        customer: {
          select: {
            name: true,
            rnc: true,
            cedula: true,
            address: true,
            phone: true
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    // Get business settings for email
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
      logo: null as string | null
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

    // Generate email HTML (for invoice only)
    const emailHTML = generateInvoiceHTML(sale, type, businessData)

    // Generate PDF attachment server-side
    const attachments = []
    try {
      console.log('Generating PDF server-side for sale:', sale.id)
      const pdfBuffer = await generateInvoicePDF(sale.id, type)
      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

      attachments.push({
        filename: `Factura_${sale.saleNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      })
      console.log('PDF attachment added successfully')
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError)
      // Continue without PDF attachment if generation fails
      console.log('Continuing without PDF attachment')
    }

    // Send email with enhanced options
    const senderName = emailConfig.senderName || 'GNTech POS'
    const senderEmail = emailConfig.user

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: email,
      subject: `Factura #${sale.saleNumber} - ${senderName}`,
      html: emailHTML,
      attachments: attachments,
      // Additional headers for better deliverability
      headers: {
        'X-Mailer': 'GNTech POS System',
        'List-Unsubscribe': `<mailto:${senderEmail}?subject=Unsubscribe>`,
      }
    })

    return NextResponse.json({ success: true, message: 'Email enviado exitosamente' })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Error al enviar el correo electrónico' },
      { status: 500 }
    )
  }
}

interface BusinessData {
  name: string
  rnc: string
  address: string
  phone: string
  email: string
  logo: string | null
}

function generateInvoiceHTML(sale: Sale, type: string, businessData: BusinessData): string {
  const isInvoice = type === 'invoice'

  if (isInvoice) {
    // Formal Invoice Format
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Times New Roman', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.4;
          }
          @media print {
            @page {
              size: A4;
              margin: 0.5cm;
            }
            body {
              margin: 0;
              padding: 0.5cm;
            }
            .invoice-container {
              page-break-inside: avoid;
            }
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #1f2937;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .company-name {
            color: #1f2937;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .company-info {
            color: #6b7280;
            font-size: 14px;
            margin: 2px 0;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            text-align: center;
            margin: 20px 0;
            text-decoration: underline;
          }
          .invoice-details {
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
            margin: 15px 0;
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
          .text-right { 
            text-align: right; 
          }
          .text-center { 
            text-align: center; 
          }
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
          .payment-info {
            background: #ecfdf5;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 10px;
          }
          .terms {
            background: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            ${businessData.logo ? `<img src="${convertLogoToDataUrl(businessData.logo)}" alt="Logo" style="max-width: 80px; max-height: 80px; margin-bottom: 10px;">` : ''}
            <div class="company-name">${businessData.name}</div>
            <div class="company-info">Sistema de Punto de Venta Profesional</div>
            <div class="company-info">RNC: ${businessData.rnc}</div>
            <div class="company-info">${businessData.address}</div>
            <div class="company-info">Tel: ${businessData.phone} | Email: ${businessData.email}</div>
          </div>

          <div class="invoice-title">FACTURA</div>

          <div class="invoice-details">
            <div class="detail-section">
              <h3>Número de Factura</h3>
              <p><strong>${sale.saleNumber}</strong></p>
              ${sale.ncf ? `<p><strong>NCF:</strong> ${sale.ncf}</p>` : ''}
            </div>
            <div class="detail-section">
              <h3>Fecha de Emisión</h3>
              <p><strong>${new Date(sale.createdAt).toLocaleDateString('es-DO')}</strong></p>
              <p>${new Date(sale.createdAt).toLocaleTimeString('es-DO')}</p>
            </div>
          </div>

          ${sale.customer ? `
          <div class="customer-info">
            <h3 style="margin-top: 0;">FACTURADO A:</h3>
            <p style="font-weight: bold; margin: 0;">${sale.customer.name}</p>
            ${sale.customer.rnc ? `<p style="margin: 0;">RNC: ${sale.customer.rnc}</p>` : ''}
            ${sale.customer.cedula ? `<p style="margin: 0;">Cédula: ${sale.customer.cedula}</p>` : ''}
            ${sale.customer.address ? `<p style="margin: 0;">Dirección: ${sale.customer.address}</p>` : ''}
            ${sale.customer.phone ? `<p style="margin: 0;">Teléfono: ${sale.customer.phone}</p>` : ''}
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
              ${sale.items.map((item) => `
              <tr>
                <td>
                  <strong>${item.product.name}</strong><br>
                  <small style="color: #6b7280;">Código: ${item.product.sku}</small>
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">RD$ ${item.unitPrice.toFixed(2)}</td>
                <td class="text-right">${item.discount > 0 ? `-RD$ ${item.discount.toFixed(2)}` : '-'}</td>
                <td class="text-right"><strong>RD$ ${(item.unitPrice * item.quantity - item.discount).toFixed(2)}</strong></td>
              </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">RD$ ${sale.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>ITBIS (18%):</td>
                <td class="text-right">RD$ ${sale.tax.toFixed(2)}</td>
              </tr>
              ${sale.discount > 0 ? `
              <tr>
                <td>Descuento:</td>
                <td class="text-right" style="color: #dc2626;">-RD$ ${sale.discount.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td><strong>TOTAL A PAGAR:</strong></td>
                <td class="text-right"><strong>RD$ ${sale.total.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>

          <div class="payment-info">
            <p><strong>Método de Pago:</strong> ${sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Mixto'}</p>
          </div>

          <div class="terms">
            <p><strong>Términos y Condiciones:</strong></p>
            <p>Esta factura es un documento oficial generado electrónicamente. Los bienes y servicios facturados han sido entregados conforme a lo acordado. Para cualquier reclamación, contactar dentro de los 30 días siguientes a la emisión.</p>
          </div>

          <div class="footer">
            <p><strong>¡Gracias por su preferencia!</strong></p>
            <p>Documento generado electrónicamente por GNTech POS</p>
            <p>Sistema de Punto de Venta Autorizado - República Dominicana</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  return ''
}
