# POS System Copilot Instructions

## Project Overview

You are assisting in developing a production-ready Point of Sale (POS) system for small businesses in the Dominican Republic. The system must ensure 100% DGII compliance for tax invoicing, support offline-first deployment on local servers, and handle sales, inventory, customers, quotations, NCF generation, refunds, payments, and reporting.

**Key Goals**:

- User-friendly interface for tablets/desktops.
- Multi-user RBAC (Admin, Manager, Cashier, Accountant roles).
- Offline mode with internet only for DGII RNC sync and backups.
- Simple local deployment via installer script.
- Performance: <3s response times on entry-level hardware (Intel i3, 8GB RAM, 256GB SSD).

## Tech Stack

- **Frontend**: Next.js 14+ (React), Tailwind CSS, React Hook Form.
- **Backend**: Next.js API Routes, Node.js 18+.
- **Database**: SQLite with Prisma ORM.
- **Authentication & RBAC**: NextAuth.js + custom middleware.
- **Additional Libraries**: QuaggaJS (barcode), ESC/POS (printing), Nodemailer (email), Puppeteer (PDF), Service Workers (offline).
- **Tools**: VS Code, Git, Jest/Playwright (testing), PM2/Nginx (deployment).

## Development Phases (High-Level)

1. **Planning & Setup (2-3 weeks)**: Environment setup, basic auth/RBAC skeleton, database schema.
2. **Core Backend (4-6 weeks)**: APIs for all modules, DGII integration, NCF logic.
3. **Core Frontend (4-6 weeks)**: UI for sales, inventory, etc., offline sync.
4. **Testing & QA (3-4 weeks)**: Unit/E2E tests, performance, compliance.
5. **Deployment & Launch (2-3 weeks)**: Local server setup, backups, installer.
6. **Maintenance**: Updates, patches, monitoring.

## Key Modules & Features

- **Customers**: Profiles, RNC validation, history, email preferences.
- **Inventory**: Products, stock tracking, barcode scanning, batch/expiration.
- **Sales**: Cart, payments (multi-method), receipts, NCF generation.
- **Payments**: Cash/card/transfers, refunds, gateway integration.
- **Invoices/Receipts**: PDF/email options, DGII compliance.
- **Quotations**: Creation, expiration, conversion to sales.
- **Refunds**: Processing, inventory adjustment, credit notes.
- **Reporting**: Dashboards, custom reports, export (CSV/PDF).
- **RBAC**: Role-based permissions, audit logging.

## Starting the Project (Phase 1)

1. **Initialize Next.js Project**:
   - Run `npx create-next-app@latest pos-system --typescript --tailwind --eslint --app`.
   - Install dependencies: `npm install prisma @prisma/client next-auth react-hook-form quagga2 puppeteer nodemailer @types/...`.

2. **Set Up Prisma with SQLite**:
   - `npx prisma init --datasource-provider sqlite`.
   - Define schema in `prisma/schema.prisma` (see DEVELOPMENT_PLAN.md for tables).
   - Run `npx prisma migrate dev --name init`.

3. **Basic Auth & RBAC**:
   - Configure NextAuth.js for local credentials.
   - Create middleware for role checks.
   - Seed initial admin user.

4. **Project Structure**:
   - `app/`: Pages/routes.
   - `components/`: Reusable UI.
   - `lib/`: Utilities, DB client.
   - `prisma/`: Schema/migrations.
   - `public/`: Static assets.

## Guidelines for Copilot

- **Validation**: After changes, run tests/lints/builds. Use tools for errors.
- **Offline-First**: Prioritize local operations; sync only when online.
- **DGII Compliance**: Ensure NCF generation, RNC validation, fiscal records.
- **Performance**: Optimize for low hardware; cache queries.
- **Security**: Encrypt sensitive data; audit logs.
- **User Experience**: Touch-friendly UI for tablets; fast load times.
- **Modular Development**: Build one module at a time (e.g., start with auth, then customers).
- **Documentation**: Update DEVELOPMENT_PLAN.md and TECH_STACK.md as needed.
- **Testing**: Write unit tests for APIs; E2E for critical flows.
- **Deployment**: Prepare for PM2/Nginx; create installer script.

## Next Steps

- Confirm environment (Node.js installed).
- Begin with project initialization.
- Follow phases sequentially; iterate on feedback.

This file should be copied to the remote server for consistent development.
