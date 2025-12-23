# POS System - Testing Documentation

## Overview
This document provides comprehensive testing procedures for the POS System, including functional testing, security testing, and performance validation.

## System Architecture
- **Frontend**: Next.js 15 with React 19.2.1
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: Session-based with JWT
- **Email**: Nodemailer integration
- **PDF Generation**: jsPDF, PDFKit
- **Deployment**: PM2 process manager

## Test Environment Setup

### Pre-requisites
- Node.js 20+ installed
- npm or yarn package manager
- SQLite database access
- PM2 for process management

### Initial Data Setup
The system includes a seed script that creates:
- 3 user accounts (admin, manager, cashier)
- NCF sequences for Dominican Republic tax compliance
- Business settings
- Sample products

### Default Test Credentials
- **Admin**: username=`admin`, password=`admin123`
- **Manager**: username=`manager`, password=`manager123`
- **Cashier**: username=`cashier`, password=`cashier123`

## Core Functionality Tests

### 1. Authentication System
**Test Cases:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Session persistence across page refreshes
- [ ] Logout functionality
- [ ] Automatic redirect to login when accessing protected pages
- [ ] Role-based access control (admin, manager, cashier permissions)

**API Endpoints to Test:**
- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `GET /api/dashboard/stats` - Protected endpoint test

### 2. Dashboard & Statistics
**Test Cases:**
- [ ] Dashboard loads correctly after login
- [ ] Statistics display proper data
- [ ] Navigation between different sections
- [ ] Real-time updates of metrics
- [ ] Permission-based dashboard access

**API Endpoints to Test:**
- `GET /api/dashboard/stats` - Dashboard statistics
- [ ] Verify all data fields are populated correctly

### 3. Product Management
**Test Cases:**
- [ ] View product list
- [ ] Create new product
- [ ] Edit existing product
- [ ] Delete product
- [ ] Product search functionality
- [ ] Stock level alerts
- [ ] Barcode scanning integration
- [ ] Category management
- [ ] Batch tracking for products with expiration dates

**API Endpoints to Test:**
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `GET /api/products/batches` - Product batches
- `POST /api/products/batches` - Create batch
- `GET /api/inventory` - Inventory overview

### 4. Inventory Management
**Test Cases:**
- [ ] Stock level tracking
- [ ] Stock movements logging
- [ ] Low stock alerts
- [ ] Inventory adjustments
- [ ] Batch and expiration date tracking
- [ ] Stock reconciliation

**Key Features:**
- Real-time stock updates
- FIFO (First In, First Out) batch management
- Expiration date monitoring
- Stock movement audit trail

### 5. Sales Processing
**Test Cases:**
- [ ] Create new sale
- [ ] Process payment (cash, card, mixed)
- [ ] Apply discounts
- [ ] Tax calculations (18% ITBIS)
- [ ] Generate receipt/invoice
- [ ] NCF (Comprobante de Crédito Fiscal) assignment
- [ ] Sales history and search
- [ ] Sales reports

**API Endpoints to Test:**
- `POST /api/sales` - Create new sale
- `GET /api/sales/[id]` - Get sale details
- `POST /api/sales/email` - Email receipt
- [ ] Test different payment methods
- [ ] Test NCF assignment for fiscal documents

### 6. Customer Management
**Test Cases:**
- [ ] Add new customer
- [ ] Edit customer information
- [ ] Customer search functionality
- [ ] RNC validation with DGII
- [ ] Cédula validation
- [ ] Customer purchase history
- [ ] Email preferences

