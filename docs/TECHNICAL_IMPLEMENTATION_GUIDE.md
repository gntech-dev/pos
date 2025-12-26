# 🔧 POS System - Guía Técnica de Implementación

## 📋 Documento Técnico para Desarrolladores

**Fecha**: Diciembre 2025  
**Versión**: 1.0  
**Estado**: Documento de Referencia Técnica

---

## 🏗️ Arquitectura Técnica Actual

### Stack Tecnológico
```json
{
  "frontend": "Next.js 15 + React 19 + TypeScript",
  "backend": "Next.js API Routes",
  "database": "SQLite + Prisma ORM",
  "auth": "NextAuth.js + JWT",
  "styling": "Tailwind CSS",
  "deployment": "PM2 + Nginx",
  "testing": "Jest + React Testing Library + Playwright"
}
```

### Estructura de Base de Datos
```sql
-- Tablas Core (Implementadas)
User, Customer, Product, Sale, Payment, Quotation, Refund, NCFSequence, AuditLog, Setting

-- Campos de Seguridad Agregados
User.twoFactorEnabled: Boolean
User.twoFactorSecret: String?
User.backupCodes: String? (JSON array)
AuditLog: id, userId, action, entity, entityId, oldValue, newValue, ipAddress, createdAt
```

---

## 🔒 Sistema de Seguridad Avanzada

### Arquitectura de Seguridad

#### Componentes de Seguridad Implementados
```typescript
// lib/2fa.ts - Two-Factor Authentication
- generateTOTPSecret() - Genera secreto TOTP
- verify2FAToken() - Verifica token TOTP
- generateQRCodeDataURL() - Genera QR code para apps autenticadoras
- generateBackupCodes() - Genera códigos de respaldo
- verifyBackupCode() - Verifica código de respaldo

// lib/audit.ts - Sistema de Auditoría
- logAuditEvent() - Registra evento de auditoría
- AUDIT_ACTIONS - Constantes de acciones
- AUDIT_ENTITIES - Constantes de entidades

// lib/encryption.ts - Encriptación de Datos
- encryptData() - Encripta datos con AES-256-GCM
- decryptData() - Desencripta datos
- hashData() - Hash one-way para datos sensibles
- generateSecureToken() - Genera tokens seguros

// lib/security.ts - Middleware de Seguridad
- securityHeaders - Headers HTTP de seguridad
- validateOrigin() - Validación de origen de requests
- detectSuspiciousActivity() - Detección de actividad sospechosa

// lib/rate-limit.ts - Rate Limiting Avanzado
- rateLimitConfigs - Configuraciones de rate limiting
- createRateLimitMiddleware() - Middleware de rate limiting
- getClientIP() - Obtención de IP del cliente
```

#### Database Schema para Seguridad
```prisma
// database/prisma/schema.prisma
model User {
  // ... campos existentes
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?
  backupCodes      String? // JSON array de códigos de respaldo
}

model AuditLog {
  id              String    @id @default(cuid())
  userId          String
  action          String
  entity          String    // Tabla afectada
  entityId        String
  oldValue        String?   // JSON string
  newValue        String?   // JSON string
  ipAddress       String?
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### Endpoints de Seguridad
```typescript
// app/api/2fa/route.ts
GET  /api/2fa - Estado actual de 2FA
POST /api/2fa - Configurar 2FA
POST /api/2fa/disable - Deshabilitar 2FA

// app/api/audit/route.ts
GET /api/audit - Logs de auditoría (Admin)
```

### Implementación de 2FA

#### Flujo de Configuración
1. Usuario solicita habilitar 2FA
2. Sistema genera secreto TOTP único
3. Se crea QR code con otpauth:// URL
4. Usuario escanea QR en app autenticadora
5. Sistema genera códigos de respaldo
6. Usuario confirma configuración

#### Verificación de Login con 2FA
```typescript
// lib/auth.ts - authorize function
if (user.twoFactorEnabled && user.twoFactorSecret) {
  const token = credentials.twoFactorToken
  const backupCode = credentials.backupCode

  if (token) {
    is2FAValid = verify2FAToken(user.twoFactorSecret, token)
  } else if (backupCode && user.backupCodes) {
    is2FAValid = verifyBackupCode(storedCodes, backupCode)
    // Remover código usado
  }
}
```

### Sistema de Auditoría

#### Categorización de Eventos
```typescript
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',

  // User Management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',

  // Data Operations
  SALE_CREATED: 'SALE_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
} as const

