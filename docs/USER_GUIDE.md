# User Guide - POS System

This guide provides instructions for using the Point of Sale system for Dominican Republic businesses.

## Getting Started

### Login
1. Open your browser and navigate to the POS system URL
2. Enter your username and password
3. Click "Iniciar Sesión"

### User Roles
- **Admin**: Full system access, user management, settings
- **Manager**: Sales, inventory, reports, customer management
- **Cashier**: Sales processing, basic customer lookup

## Dashboard

The dashboard provides an overview of:
- Today's sales and revenue
- Low stock alerts
- Recent transactions
- Top-selling products

## Sales Management

### Processing a Sale
1. Go to the POS page
2. Search for products by name or barcode
3. Add items to the cart
4. Enter customer information (optional)
5. Select payment method
6. Process the payment
7. Print receipt

### Sale Types
- **Factura de Crédito Fiscal (B01)**: For businesses (with ITBIS)
- **Factura de Consumo (B02)**: For final consumers
- **Factura Gubernamental (B15)**: For government entities

### Refunds
1. Go to Refunds page
2. Search for the original sale
3. Select items to refund
4. Process the refund
5. Generate credit note

## Inventory Management

### Adding Products
1. Go to Products page
2. Click "Add Product"
3. Enter product details:
   - Name
   - Price
   - Stock quantity
   - Category
   - Barcode (optional)
4. Save the product

### Managing Stock
- View current stock levels
- Set low stock alerts
- Track batch numbers and expiration dates
- Generate inventory reports

### Product Categories
- Create and manage product categories
- Filter products by category
- Generate category-based reports

## Customer Management

### Adding Customers
1. Go to Customers page
2. Click "Add Customer"
3. Enter customer information:
   - Name
   - Email
   - Phone
   - RNC (for businesses)
   - Cédula (for individuals)
4. Save the customer

### Customer Validation
- RNC validation against DGII database
- Cédula validation
- Automatic tax exemption checks

## Quotations

### Creating Quotations
1. Go to Quotations page
2. Click "New Quotation"
3. Add products and quantities
4. Enter customer information
5. Set validity period
6. Save and optionally email to customer

### Managing Quotations
- View all quotations
- Convert quotations to sales
- Email quotations to customers
- Track quotation status

## Reports

### Available Reports
- **Sales Reports**: Daily, weekly, monthly sales data
- **Inventory Reports**: Stock levels, low stock alerts
- **Customer Reports**: Customer purchase history
- **DGII Reports**: Tax compliance reports

### Generating Reports
1. Go to Reports page
2. Select report type
3. Set date range
4. Apply filters
5. Export to PDF or Excel

## Settings

### System Settings
- Business information (name, address, RNC)
- Tax settings
- NCF sequence configuration
- Email settings

### User Management (Admin Only)
- Create new users
- Assign roles
- Reset passwords
- View user activity logs

## NCF Management

### NCF Sequences
The system manages different NCF types:
- B01: Crédito Fiscal
- B02: Consumo
- B14: Regímenes Especiales
- B15: Gubernamental
- B16: Exportaciones

### NCF Alerts
- Automatic alerts for expiring NCF sequences
- Low sequence warnings
- Expiration tracking

## Backup and Restore

### Creating Backups
1. Go to Backup page
2. Click "Create Backup"
3. Choose backup type (full or incremental)
4. Download or store the backup file

### Restoring Data
1. Go to Restore page
2. Upload a backup file
3. Select restore options
4. Confirm and execute restore

## Printing

### Receipt Printing
- Thermal printer support
- A4 invoice printing
- Customizable receipt templates

### Supported Printers
- ESC/POS thermal printers
- Standard A4 printers
- Network and USB printers

## Troubleshooting

### Common Issues

#### Login Problems
- Check username and password
- Ensure caps lock is off
- Contact admin if account is locked

#### Printing Issues
- Check printer connection
- Verify printer settings
- Restart print spooler

#### NCF Errors
- Check NCF sequence availability
- Verify business RNC settings
- Contact DGII if needed

#### Database Errors
- Check database connection
- Run backup before troubleshooting
- Contact technical support

### Support
For technical issues, contact your system administrator or GNTech support.

## Security Best Practices

- Change default passwords immediately
- Use strong passwords
- Log out when not using the system
- Keep software updated
- Regular backups
- Monitor user activity logs

## Keyboard Shortcuts

- `F1`: Help
- `F2`: Search products
- `F3`: Customer lookup
- `F4`: Payment
- `F5`: Print receipt
- `F12`: Logout

## Mobile Usage

The system is optimized for mobile devices:
- Touch-friendly interface
- Responsive design
- Mobile receipt printing
- Offline capability (future feature)