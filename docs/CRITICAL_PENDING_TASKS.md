# 🚨 POS System - Tareas Críticas Pendientes

## 🔥 ACCIONES INMEDIATAS (Esta Semana)

### 1. Completar Sistema de Reembolsos con NCF Automático

**Estado Actual**: ❌ API básica existe, falta NCF automático  
**Tiempo**: 3-5 días  
**Prioridad**: CRÍTICA (Cumplimiento DGII)

#### Código a Implementar

**1.1 Actualizar Schema Prisma**
```prisma
// database/prisma/schema.prisma - Agregar campos faltantes
model Refund {
  id            String   @id @default(cuid())
  saleId        String
  amount        Float
  reason        String?
  ncf           String?  // ← AGREGAR ESTE CAMPO
  ncfType       String?  @default("B04") // ← AGREGAR ESTE CAMPO
  status        String   @default("PENDING")
  processedBy   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sale          Sale     @relation(fields: [saleId], references: [id])
  processedByUser User   @relation(fields: [processedBy], references: [id])

  @@map("refunds")
}

model Sale {
  // ... campos existentes ...
  refunds       Refund[] // ← AGREGAR ESTA RELACIÓN
}
```

**1.2 Actualizar API de Reembolsos**
```typescript
// app/api/refunds/route.ts - Modificar función POST
export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { saleId, amount, reason } = await req.json()

    // Validar venta original
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { refunds: true }
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    // Calcular total reembolsado anteriormente
    const totalRefunded = sale.refunds.reduce((sum, r) => sum + r.amount, 0)

    // Validar que no exceda el total de la venta
    if (totalRefunded + amount > sale.total) {
      return NextResponse.json(
        { error: `Monto excede el total de la venta. Disponible: RD$${(sale.total - totalRefunded).toFixed(2)}` },
        { status: 400 }
      )
    }

    // Generar NCF para nota de crédito (B04)
    const ncf = await generateNCF('B04')

    // Crear reembolso
    const refund = await prisma.refund.create({
      data: {
        saleId,
        amount,
        reason,
        ncf,        // ← NCF generado automáticamente
        ncfType: 'B04',
        processedBy: session.user.id,
        status: 'COMPLETED' // ← Marcar como completado inmediatamente
      }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        action: 'REFUND_CREATED',
        entityType: 'REFUND',
        entityId: refund.id,
        userId: session.user.id,
        details: { amount, reason, ncf, saleId }
      }
    })

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        ncf: refund.ncf,
        reason: refund.reason
      }
    })

  } catch (error) {
    console.error('Error creating refund:', error)
    return NextResponse.json(
      { error: 'Error al procesar el reembolso' },
      { status: 500 }
    )
  }
}
```

**1.3 Actualizar UI de Reembolsos**
```typescript
// app/refunds/page.tsx - Agregar indicador de NCF
export default function RefundsPage() {
  // ... código existente ...

  return (
    <div className="space-y-6">
      {/* ... header existente ... */}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Lista de Reembolsos</h3>
            <button
              onClick={() => setShowForm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Nuevo Reembolso
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venta Original
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NCF Nota de Crédito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Razón
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Procesado Por
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {refunds.map((refund) => (
                  <tr key={refund.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(refund.createdAt).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {refund.sale.saleNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      RD$ {refund.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {refund.ncf || 'Pendiente'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {refund.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {refund.processedByUser.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Formulario de reembolso */}
      {showForm && (
        <RefundForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            // Recargar lista de reembolsos
            fetchRefunds()
          }}
        />
      )}
    </div>
  )
}
```

#### Comandos para Implementar
```bash
# 1. Actualizar base de datos
cd /home/gntech/PS/pos-system
npm run db:migrate

# 2. Verificar que funciona
npm run dev

# 3. Probar creación de reembolso
# - Ir a /refunds
# - Crear un reembolso
# - Verificar que se genera NCF automáticamente
```

---

### 2. PDF para Cotizaciones (2-3 días)

**Estado Actual**: ❌ Solo HTML, falta PDF adjunto  
**Tiempo**: 2-3 días  
**Prioridad**: ALTA

#### Código a Implementar

**2.1 Crear Función de Generación PDF**
```typescript
// lib/pdf-generator.ts - Agregar función
export async function generateQuotationPDF(quotationId: string): Promise<Buffer> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: true,
      items: { include: { product: true } },
      businessSettings: true // Asumiendo que existe esta relación
    }
  })

  if (!quotation) {
    throw new Error('Cotización no encontrada')
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123 }) // A4 dimensions

    const htmlContent = generateQuotationHTML(quotation, quotation.businessSettings)
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })

    // Esperar a que se cargue completamente
    await new Promise(resolve => setTimeout(resolve, 1000))

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })

    return pdfBuffer
  } finally {
    await browser.close()
  }
}
```

