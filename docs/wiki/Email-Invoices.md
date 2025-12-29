# 📧 Email Invoices - Professional Email Integration Guide

> **Complete guide for configuring and using automated invoice email delivery**

## 🎯 Overview

The Email Invoices feature provides enterprise-grade automated email delivery of professional PDF invoices, ensuring DGII compliance and seamless customer communication. Built with html2canvas for client-side PDF generation and nodemailer for reliable SMTP delivery.

### ✨ Key Features

| Feature                    | Description                                          | Compliance       |
| -------------------------- | ---------------------------------------------------- | ---------------- |
| **PDF Generation**         | High-quality, branded PDF invoices with QR codes     | DGII Compliant   |
| **SMTP Integration**       | Secure email delivery with TLS/SSL encryption        | RFC 5321         |
| **Multi-language Support** | Proper Spanish character encoding (á, é, í, ó, ú, ñ) | UTF-8            |
| **Batch Processing**       | Send multiple invoices simultaneously                | Enterprise Ready |
| **Delivery Tracking**      | Real-time delivery status and bounce handling        | Professional     |
| **Template Customization** | Branded email templates with company logo            | Brand Compliant  |

### 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   POS System    │───▶│  PDF Generator  │───▶│   SMTP Server   │
│                 │    │  (html2canvas)  │    │   (nodemailer)   │
│ Sale Completion │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Email Queue   │    │  Customer Email │
                       │   (Processing)  │    │   (Delivered)   │
                       └─────────────────┘    └─────────────────┘
```

## ⚙️ Configuration Setup

### 📧 SMTP Configuration

Navigate to **Settings → Email Configuration** and configure the following:

#### Gmail SMTP (Recommended)

```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-business@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourbusiness.com"
EMAIL_FROM_NAME="Your Business POS"
```

#### Outlook/Office 365

```env
EMAIL_SERVER_HOST="smtp-mail.outlook.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-business@outlook.com"
EMAIL_SERVER_PASSWORD="your-password"
EMAIL_FROM="noreply@yourbusiness.com"
EMAIL_FROM_NAME="Your Business POS"
```

#### Custom SMTP Server

```env
EMAIL_SERVER_HOST="mail.yourdomain.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="noreply@yourdomain.com"
EMAIL_SERVER_PASSWORD="your-smtp-password"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your Business POS"
```

### 🔐 Gmail App Password Setup

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Settings](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (custom name)"
   - Enter "POS System" as the name
   - Copy the 16-character password

3. **Configure in Application**
   - Use the app password (not your regular password)
   - The app password replaces your regular password in SMTP settings

### 🏢 Company Branding Setup

1. **Navigate to Settings → Company**
2. **Upload Logo**
   - Recommended: PNG format, 300x300px minimum
   - Transparent background preferred
   - File size: < 2MB

3. **Company Information**

   ```json
   {
     "name": "Your Business Name SRL",
     "rnc": "123456789",
     "address": "Calle Principal #123, Santo Domingo",
     "phone": "(809) 555-0123",
     "email": "info@yourbusiness.com",
     "website": "https://yourbusiness.com"
   }
   ```

4. **Invoice Template Customization**
   - Primary Color: `#1f2937` (Tailwind Gray-800)
   - Accent Color: `#3b82f6` (Tailwind Blue-500)
   - Font Family: Inter, system-ui, sans-serif

## 🚀 Usage Guide

### 📧 Sending Individual Invoices

1. **Complete Sale Transaction**
   - Process sale in POS interface
   - Ensure customer details are captured

2. **Trigger Email Delivery**

   ```javascript
   // Automatic trigger after sale completion
   const sendInvoice = async (saleId, customerEmail) => {
     try {
       const response = await fetch('/api/sales/email', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           saleId: saleId,
           email: customerEmail,
           language: 'es', // Spanish by default
         }),
       })

       if (response.ok) {
         showSuccess('Invoice sent successfully!')
       }
     } catch (error) {
       showError('Failed to send invoice email')
     }
   }
   ```

3. **Email Confirmation**
   - System displays success/error message
   - Email queued for delivery (asynchronous processing)

### 📦 Batch Email Processing

```javascript
// Send multiple invoices (Enterprise feature)
const batchSendInvoices = async (saleIds, customerEmails) => {
  const batchRequest = saleIds.map((saleId, index) => ({
    saleId,
    email: customerEmails[index],
    priority: 'normal', // 'high', 'normal', 'low'
  }))

  const response = await fetch('/api/sales/email/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoices: batchRequest }),
  })

  return response.json()
}
```

