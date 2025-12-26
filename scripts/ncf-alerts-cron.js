#!/usr/bin/env node

/**
 * NCF Alerts Cron Job Script
 *
 * This script automatically checks for NCF alerts and sends email notifications
 * when critical issues are detected. It should be run periodically (e.g., daily)
 * using a cron job or task scheduler.
 *
 * Usage:
 * node scripts/ncf-alerts-cron.js
 *
 * Or add to crontab for daily execution at 9 AM:
 * 0 9 * * * cd /path/to/pos-system && node scripts/ncf-alerts-cron.js
 */

const { PrismaClient } = require('@prisma/client')
const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const CONFIG_FILE = path.join(process.cwd(), 'email-config.json')

// Get business settings from database
async function getBusinessSettings() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['business_name', 'business_rnc', 'business_address', 'business_phone', 'business_email', 'business_logo']
      }
    }
  })

  const businessData = {
    name: 'GNTech Demo',
    rnc: '000-00000-0',
    address: 'Santo Domingo, República Dominicana',
    phone: '809-555-5555',
    email: 'info@gntech.com',
    logo: undefined
  }

  // Override with database values
  settings.forEach(setting => {
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

  return businessData
}

// Load email configuration
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

// Create email transporter
function createTransporter() {
  const emailConfig = loadEmailConfig()

  return nodemailer.createTransporter({
    host: emailConfig.host,
    port: parseInt(emailConfig.port.toString()),
    secure: emailConfig.secure || parseInt(emailConfig.port.toString()) === 465,
    requireTLS: emailConfig.tls,
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password || process.env.SMTP_PASS || ''
    },
    connectionTimeout: parseInt(emailConfig.timeout || '30000'),
    greetingTimeout: 30000,
    socketTimeout: parseInt(emailConfig.timeout || '30000'),
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  })
}