export const AUDIT_ENTITIES = {
  AUTH: 'AUTH',
  USER: 'USER',
  SALE: 'SALE',
  PRODUCT: 'PRODUCT',
  CUSTOMER: 'CUSTOMER',
} as const
```

#### Logging Automático
```typescript
await logAuditEvent({
  userId: user.id,
  action: AUDIT_ACTIONS.LOGIN_SUCCESS,
  entity: AUDIT_ENTITIES.AUTH,
  entityId: user.username,
  newValue: { role: user.role },
  ipAddress: clientIP,
})
```

### Rate Limiting Avanzado

#### Configuraciones por Endpoint
```typescript
export const rateLimitConfigs = {
  login: {
    points: 5,      // Número de requests
    duration: 900,  // Por 15 minutos
    blockDuration: 900, // Bloqueo por 15 minutos
  },
  validation: {
    points: 100,    // Requests por hora
    duration: 3600,
    blockDuration: 300, // Bloqueo por 5 minutos
  }
}
```

#### Detección de Actividad Sospechosa
```typescript
// lib/rate-limit.ts
function detectSuspiciousActivity(req: NextRequest): boolean {
  const userAgent = req.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /dirbuster/i,
  ]
  return suspiciousPatterns.some(pattern => pattern.test(userAgent))
}
```

### Headers de Seguridad

#### Configuración de Headers
```typescript
// lib/security.ts
export const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}
```

---

## 🔥 IMPLEMENTACIÓN PRIORIDAD ALTA

## 1. Sistema de Reembolsos con NCF Automático

### 📝 Especificación Técnica

#### Schema Updates Requeridos
```prisma
// database/prisma/schema.prisma
model Refund {
  id            String   @id @default(cuid())
  saleId        String
  amount        Float
  reason        String?
  ncf           String?  // NCF de nota de crédito (B04)
  ncfType       String?  @default("B04")
  status        String   @default("PENDING") // PENDING, APPROVED, COMPLETED
  processedBy   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sale          Sale     @relation(fields: [saleId], references: [id])
  processedByUser User   @relation(fields: [processedBy], references: [id])

  @@map("refunds")
}

// Agregar relación en Sale
model Sale {
  // ... campos existentes
  refunds       Refund[]
}
```

#### API Endpoint Updates
```typescript
// app/api/refunds/route.ts
export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { saleId, amount, reason } = await req.json()

    // Validar que el reembolso no exceda la venta original
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { refunds: true }
    })

    const totalRefunded = sale.refunds.reduce((sum, r) => sum + r.amount, 0)
    if (totalRefunded + amount > sale.total) {
      return NextResponse.json(
        { error: "Refund amount exceeds sale total" },
        { status: 400 }
      )
    }

    // Generar NCF para nota de crédito
    const ncf = await generateNCF('B04')

    // Crear reembolso
    const refund = await prisma.refund.create({
      data: {
        saleId,
        amount,
        reason,
        ncf,
        ncfType: 'B04',
        processedBy: session.user.id
      }
    })

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'REFUND_CREATED',
        entityType: 'REFUND',
        entityId: refund.id,
        userId: session.user.id,
        details: { amount, reason, ncf }
      }
    })

    return NextResponse.json(refund)
  } catch (error) {
    console.error('Error creating refund:', error)
    return NextResponse.json(
      { error: 'Error creating refund' },
      { status: 500 }
    )
  }
}
```

#### Componente UI para Reembolsos
```typescript
// components/RefundForm.tsx
'use client'

import { useState } from 'react'