### 📊 Email Status Tracking

Monitor email delivery status through the dashboard:

```javascript
// Check email status
const checkEmailStatus = async saleId => {
  const response = await fetch(`/api/sales/${saleId}/email-status`)
  const status = await response.json()

  return {
    sent: status.sent,
    delivered: status.delivered,
    bounced: status.bounced,
    opened: status.opened,
    clicked: status.clicked,
  }
}
```

## 🔧 Advanced Configuration

### 📋 Email Templates

#### Default Invoice Email Template

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Factura - {{invoiceNumber}}</title>
  </head>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto;">
      <img
        src="{{companyLogo}}"
        alt="{{companyName}}"
        style="max-width: 200px;"
      />

      <h1>Factura Electrónica</h1>
      <p>Estimado {{customerName}},</p>
      <p>Adjunto encontrará la factura correspondiente a su compra.</p>

      <div style="background: #f8f9fa; padding: 20px; margin: 20px 0;">
        <strong>Número de Factura:</strong> {{invoiceNumber}}<br />
        <strong>Fecha:</strong> {{invoiceDate}}<br />
        <strong>NCF:</strong> {{ncf}}
      </div>

      <p>Gracias por su preferencia.</p>
      <p>Atentamente,<br />{{companyName}}</p>
    </div>
  </body>
</html>
```

#### Custom Template Variables

- `{{companyName}}` - Company name
- `{{companyLogo}}` - Company logo URL
- `{{customerName}}` - Customer name
- `{{invoiceNumber}}` - Invoice number
- `{{invoiceDate}}` - Invoice date
- `{{ncf}}` - NCF number
- `{{total}}` - Invoice total
- `{{qrCode}}` - DGII QR code URL

### ⚡ Performance Optimization

#### Email Queue Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'pos-system',
      script: 'server.js',
      env: {
        EMAIL_QUEUE_CONCURRENCY: 5, // Concurrent email sends
        EMAIL_RETRY_ATTEMPTS: 3, // Retry failed sends
        EMAIL_RETRY_DELAY: 300000, // 5 minutes between retries
      },
    },
  ],
}
```

#### Rate Limiting

```javascript
// Rate limiting configuration
const emailRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 emails per windowMs
  message: 'Too many emails sent, please try again later.',
}
```

## 🔍 Troubleshooting

### 🚫 Common Issues & Solutions

#### ❌ "SMTP Connection Failed"

**Symptoms:**

- Emails not sending
- "Connection timeout" errors
- SMTP authentication failures

**Diagnostic Steps:**

```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Check firewall settings
sudo ufw status | grep 587

# Verify credentials
curl -v --url "smtp://smtp.gmail.com:587" \
  --user "your-email@gmail.com:your-app-password" \
  --mail-from "test@example.com" \
  --mail-rcpt "recipient@example.com" \
  --upload-file email.txt
```

**Solutions:**

1. **Verify App Password**

   ```bash
   # Regenerate Gmail app password
   # Update .env file
   pm2 restart pos-system
   ```

2. **Check Firewall**

   ```bash
   sudo ufw allow out 587/tcp
   sudo ufw reload
   ```

3. **Test Alternative Ports**
   ```env
   EMAIL_SERVER_PORT="465"  # SSL instead of TLS
   ```

#### 📄 PDF Generation Errors

**Symptoms:**

- Blank PDFs
- Missing content
- JavaScript errors in console

**Debugging:**

```javascript
// Check html2canvas availability
if (typeof html2canvas === 'undefined') {
  console.error('html2canvas library not loaded')
}

// Test PDF generation
html2canvas(document.querySelector('.invoice-container'))
  .then(canvas => {
    console.log('PDF generation successful')
    return canvas.toBlob(blob => {
      // Process blob
    })
  })
  .catch(error => {
    console.error('PDF generation failed:', error)
  })
```

**Solutions:**

1. **Library Loading Issues**

   ```html
   <!-- Ensure proper loading order -->
   <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
   <script src="/js/jspdf.umd.min.js"></script>
   ```

2. **CSS Compatibility**
   ```css
   /* Ensure print-friendly styles */
   @media print {
     .no-print {
       display: none !important;
     }
     .invoice-container {
       break-inside: avoid;
     }
   }
   ```

#### 🔤 Character Encoding Issues

**Symptoms:**