**2.2 Actualizar API de Email de Cotizaciones**
```typescript
// app/api/quotations/email/route.ts - Modificar función POST
export async function POST(req: NextRequest) {
  // ... código existente hasta obtener quotation ...

  // Generar PDF adjunto
  const pdfBuffer = await generateQuotationPDF(quotationId)

  const attachments = [{
    filename: `Cotizacion_${quotation.quotationNumber}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }]

  // ... resto del código de envío de email ...
}
```

#### Comandos para Implementar
```bash
# 1. Agregar función al archivo existente
# 2. Importar en el API route
# 3. Probar envío de cotización por email
# 4. Verificar que incluye PDF adjunto
```

---

### 3. Notificaciones Automáticas NCF (1-2 días)

**Estado Actual**: ❌ Alertas manuales, falta automatización  
**Tiempo**: 1-2 días  
**Prioridad**: ALTA

#### Código a Implementar

**3.1 Actualizar API de Alertas NCF**
```typescript
// app/api/ncf/alerts/route.ts - Modificar GET
export async function GET() {
  try {
    const sequences = await prisma.nCFSequence.findMany()
    const alerts = []

    for (const sequence of sequences) {
      // Calcular días hasta expiración
      const daysUntilExpiry = Math.ceil(
        (sequence.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      // Alertas de expiración (30 días)
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        alerts.push({
          type: 'EXPIRING',
          ncfType: sequence.type,
          message: `NCF ${sequence.type} expira en ${daysUntilExpiry} días`,
          severity: daysUntilExpiry <= 7 ? 'CRITICAL' : 'WARNING',
          daysUntilExpiry
        })
      }

      // Alertas de agotamiento (10% restante)
      const remainingNumbers = sequence.endNumber - sequence.currentNumber
      const totalNumbers = sequence.endNumber - sequence.startNumber
      const percentageRemaining = (remainingNumbers / totalNumbers) * 100

      if (percentageRemaining <= 10) {
        alerts.push({
          type: 'EXHAUSTED',
          ncfType: sequence.type,
          message: `NCF ${sequence.type} tiene solo ${remainingNumbers} números restantes`,
          severity: 'WARNING',
          remainingNumbers
        })
      }
    }

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Error fetching NCF alerts:', error)
    return NextResponse.json(
      { error: 'Error al obtener alertas NCF' },
      { status: 500 }
    )
  }
}
```

**3.2 Agregar Notificaciones por Email**
```typescript
// lib/notification-service.ts - Archivo nuevo
import nodemailer from 'nodemailer'

export class NotificationService {
  private transporter: nodemailer.Transporter

  constructor() {
    const config = loadEmailConfig()
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password
      }
    })
  }

  async sendNCFAlert(email: string, alert: any) {
    const subject = `🚨 Alerta NCF - ${alert.ncfType}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${alert.severity === 'CRITICAL' ? '#dc2626' : '#d97706'};">
          ⚠️ Alerta de NCF
        </h2>
        <p><strong>${alert.message}</strong></p>
        <p>Por favor tome las acciones necesarias para evitar interrupciones en sus operaciones.</p>
        <hr>
        <p style="color: #6b7280; font-size: 12px;">
          Sistema POS - GNTech<br>
          Alerta generada automáticamente
        </p>
      </div>
    `

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_SENDER_NAME || 'Sistema POS',
        to: email,
        subject,
        html
      })
      console.log(`NCF alert sent to ${email}`)
    } catch (error) {
      console.error('Error sending NCF alert:', error)
    }
  }
}
```

**3.3 Script para Enviar Notificaciones**
```typescript
// scripts/send-ncf-alerts.ts - Archivo nuevo
import { NotificationService } from '../lib/notification-service'
import { prisma } from '../lib/prisma'

async function sendNCFAlerts() {
  try {
    // Obtener usuarios administradores
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    })

    if (adminUsers.length === 0) {
      console.log('No admin users found')
      return
    }

    // Obtener alertas activas
    const response = await fetch('http://localhost:3000/api/ncf/alerts')
    const { alerts } = await response.json()

    if (alerts.length === 0) {
      console.log('No active alerts')
      return
    }

    const notificationService = new NotificationService()

    // Enviar notificaciones a todos los administradores
    for (const user of adminUsers) {
      for (const alert of alerts) {
        await notificationService.sendNCFAlert(user.email, alert)
      }
    }

    console.log(`Sent ${alerts.length} alerts to ${adminUsers.length} administrators`)

  } catch (error) {
    console.error('Error sending NCF alerts:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  sendNCFAlerts()
}

export { sendNCFAlerts }
```

**3.4 Configurar Cron Job**
```bash
# Agregar a package.json scripts
{
  "scripts": {
    "send-ncf-alerts": "tsx scripts/send-ncf-alerts.ts"
  }
}

# Para ejecutar diariamente, agregar a crontab:
# 0 9 * * * cd /home/gntech/PS/pos-system && npm run send-ncf-alerts
```

#### Comandos para Implementar
```bash
# 1. Crear archivos nuevos
# 2. Actualizar API existente
# 3. Probar envío manual: npm run send-ncf-alerts
# 4. Configurar cron job para ejecución diaria
```

---

## 📋 Checklist de Implementación

### Para Cada Tarea
- [ ] Código implementado
- [ ] Base de datos migrada (si aplica)
- [ ] Funcionalidad probada manualmente
- [ ] Tests básicos pasan
- [ ] Documentación actualizada
- [ ] Commit realizado

### Testing Post-Implementación
- [ ] Sistema de reembolsos genera NCF correctamente
- [ ] Emails de cotizaciones incluyen PDF
- [ ] Alertas NCF se envían automáticamente
- [ ] No hay errores en consola
- [ ] UI funciona correctamente

### Próximos Pasos
1. **Esta semana**: Implementar las 3 tareas críticas
2. **Próxima semana**: Testing completo y documentación
3. **Semana siguiente**: Implementar mejoras de testing y modo offline básico

---

## 🚨 Notas Importantes

1. **Backup**: Hacer backup de base de datos antes de migraciones
2. **Testing**: Probar en entorno de desarrollo antes de producción
3. **Rollback**: Tener plan de rollback por si algo falla
4. **Documentación**: Actualizar docs después de cada implementación

¿Listo para comenzar con la implementación?</content>
<parameter name="filePath">/home/gntech/PS/pos-system/docs/CRITICAL_PENDING_TASKS.md