interface RefundFormProps {
  saleId: string
  maxAmount: number
  onSuccess: () => void
}

export default function RefundForm({ saleId, maxAmount, onSuccess }: RefundFormProps) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId,
          amount: parseFloat(amount),
          reason
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      alert('Error creating refund')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Monto a Reembolsar (Máximo: RD$ {maxAmount.toFixed(2)})
        </label>
        <input
          type="number"
          step="0.01"
          max={maxAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Razón del Reembolso
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || parseFloat(amount) > maxAmount}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Crear Reembolso'}
      </button>
    </form>
  )
}
```

### 🧪 Tests Requeridos
```typescript
// __tests__/refunds.test.ts
describe('Refund System', () => {
  test('should create refund with NCF', async () => {
    // Test implementation
  })

  test('should prevent refund exceeding sale total', async () => {
    // Test implementation
  })

  test('should generate audit log', async () => {
    // Test implementation
  })
})
```

---

## 2. PDF Generation para Cotizaciones

### 📝 Implementación Técnica

#### Función de Generación PDF
```typescript
// lib/pdf-generator.ts
import puppeteer from 'puppeteer'

export async function generateQuotationPDF(quotationId: string): Promise<Buffer> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: true,
      items: { include: { product: true } }
    }
  })

  if (!quotation) {
    throw new Error('Quotation not found')
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123 }) // A4

    const htmlContent = generateQuotationHTML(quotation)
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })

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

#### Update API Email
```typescript
// app/api/quotations/email/route.ts
export async function POST(req: NextRequest) {
  // ... código existente ...

  // Generate PDF attachment
  const pdfBuffer = await generateQuotationPDF(quotationId)

  const attachments = [{
    filename: `Cotizacion_${quotation.quotationNumber}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }]

  // ... resto del código ...
}
```

---

## 3. Notificaciones Automáticas NCF

### 📝 Implementación Técnica

#### Servicio de Notificaciones
```typescript
// lib/notification-service.ts
import nodemailer from 'nodemailer'