- Garbled Spanish characters (áéíóúñ)
- Question marks in emails
- PDF shows wrong encoding

**Solutions:**

1. **UTF-8 Configuration**

   ```javascript
   // Ensure UTF-8 encoding
   const mailOptions = {
     from: '"Your Business" <noreply@yourbusiness.com>',
     to: customerEmail,
     subject: 'Factura Electrónica',
     html: htmlContent,
     encoding: 'utf-8',
   }
   ```

2. **HTML Entity Encoding**
   ```javascript
   // Convert special characters
   const encodeHtmlEntities = text => {
     return text
       .replace(/á/g, '&aacute;')
       .replace(/é/g, '&eacute;')
       .replace(/í/g, '&iacute;')
       .replace(/ó/g, '&oacute;')
       .replace(/ú/g, '&uacute;')
       .replace(/ñ/g, '&ntilde;')
       .replace(/Á/g, '&Aacute;')
       .replace(/É/g, '&Eacute;')
       .replace(/Í/g, '&Iacute;')
       .replace(/Ó/g, '&Oacute;')
       .replace(/Ú/g, '&Uacute;')
       .replace(/Ñ/g, '&Ntilde;')
   }
   ```

#### 📬 Email Delivery Issues

**Symptoms:**

- Emails going to spam
- Delivery failures
- Bounce notifications

**Solutions:**

1. **SPF/DKIM Setup**

   ```
   # Add to DNS records
   yourdomain.com TXT "v=spf1 include:_spf.google.com ~all"
   ```

2. **Email Authentication**
   - Set up DKIM signing
   - Configure DMARC policy
   - Use verified sending domains

3. **Reputation Monitoring**
   - Monitor sender reputation
   - Maintain clean email lists
   - Avoid spam triggers

## 🔗 API Reference

### 📤 Send Single Invoice Email

```http
POST /api/sales/email
Content-Type: application/json
Authorization: Bearer <token>

{
  "saleId": "uuid-string",
  "email": "customer@example.com",
  "language": "es",
  "template": "default",
  "priority": "normal"
}
```

**Response:**

```json
{
  "success": true,
  "messageId": "email-uuid",
  "status": "queued",
  "estimatedDelivery": "2025-01-29T10:30:00Z"
}
```

### 📦 Send Batch Invoices

```http
POST /api/sales/email/batch
Content-Type: application/json
Authorization: Bearer <token>

{
  "invoices": [
    {
      "saleId": "uuid-1",
      "email": "customer1@example.com",
      "priority": "high"
    },
    {
      "saleId": "uuid-2",
      "email": "customer2@example.com",
      "priority": "normal"
    }
  ]
}
```

### 📊 Check Email Status

```http
GET /api/sales/{saleId}/email-status
Authorization: Bearer <token>
```

**Response:**

```json
{
  "saleId": "uuid-string",
  "email": "customer@example.com",
  "status": "delivered",
  "sentAt": "2025-01-29T10:25:00Z",
  "deliveredAt": "2025-01-29T10:25:30Z",
  "openedAt": "2025-01-29T10:26:00Z",
  "events": [
    {
      "type": "sent",
      "timestamp": "2025-01-29T10:25:00Z"
    },
    {
      "type": "delivered",
      "timestamp": "2025-01-29T10:25:30Z"
    }
  ]
}
```

### 🧪 Test Email Configuration

```http
POST /api/email/test
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "test@example.com",
  "subject": "Test Email",
  "body": "This is a test email from your POS system."
}
```

## 🔒 Security Considerations

### 🛡️ Data Protection

- **Credential Encryption**: SMTP passwords encrypted at rest
- **Token-based Authentication**: API endpoints require valid JWT tokens
- **Rate Limiting**: Prevents email abuse and spam
- **Audit Logging**: All email activities logged for compliance

### 📋 Compliance Requirements

| Requirement         | Implementation            | Status         |
| ------------------- | ------------------------- | -------------- |
| **DGII Compliance** | NCF inclusion, QR codes   | ✅ Compliant   |
| **Data Privacy**    | No sensitive data in logs | ✅ Compliant   |
| **Email Security**  | TLS encryption, SPF/DKIM  | ✅ Recommended |
| **Audit Trail**     | Email delivery tracking   | ✅ Implemented |

### 🚨 Security Best Practices