**API Endpoints to Test:**
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/search` - Search customers
- `GET /api/customers/validate-rnc/[rnc]` - RNC validation
- `GET /api/customers/validate-cedula/[cedula]` - Cédula validation

### 7. NCF (Tax Compliance) Management
**Test Cases:**
- [ ] NCF sequence management
- [ ] Automatic NCF assignment
- [ ] NCF expiration tracking
- [ ] DGII sync functionality
- [ ] NCF reports and compliance
- [ ] NCF type selection (B01, B02, B14, B15, B16)

**API Endpoints to Test:**
- `GET /api/ncf/monitor` - NCF monitoring
- `GET /api/ncf/alerts` - NCF alerts
- `POST /api/rnc/sync` - Sync with DGII
- `GET /api/settings/ncf` - NCF settings
- `PUT /api/settings/ncf` - Update NCF settings

### 8. Quotation System
**Test Cases:**
- [ ] Create quotation
- [ ] Edit quotation
- [ ] Convert quotation to sale
- [ ] Email quotation
- [ ] Quotation expiration
- [ ] Quotation printing

**API Endpoints to Test:**
- `POST /api/quotations` - Create quotation
- `GET /api/quotations/[id]` - Get quotation
- `POST /api/quotations/email` - Email quotation

### 9. Refund Processing
**Test Cases:**
- [ ] Process refund
- [ ] Refund with NCF (credit note)
- [ ] Partial refunds
- [ ] Refund approval workflow
- [ ] Refund reports

**API Endpoints to Test:**
- `POST /api/refunds` - Create refund
- [ ] Test refund workflow with different scenarios

### 10. Reporting System
**Test Cases:**
- [ ] Sales reports (daily, weekly, monthly)
- [ ] Inventory reports
- [ ] Customer reports
- [ ] NCF compliance reports
- [ ] DGII tax reports
- [ ] Export functionality (PDF, Excel)

**API Endpoints to Test:**
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports
- `GET /api/reports/customers` - Customer reports
- `GET /api/reports/dgii` - DGII reports

### 11. Email Integration
**Test Cases:**
- [ ] Email configuration
- [ ] Send receipt via email
- [ ] Send quotation via email
- [ ] Email templates
- [ ] SMTP connectivity
- [ ] Email delivery confirmation

**API Endpoints to Test:**
- `POST /api/email/test` - Test email configuration
- `GET /api/settings/email` - Email settings
- `PUT /api/settings/email` - Update email settings

### 12. Backup & Restore
**Test Cases:**
- [ ] Create database backup
- [ ] Download backup file
- [ ] Upload and restore backup
- [ ] Backup encryption
- [ ] Backup scheduling
- [ ] Backup verification

**API Endpoints to Test:**
- `POST /api/backup/create` - Create backup
- `GET /api/backup/list` - List backups
- `GET /api/backup/[id]/download` - Download backup
- `POST /api/backup/upload` - Upload backup
- `GET /api/restore/list` - List restore points
- `POST /api/restore/create` - Create restore

## Security Testing

### Authentication & Authorization
- [ ] SQL injection prevention
- [ ] XSS (Cross-Site Scripting) protection
- [ ] CSRF protection
- [ ] Session hijacking prevention
- [ ] Password strength requirements
- [ ] Rate limiting on login attempts
- [ ] Role-based access control verification

### Data Protection
- [ ] Sensitive data encryption
- [ ] Secure password hashing (bcrypt)
- [ ] Database connection security
- [ ] API endpoint protection
- [ ] Input validation and sanitization

### Infrastructure Security
- [ ] HTTPS enforcement (production)
- [ ] Environment variable security
- [ ] Database file permissions
- [ ] Log file security
- [ ] Error message sanitization

## Performance Testing

### Load Testing
- [ ] Multiple concurrent users
- [ ] Database query performance
- [ ] API response times
- [ ] Large dataset handling
- [ ] Memory usage monitoring

### Scalability Testing
- [ ] Database growth handling
- [ ] File storage scalability
- [ ] Backup performance with large databases
- [ ] Report generation performance

## Error Handling & Edge Cases

### Database Errors
- [ ] Connection failures
- [ ] Query timeouts
- [ ] Constraint violations
- [ ] Transaction rollbacks

### Network Errors
- [ ] API timeout handling
- [ ] Email delivery failures
- [ ] External service dependencies (DGII sync)
- [ ] Network interruption recovery

### Business Logic Edge Cases
- [ ] Zero inventory sales
- [ ] Negative stock adjustments
- [ ] Expired NCF sequences
- [ ] Invalid customer data
- [ ] Payment processing failures

## User Interface Testing

### Cross-Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Responsive Design
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast compliance
- [ ] Focus indicators

## Print Functionality Testing

### Receipt Printing
- [ ] Thermal receipt format
- [ ] A4 invoice format
- [ ] Print preview functionality
- [ ] Print queue handling
- [ ] Multiple printer support

### Document Generation
- [ ] PDF generation quality
- [ ] Image embedding
- [ ] Font rendering
- [ ] Page layout accuracy

## Integration Testing

### External Services
- [ ] DGII RNC validation service
- [ ] Email SMTP configuration
- [ ] Database backup storage
- [ ] File upload/download

### Third-Party Libraries
- [ ] Prisma ORM functionality
- [ ] PDF generation libraries
- [ ] Email libraries
- [ ] Date/time handling

## Test Data Management

### Test Scenarios
1. **Happy Path Tests**: Standard business workflows
2. **Boundary Tests**: Edge cases and limits
3. **Error Tests**: Failure scenarios
4. **Integration Tests**: Cross-module functionality

### Test Data Setup
- Use the seed script for baseline data
- Create additional test scenarios
- Maintain data consistency across tests
- Document expected vs actual results

## Testing Tools & Commands

### Database Testing
```bash
# Check database integrity
sqlite3 dev.db "PRAGMA integrity_check;"

# View table structure
sqlite3 dev.db ".schema"

# Test data queries
sqlite3 dev.db "SELECT * FROM User;"
sqlite3 dev.db "SELECT * FROM Product;"
sqlite3 dev.db "SELECT * FROM NCFSequence;"
```

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test protected endpoints
curl -H "Cookie: [session-cookie]" \
  http://localhost:3000/api/dashboard/stats
```

### Performance Monitoring
```bash
# Monitor application performance
pm2 monit

# Check application logs
pm2 logs pos-dev

# Database performance
sqlite3 dev.db "EXPLAIN QUERY PLAN [query];"
```

## Bug Reporting

### Issue Categories
1. **Critical**: System down, data loss, security vulnerabilities
2. **High**: Major functionality broken, poor performance
3. **Medium**: Minor functionality issues, UI problems
4. **Low**: Cosmetic issues, enhancement requests

### Reporting Template
- **Issue Title**: Clear, descriptive title
- **Environment**: Browser, OS, Node.js version
- **Steps to Reproduce**: Detailed reproduction steps
- **Expected Result**: What should happen
- **Actual Result**: What actually happened
- **Screenshots**: Visual evidence if applicable
- **Console Logs**: Error messages and stack traces

## Test Completion Checklist

### Core Functionality
- [ ] All user roles tested
- [ ] All CRUD operations working
- [ ] All API endpoints responding
- [ ] Database operations functioning
- [ ] Authentication system secure

### Business Logic
- [ ] Sales processing complete
- [ ] Inventory tracking accurate
- [ ] NCF compliance working
- [ ] Tax calculations correct
- [ ] Reporting accurate

### Technical Quality
- [ ] No security vulnerabilities
- [ ] Performance meets requirements
- [ ] Error handling graceful
- [ ] UI/UX intuitive
- [ ] Documentation complete

## Next Steps
1. Execute all test cases systematically
2. Document any issues found
3. Fix identified bugs
4. Re-test fixed functionality
5. Performance tune if needed
6. Prepare for production deployment

---

**Note**: This testing documentation should be updated as new features are added or requirements change. Regular testing ensures system reliability and user satisfaction.