// Generate HTML email template for automated alerts
function generateNCFAlertEmailHTML(alerts, businessSettings) {
  const criticalAlerts = alerts.filter(a => a.severity === 'DANGER' || a.severity === 'CRITICAL')
  const warningAlerts = alerts.filter(a => a.severity === 'WARNING')

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alertas NCF Automáticas - ${businessSettings.name}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .alert-section { margin-bottom: 30px; }
        .alert-section h3 { color: #1f2937; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }
        .alert-item { margin-bottom: 15px; padding: 15px; border-radius: 8px; border-left: 4px solid; }
        .alert-message { margin: 0; font-weight: 500; }
        .alert-details { margin-top: 8px; font-size: 14px; color: #6b7280; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280; }
        .critical { background-color: #fef2f2; border-left-color: #dc2626; }
        .warning { background-color: #fefce8; border-left-color: #d97706; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Alertas NCF Automáticas</h1>
            <p>Notificación automática del sistema de control fiscal</p>
            <p style="color: #6b7280; font-size: 14px;">${businessSettings.name}</p>
        </div>

        ${criticalAlerts.length > 0 ? `
        <div class="alert-section">
            <h3>🚨 Problemas Críticos Requiren Atención Inmediata</h3>
            ${criticalAlerts.map(alert => `
            <div class="alert-item critical">
                <p class="alert-message">🚨 ${alert.message}</p>
                <div class="alert-details">
                    <strong>Tipo de NCF:</strong> ${alert.sequenceType}<br>
                    ${alert.daysLeft !== undefined ? `<strong>Días restantes:</strong> ${alert.daysLeft}<br>` : ''}
                    ${alert.remaining !== undefined ? `<strong>Números restantes:</strong> ${alert.remaining}<br>` : ''}
                </div>
            </div>
            `).join('')}
        </div>
        ` : ''}

        ${warningAlerts.length > 0 ? `
        <div class="alert-section">
            <h3>⚠️ Advertencias - Revisar Pronto</h3>
            ${warningAlerts.map(alert => `
            <div class="alert-item warning">
                <p class="alert-message">⚠️ ${alert.message}</p>
                <div class="alert-details">
                    <strong>Tipo de NCF:</strong> ${alert.sequenceType}<br>
                    ${alert.daysLeft !== undefined ? `<strong>Días restantes:</strong> ${alert.daysLeft}<br>` : ''}
                    ${alert.remaining !== undefined ? `<strong>Números restantes:</strong> ${alert.remaining}<br>` : ''}
                </div>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p><strong>${businessSettings.name}</strong></p>
            <p>RNC: ${businessSettings.rnc} | ${businessSettings.email}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                Esta es una notificación automática del sistema POS.<br>
                Generada el ${new Date().toLocaleDateString('es-DO')}
            </p>
        </div>
    </div>
</body>
</html>
  `
}

// Send automated NCF alert email
async function sendAutomatedNCFAlertEmail(alerts, businessSettings) {
  try {
    // Get admin users for email notifications
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, name: true }
    })

    const recipients = adminUsers
      .map(user => user.email)
      .filter(email => email && email.includes('@')) // Basic email validation

    if (recipients.length === 0) {
      console.warn('No valid admin email addresses found for NCF alerts')
      return false
    }

    const transporter = createTransporter()

    // Verify connection
    await transporter.verify()

    const emailHTML = generateNCFAlertEmailHTML(alerts, businessSettings)

    const criticalCount = alerts.filter(a => a.severity === 'DANGER' || a.severity === 'CRITICAL').length
    const subject = criticalCount > 0
      ? `🚨 ALERTA CRÍTICA NCF - ${criticalCount} problema(s) requieren atención inmediata`
      : `⚠️ Notificación NCF Automática - ${alerts.length} alerta(s) detectada(s)`

    const mailOptions = {
      from: `"${businessSettings.name} - Sistema POS" <${loadEmailConfig().user}>`,
      to: recipients.join(', '),
      subject,
      html: emailHTML
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Automated NCF alert email sent successfully:', result.messageId)

    return true
  } catch (error) {
    console.error('Error sending automated NCF alert email:', error)
    return false
  }
}

// Main function to check NCF alerts and send notifications
async function checkNCFAlertsAndNotify() {
  console.log('🔍 Starting automated NCF alerts check...')

  try {
    const sequences = await prisma.nCFSequence.findMany()
    const now = new Date()
    const alerts = []

    console.log(`📊 Checking ${sequences.length} NCF sequences...`)

    for (const sequence of sequences) {
      const expiryDate = new Date(sequence.expiryDate)
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const remaining = sequence.endNumber - sequence.currentNumber

      if (daysLeft < 0 || remaining <= 0) {
        // Critical issues
        if (daysLeft < 0) {
          alerts.push({
            type: 'EXPIRED',
            message: `CRÍTICO: Secuencia NCF ${sequence.type} EXPIRADA. Sistema pausado para este tipo.`,
            severity: 'DANGER',
            sequenceType: sequence.type,
            daysLeft,
            remaining,
            actionRequired: true,
            autoGenerated: true
          })
        } else if (remaining <= 0) {
          alerts.push({
            type: 'EXHAUSTED',
            message: `CRÍTICO: Secuencia NCF ${sequence.type} AGOTADA. No se pueden generar más NCF.`,
            severity: 'DANGER',
            sequenceType: sequence.type,
            remaining,
            actionRequired: true,
            autoGenerated: true
          })
        }
      } else if (daysLeft <= 7) {
        // Critical - expiring soon
        alerts.push({
          type: 'EXPIRING_SOON',
          message: `URGENTE: NCF ${sequence.type} expira en ${daysLeft} días. Renovar inmediatamente.`,
          severity: 'CRITICAL',
          sequenceType: sequence.type,
          daysLeft,
          remaining,
          actionRequired: true,
          autoGenerated: true
        })
      } else if (daysLeft <= 30) {
        // Warning - expiring within 30 days
        alerts.push({
          type: 'EXPIRING_SOON',
          message: `NCF ${sequence.type} expira en ${daysLeft} días. Considera renovar pronto.`,
          severity: 'WARNING',
          sequenceType: sequence.type,
          daysLeft,
          remaining,
          actionRequired: true,
          autoGenerated: true
        })
      }

      // Check for low stock
      if (remaining < 20) {
        const severity = remaining < 10 ? 'CRITICAL' : 'WARNING'
        alerts.push({
          type: 'LOW_STOCK',
          message: `Secuencia NCF ${sequence.type} tiene muy pocos números disponibles (${remaining} restantes).`,
          severity,
          sequenceType: sequence.type,
          remaining,
          actionRequired: true,
          autoGenerated: true
        })
      } else if (remaining < 100) {
        alerts.push({
          type: 'LOW_STOCK',
          message: `Secuencia NCF ${sequence.type} tiene pocos números disponibles (${remaining} restantes).`,
          severity: 'WARNING',
          sequenceType: sequence.type,
          remaining,
          actionRequired: true,
          autoGenerated: true
        })
      }
    }

    console.log(`⚠️ Found ${alerts.length} alerts`)

    // Only send emails for critical alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'DANGER' || a.severity === 'CRITICAL')

    if (criticalAlerts.length > 0) {
      console.log(`📧 Sending email notification for ${criticalAlerts.length} critical alerts...`)

      // Get business settings
      const businessSettings = await getBusinessSettings()

      const emailSent = await sendAutomatedNCFAlertEmail(criticalAlerts, businessSettings)

      if (emailSent) {
        console.log('✅ NCF alert notification sent successfully')

        // Log the automated check
        await prisma.auditLog.create({
          data: {
            userId: 'system', // System-generated
            action: 'AUTO_NCF_ALERT',
            entity: 'NCF',
            entityId: 'cron-job',
            newValue: JSON.stringify({
              alertsGenerated: alerts.length,
              criticalAlerts: criticalAlerts.length,
              sequencesChecked: sequences.length,
              emailSent: true,
              timestamp: now.toISOString()
            })
          }
        })
      } else {
        console.error('❌ Failed to send NCF alert notification')
      }
    } else {
      console.log('✅ No critical alerts found - no email sent')

      // Log the automated check even when no alerts
      await prisma.auditLog.create({
        data: {
          userId: 'system',
          action: 'AUTO_NCF_CHECK',
          entity: 'NCF',
          entityId: 'cron-job',
          newValue: JSON.stringify({
            alertsGenerated: alerts.length,
            criticalAlerts: 0,
            sequencesChecked: sequences.length,
            emailSent: false,
            timestamp: now.toISOString()
          })
        }
      })
    }

  } catch (error) {
    console.error('❌ Error during automated NCF alerts check:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  checkNCFAlertsAndNotify()
    .then(() => {
      console.log('🏁 Automated NCF alerts check completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { checkNCFAlertsAndNotify }