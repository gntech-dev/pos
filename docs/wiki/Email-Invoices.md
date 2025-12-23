# Email Invoices

This page provides detailed information about the email invoice functionality in the POS system.

## Overview

The email invoice feature allows you to send professional PDF invoices directly to customers via email after completing a sale. This feature uses html2canvas for client-side PDF generation and ensures proper Spanish character encoding.

## How It Works

1. **Sale Completion**: After processing a sale in the POS interface
2. **Email Trigger**: Click the "Send Email" button
3. **PDF Generation**: System generates a professional PDF invoice
4. **Email Delivery**: Invoice is sent to the customer's email address

## Features

### PDF Invoice Content
- Complete sale information
- Customer details (name, RNC/Cédula)
- Itemized product list with prices
- Subtotal, tax, and total calculations
- NCF (Número de Comprobante Fiscal)
- DGII compliance QR code
- Company branding (logo, contact info)

### Email Configuration
- SMTP server settings
- Sender email address
- Email templates
- Custom branding options

## Setup

### Email Configuration

1. Navigate to **Settings > Email**
2. Configure SMTP settings:
   - Host (e.g., smtp.gmail.com)
   - Port (587 for TLS, 465 for SSL)
   - Username (your email)
   - Password (app password for Gmail)
3. Test the configuration

### Company Branding

1. Go to **Settings > Company**
2. Upload company logo
3. Set company information
4. Configure invoice templates

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