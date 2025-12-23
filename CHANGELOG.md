# Changelog

All notable changes to the POS System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-12-23

### Fixed
- **Logo Display Issues**: Fixed logo not showing in HTML emails, sales receipts, and invoices
  - HTML emails now embed logos as base64 data URLs for universal compatibility
  - Print pages now support both pre-made logos and uploaded custom logos
  - Enhanced logo conversion to handle PNG, JPG, GIF, WebP, and SVG formats
- **Email Default Type**: Changed default email document type from receipt to invoice
  - POS system now sends invoices by default instead of receipts
  - Updated success messages for consistency

### Changed
- **Email Logo Embedding**: Replaced absolute URLs with base64 data URLs in HTML emails
- **Print Logo Handling**: Extended logo support to include uploaded files in storage/uploads/
- **Default Document Type**: POS interface defaults to invoice selection

### Technical Improvements
- Enhanced `convertLogoToDataUrl` function across email APIs and print pages
- Removed unused `getAbsoluteLogoUrl` functions
- Improved MIME type detection for various image formats
- Cleaned up TypeScript warnings and unused variables

## [1.0.1] - 2025-12-XX

### Added
- Email invoice functionality with professional PDF generation
- HTML email templates with embedded PDF attachments
- Enhanced sales history management

### Fixed
- Spanish character encoding issues
- Email configuration persistence

## [1.0.0] - 2025-12-XX

### Added
- Initial release with full DGII compliance
- NCF management and automated sequence handling
- Multi-user role system (Admin, Manager, Cashier)
- Backup and restore functionality
- Complete POS operations with inventory control
- Customer management with RNC/Cédula validation
- Quotation system
- Reporting capabilities
- Thermal receipt printing support

### Features
- SQLite database with Prisma ORM
- Next.js 15 with TypeScript
- Tailwind CSS for styling
- Secure authentication with JWT
- PM2 process management
- Docker deployment support</content>
<parameter name="filePath">/home/gntech/PS/pos-system/CHANGELOG.md