export class NotificationService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
      // Configuración existente
    })
  }

  async sendNCFAlert(email: string, alertData: {
    type: 'EXPIRING' | 'EXHAUSTED'
    ncfType: string
    daysUntilExpiry?: number
    remainingNumbers?: number
  }) {
    const subject = alertData.type === 'EXPIRING'
      ? `Alerta: NCF ${alertData.ncfType} expira pronto`
      : `Alerta: NCF ${alertData.ncfType} agotándose`

    const html = this.generateAlertHTML(alertData)

    await this.transporter.sendMail({
      from: process.env.SMTP_SENDER_NAME,
      to: email,
      subject,
      html
    })
  }

  private generateAlertHTML(data: any): string {
    // Template HTML para alertas
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Alerta de NCF</h2>
        <p>Se ha detectado un problema con sus secuencias de NCF:</p>
        <!-- Detalles de la alerta -->
      </div>
    `
  }
}
```

#### Cron Job para Alertas
```typescript
// scripts/check-ncf-alerts.ts
import { NotificationService } from '../lib/notification-service'
import { prisma } from '../lib/prisma'

async function checkNCFAlerts() {
  const sequences = await prisma.nCFSequence.findMany()
  const notificationService = new NotificationService()

  for (const sequence of sequences) {
    // Check expiry alerts (30 days)
    const daysUntilExpiry = Math.ceil(
      (sequence.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      // Send expiry alert
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      })

      for (const user of adminUsers) {
        await notificationService.sendNCFAlert(user.email, {
          type: 'EXPIRING',
          ncfType: sequence.type,
          daysUntilExpiry
        })
      }
    }

    // Check exhaustion alerts (10% remaining)
    const remainingNumbers = sequence.endNumber - sequence.currentNumber
    const totalNumbers = sequence.endNumber - sequence.startNumber
    const percentageRemaining = (remainingNumbers / totalNumbers) * 100

    if (percentageRemaining <= 10) {
      // Send exhaustion alert
      // Similar logic to expiry alerts
    }
  }
}

// Ejecutar diariamente
export { checkNCFAlerts }
```

---

## 🟡 IMPLEMENTACIÓN PRIORIDAD MEDIA

## 4. Suite de Testing Completo

### 📝 Configuración Jest
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

### 📝 Tests de Ejemplo
```typescript
// __tests__/api/sales.test.ts
import { createMocks } from 'node-mocks-http'
import { POST } from '../../app/api/sales/route'

describe('/api/sales', () => {
  test('creates sale with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        customerId: 'test-customer',
        items: [{ productId: 'test-product', quantity: 1 }],
        paymentMethod: 'CASH'
      }
    })

    await POST(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('ncf')
  })

  test('validates required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {} // Missing required fields
    })

    await POST(req, res)

    expect(res._getStatusCode()).toBe(400)
  })
})
```

---

## 🟢 IMPLEMENTACIÓN PRIORIDAD BAJA

## 5. Reportes Avanzados

### 📝 Builder de Reportes
```typescript
// lib/report-builder.ts
interface ReportConfig {
  type: 'SALES' | 'INVENTORY' | 'CUSTOMERS'
  dateRange: { start: Date; end: Date }
  filters: Record<string, any>
  groupBy?: string[]
  metrics: string[]
}

export class ReportBuilder {
  async generateReport(config: ReportConfig) {
    const query = this.buildQuery(config)
    const data = await prisma.$queryRaw(query)
    return this.formatData(data, config)
  }

  private buildQuery(config: ReportConfig): string {
    // Dynamic query building logic
    // Implementation depends on report type
  }

  private formatData(data: any[], config: ReportConfig) {
    // Data formatting and aggregation
  }
}
```

---

## 🔄 Proceso de Implementación por Tarea

### Template para Cada Tarea
```markdown
## [Nombre de la Tarea]

### 🎯 Objetivo
[Descripción clara del objetivo]

### 📋 Requisitos
- [ ] Requisito 1
- [ ] Requisito 2
- [ ] Requisito 3

### 🛠️ Tareas Técnicas
- [ ] Diseño de schema (si aplica)
- [ ] Implementación API
- [ ] Componentes UI
- [ ] Tests
- [ ] Documentación

### ✅ Criterios de Aceptación
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

### 🧪 Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

### 📚 Documentación
- [ ] README actualizado
- [ ] API docs
- [ ] User guide
- [ ] Testing docs
```

### Checklist de Calidad
- [ ] Código revisado por pair programming
- [ ] Tests pasan con >80% cobertura
- [ ] Linting sin errores
- [ ] Performance aceptable
- [ ] Documentación completa
- [ ] Demo funcional para stakeholders

---

## 📊 Métricas de Seguimiento

### Por Sprint (2-3 semanas)
- **Velocidad**: Story points completados
- **Calidad**: Bugs encontrados post-release
- **Cumplimiento**: % de criterios de aceptación cumplidos
- **Documentación**: % de tareas con docs completas

### Dashboard de Métricas
```typescript
// lib/metrics.ts
export interface SprintMetrics {
  sprintNumber: number
  startDate: Date
  endDate: Date
  plannedPoints: number
  completedPoints: number
  bugsFound: number
  testCoverage: number
  documentationCompleteness: number
}
```

---

## 🚨 Plan de Contingencia

### Riesgos Identificados
1. **Complejidad DGII**: Consultoría externa especializada
2. **Performance Degradation**: Profiling continuo y optimización
3. **Testing Gaps**: Revisión de código obligatoria
4. **Documentation Drift**: Actualización automática integrada

### Plan B por Área
- **Reembolsos**: Implementación simplificada sin NCF automático inicialmente
- **PDF Generation**: Fallback a HTML con CSS print styles
- **Notificaciones**: Alertas solo en dashboard inicialmente
- **Offline Mode**: Funcionalidad básica con sincronización manual

---

*Este documento debe actualizarse con cada implementación completada*</content>
<parameter name="filePath">/home/gntech/PS/pos-system/docs/TECHNICAL_IMPLEMENTATION_GUIDE.md