import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
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
    const { saleId, email, pdfData } = await req.json()

    if (!saleId || !email) {
      return NextResponse.json(
        { error: 'Sale ID and email are required' },
        { status: 400 }
      )
    }

    // Only allow invoice type for email
    const type = 'invoice'

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
          in: ['business_name', 'business_rnc', 'business_address', 'business_phone', 'business_email']
        }
      }
    })

    // Transform to object format
    const businessData = {
      name: 'GNTech Demo',
      rnc: '000-00000-0',
      address: 'Santo Domingo, República Dominicana',
      phone: '809-555-5555',
      email: 'info@gntech.com'
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
    const emailHTML = generateInvoiceHTML(sale, type)

    // Prepare PDF attachment from client-generated data
    const attachments = []
    if (pdfData) {
      console.log('PDF data received, length:', pdfData.length)
      console.log('PDF data preview:', pdfData.substring(0, 100))
      
      // Remove data:pdf/application;base64, prefix if present
      const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, '')
      console.log('Base64 data length after prefix removal:', base64Data.length)
      
      try {
        const pdfBuffer = Buffer.from(base64Data, 'base64')
        console.log('PDF buffer created, length:', pdfBuffer.length)
        
        attachments.push({
          filename: `Factura_${sale.saleNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        })
        console.log('PDF attachment added successfully')
      } catch (bufferError) {
        console.error('Error creating PDF buffer:', bufferError)
      }
    } else {
      console.log('No PDF data received')
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


function generateInvoiceHTML(sale: Sale, type: string): string {
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
          <div class="company-name">🏪 GNTECH POS</div>
          <div class="company-info">Sistema de Punto de Venta Profesional</div>
          <div class="company-info">RNC: 000-00000-0</div>
          <div class="company-info">Santo Domingo, República Dominicana</div>
          <div class="company-info">Tel: 809-555-5555 | Email: info@gntech.com</div>
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
            <p><strong>${new Date(sale.createdAt).toLocaleDateString('es-DO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</strong></p>
            <p>${new Date(sale.createdAt).toLocaleTimeString('es-DO')}</p>
          </div>
        </div>

        ${sale.customer ? `
          <div class="customer-info">
            <h3>FACTURADO A:</h3>
            <p><strong>${sale.customer.name}</strong></p>
            ${sale.customer.rnc ? `<p><strong>RNC:</strong> ${sale.customer.rnc}</p>` : ''}
            ${sale.customer.cedula ? `<p><strong>Cédula:</strong> ${sale.customer.cedula}</p>` : ''}
            ${sale.customer.address ? `<p><strong>Dirección:</strong> ${sale.customer.address}</p>` : ''}
            ${sale.customer.phone ? `<p><strong>Teléfono:</strong> ${sale.customer.phone}</p>` : ''}
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
            ${(sale.items || []).map((item: SaleItem) => `
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
              <td class="text-right">RD$ ${sale.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>ITBIS (18%):</td>
              <td class="text-right">RD$ ${sale.tax.toFixed(2)}</td>
            </tr>
            ${sale.discount > 0 ? `
              <tr style="color: #dc2626;">
                <td>Descuento Aplicado:</td>
                <td class="text-right">-RD$ ${sale.discount.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td><strong>TOTAL A PAGAR:</strong></td>
              <td class="text-right"><strong>RD$ ${sale.total.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <div class="payment-info">
          <p><strong>Método de Pago:</strong> ${
            sale.paymentMethod === 'CASH' ? 'Efectivo' :
            sale.paymentMethod === 'CARD' ? 'Tarjeta de Crédito/Débito' :
            sale.paymentMethod === 'TRANSFER' ? 'Transferencia Bancaria' : 'Pago Mixto'
          }</p>
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
  } else {
    // Simple Receipt Format (Thermal Printer Style)
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 400px;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
            line-height: 1.2;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .double-line { border-top: 2px solid #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 2px; text-align: left; }
          .right { text-align: right; }
          .total { font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center bold">
          🏪 GNTECH POS<br>
          Sistema de Punto de Venta<br>
          RNC: 000-00000-0<br>
          Santo Domingo, RD<br>
          Tel: 809-555-5555
        </div>

        <div class="line"></div>

        <div class="center bold">
          RECIBO DE VENTA<br>
          #${sale.saleNumber}
        </div>

        <div class="center">
          ${new Date(sale.createdAt).toLocaleString('es-DO')}
        </div>

        ${sale.ncf ? `<div class="center">NCF: ${sale.ncf}</div>` : ''}

        <div class="line"></div>

        ${sale.customer ? `
          <div>
            <strong>Cliente:</strong> ${sale.customer.name}<br>
            ${sale.customer.rnc ? `RNC: ${sale.customer.rnc}<br>` : ''}
          </div>
          <div class="line"></div>
        ` : ''}

        ${(sale.items || []).map((item: SaleItem) => `
          <div>
            ${item.product.name}<br>
            ${item.quantity} x RD$ ${item.unitPrice.toFixed(2)}
            ${item.discount > 0 ? ` -RD$ ${item.discount.toFixed(2)}` : ''}
            <span class="right bold">RD$ ${(item.unitPrice * item.quantity - item.discount).toFixed(2)}</span>
          </div>
        `).join('')}

        <div class="line"></div>

        <div>
          Subtotal: <span class="right">RD$ ${sale.subtotal.toFixed(2)}</span><br>
          ITBIS (18%): <span class="right">RD$ ${sale.tax.toFixed(2)}</span><br>
          ${sale.discount > 0 ? `Descuento: <span class="right">-RD$ ${sale.discount.toFixed(2)}</span><br>` : ''}
          <div class="total">
            TOTAL: <span class="right">RD$ ${sale.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="line"></div>

        <div>
          <strong>Pago:</strong> ${
            sale.paymentMethod === 'CASH' ? 'Efectivo' :
            sale.paymentMethod === 'CARD' ? 'Tarjeta' :
            sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Mixto'
          }
        </div>

        <div class="double-line"></div>

        <div class="center">
          <strong>¡Gracias por su compra!</strong><br>
          GNTech POS<br>
          Documento electrónico
        </div>
      </body>
      </html>
    `
  }
}
