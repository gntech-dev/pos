# Changelog

All notable changes to the POS System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-12-26

### Added
- **Advanced Security Features**: Comprehensive security implementation including:
  - Two-Factor Authentication (2FA) with TOTP and backup codes
  - Complete audit logging system with IP tracking and action categorization
  - AES-256-GCM encryption for sensitive data
  - Advanced rate limiting with suspicious activity detection
  - Security middleware with HTTP headers and attack prevention
  - QR code generation for 2FA setup

### Security
- **2FA Implementation**: Optional TOTP-based 2FA with Google Authenticator compatibility
- **Audit System**: Automatic logging of all critical actions with user tracking
- **Data Encryption**: AES-256-GCM encryption for sensitive configuration and data
- **Rate Limiting**: Intelligent rate limiting with brute force protection
- **Security Headers**: CSP, HSTS, XSS protection, and other security headers
- **Attack Detection**: SQL injection, XSS, and path traversal prevention

### Fixed
- **TypeScript Warnings**: Resolved all ESLint warnings and type errors
  - Replaced `any` types with proper TypeScript interfaces
  - Fixed unused variable warnings
  - Replaced `<img>` elements with Next.js `<Image>` components
- **Build Issues**: Fixed compilation errors and type mismatches
- **Code Quality**: Improved type safety across the entire codebase

### Changed
- **Authentication Flow**: Enhanced login process with optional 2FA verification
- **API Endpoints**: Added `/api/2fa/*` and `/api/audit` endpoints
- **Database Schema**: Extended User model with 2FA fields (twoFactorEnabled, twoFactorSecret, backupCodes)
- **Settings Page**: Added comprehensive security tab with 2FA management and audit logs

### Technical Improvements
- **Type Safety**: Complete TypeScript interface definitions for all data structures
- **Error Handling**: Improved error handling in security utilities
- **Code Organization**: Modular security utilities in dedicated library files
- **Performance**: Optimized build with zero warnings and clean compilation

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
- Docker deployment support