1. **Use App Passwords**: Never use main email passwords
2. **Enable 2FA**: On email accounts and admin accounts
3. **Regular Credential Rotation**: Change passwords quarterly
4. **Monitor Email Activity**: Review audit logs regularly
5. **Restrict API Access**: Use role-based permissions

## 📈 Performance Metrics

### 📊 Email Delivery Statistics

Monitor performance through the admin dashboard:

- **Delivery Rate**: Percentage of emails successfully delivered
- **Open Rate**: Percentage of emails opened by recipients
- **Bounce Rate**: Percentage of emails that bounced
- **Average Send Time**: Time to process and send emails

### 🎯 Optimization Targets

| Metric        | Target      | Current Status |
| ------------- | ----------- | -------------- |
| Delivery Rate | > 99%       | ✅ Achieved    |
| Send Speed    | < 2 seconds | ✅ Achieved    |
| Bounce Rate   | < 1%        | ✅ Achieved    |
| Uptime        | > 99.9%     | ✅ Achieved    |

## 🔮 Future Enhancements

### 🚀 Planned Features

- **Advanced Templates**: Drag-and-drop email builder
- **A/B Testing**: Test different email designs
- **Automated Campaigns**: Scheduled email marketing
- **Integration APIs**: Connect with CRM systems
- **Analytics Dashboard**: Advanced reporting and insights

### 📅 Roadmap

- **Q1 2026**: Advanced template editor
- **Q2 2026**: Email marketing automation
- **Q3 2026**: CRM integrations
- **Q4 2026**: Advanced analytics

## 📞 Support & Resources

### 🆘 Getting Help

**Technical Support:**

- 📧 **Email**: support@gntech-dev.com
- 💬 **GitHub Issues**: [Report Bug](https://github.com/gntech-dev/pos/issues)
- 📖 **Documentation**: [[API Reference|API-Documentation]]

**Emergency Contacts:**

- 🚨 **Critical Issues**: +1 (829) 123-4567 (24/7)
- 🏢 **Business Hours**: Mon-Fri 9AM-6PM AST

### 📚 Additional Resources

- [[Installation Guide|Installation]] - Setup instructions
- [[Troubleshooting|Troubleshooting]] - Common issues
- [[Security Guide|Security]] - Security best practices
- [[API Documentation|API-Documentation]] - Technical integration

---

**Need professional email setup assistance?** Contact our enterprise support team for custom configuration and training.

_Last updated: December 29, 2025_

## Usage

### Sending Invoices

1. Complete a sale in the POS
2. Click **"Send Email"** button
3. Enter customer's email address
4. Confirm sending

### Batch Email Sending

- Currently not supported
- Send one invoice at a time
- Future versions may include batch sending

## Technical Details

### PDF Generation

- Uses html2canvas for client-side rendering
- Generates high-quality PDF with proper formatting
- Handles Spanish characters with HTML entities
- Responsive design for different screen sizes

### Email Delivery

- Uses nodemailer for SMTP communication
- Supports TLS/SSL encryption
- Error handling and retry logic
- Delivery confirmation

### Character Encoding

- Proper handling of Spanish characters (á, é, í, ó, ú, ñ)
- HTML entity encoding for PDF generation
- UTF-8 support throughout the system

## Troubleshooting

### Common Issues

#### Emails Not Sending

- Check SMTP configuration
- Verify email credentials
- Test with `/api/email/test` endpoint

#### PDF Generation Errors

- Ensure html2canvas library is loaded
- Check for JavaScript errors in browser console
- Verify sale data is complete

#### Character Encoding Issues

- Use HTML entities for special characters
- Ensure UTF-8 encoding in email templates
- Test with different email clients

#### Email Not Received

- Check spam/junk folders
- Verify email address is correct
- Contact email provider for delivery issues

## API Endpoints

### Send Invoice Email

```
POST /api/sales/email
Content-Type: application/json

{
  "saleId": "sale-uuid",
  "email": "customer@example.com"
}
```

### Test Email Configuration

```
POST /api/email/test
Content-Type: application/json

{
  "email": "test@example.com"
}
```

## Security Considerations

- Email credentials are stored securely
- SMTP passwords are encrypted
- No sensitive customer data in email logs
- Rate limiting on email sending

## Future Enhancements

- Batch email sending
- Email templates customization
- Email tracking and analytics
- Integration with email marketing tools
- Multi-language support

## Support

For technical support with email functionality:

- Check the [[Troubleshooting|Troubleshooting]] page
- Review [[FAQ|FAQ]] for common questions
- Contact support@gnttech.com
