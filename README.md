# POS System - README

A production-ready Point of Sale system for small businesses in the Dominican Republic with full DGII compliance.

**⚠️ System Requirements**: This system is designed exclusively for **Linux servers** (Ubuntu/Debian recommended). Not compatible with Windows or macOS for production deployment.

## 📁 Project Structure

```
pos-system/
├── app/                    # Next.js application pages and API routes
├── components/             # Reusable React components
├── config/                 # Configuration files (PM2, email, etc.)
├── database/               # Database schema and migrations (Prisma)
├── docs/                   # Documentation and guides
├── lib/                    # Utility functions and configurations
├── public/                 # Static assets (images, icons)
├── scripts/                # Deployment and maintenance scripts
├── storage/                # Persistent data storage
│   ├── backups/           # Database backup files
│   ├── cache/             # Temporary cache files
│   ├── restore/           # Restore operation files
│   ├── temp/              # Temporary files
│   └── uploads/           # User uploaded files
├── types/                  # TypeScript type definitions
└── [config files]         # Package.json, tsconfig.json, etc.
```

## 🚀 Features

- ✅ **User Management** - Admin, Manager, Cashier roles with granular permissions
- ✅ **Authentication** - Secure login with NextAuth.js
- ✅ **Database** - SQLite with Prisma ORM
- ✅ **Sales Management** - Process sales with NCF generation
- ✅ **Inventory Control** - Product management with barcode scanning
- ✅ **Customer Management** - RNC/Cédula validation
- ✅ **Business Configuration** - Persistent company settings
- ✅ **Logo Management** - Pre-generated logos and custom logo upload
- ✅ **Branding** - Professional appearance on invoices and receipts
- ✅ **Quotations** - Create and manage price quotes
- ✅ **Refunds** - Process returns with credit notes
- ✅ **Reporting** - Sales, inventory, and tax reports
- ✅ **Receipt Printing** - ESC/POS thermal printer support
- ✅ **Email Invoices** - Send professional PDF invoices via email
- ✅ **DGII Compliance** - NCF, RNC validation, tax reports
- 🚧 **Offline Mode** - Works without internet connection

## 📋 Prerequisites

- **Operating System**: Ubuntu 18.04+ or Debian 10+ (Linux only)
- **Node.js**: 18+ (v20.19.6 recommended)
- **Package Manager**: npm or pnpm
- **Version Control**: Git
- **Server**: VPS/Dedicated server for production (2GB RAM minimum)

> **⚠️ Important**: This system requires Linux. For development, use Ubuntu natively, WSL2, or a Linux VM.

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/gntech-dev/pos.git
cd pos
```

### 2. Install dependencies

```bash
cd pos-system
npm install --legacy-peer-deps
```

### 3. Set up environment variables

The `.env` file is already configured:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NODE_ENV="development"
```

**⚠️ Important**: Change `NEXTAUTH_SECRET` in production!

### 4. Initialize database

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
pos-system/
├── app/                   # Next.js pages & API routes
│   ├── api/              # Backend API
│   ├── dashboard/        # Dashboard page
│   └── login/            # Login page
├── lib/                   # Utilities & configurations
├── components/            # React components (to create)
├── prisma/                # Database schema & migrations
├── types/                 # TypeScript definitions
└── middleware.ts          # Auth middleware
```

## 🗄️ Database

The system uses SQLite for simplicity and offline-first capabilities.

### Database Commands

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Create a new migration
npm run db:migrate

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Seed data
npm run db:seed
```

## 🔐 Authentication

- Uses NextAuth.js with credentials provider
- JWT-based sessions
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Protected routes via middleware

## 🏗️ Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:seed    # Seed database
npm run db:migrate # Run migrations
npm run db:studio  # Open Prisma Studio
```

### Adding New Features

1. **API Routes**: Create in `app/api/`
2. **Pages**: Create in `app/`
3. **Components**: Create in `components/`
4. **Database Models**: Update `prisma/schema.prisma`

## 🧪 Testing (To Be Implemented)

```bash
npm run test        # Run unit tests
npm run test:e2e    # Run E2E tests
npm run test:api    # Run API tests
```

## 📦 Production Deployment

### Build

```bash
npm run build
npm run start
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "pos-system" -- start

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
```

### Using Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Configuration

### Business Settings

Configure company information through the web interface:
1. Go to **Settings** → **Business**
2. Fill in company details (name, RNC, address, phone, email)
3. Click **Save** - settings are automatically persisted

### DGII Settings

NCF sequences are configured through the web interface:
1. Go to **Settings** → **NCF**
2. Add your DGII-issued NCF ranges for each type:
   - B01: Crédito Fiscal (Invoices with tax credit)
   - B02: Consumo (Final consumer)
   - B14: Regímenes Especiales (Special regimes)
   - B15: Gubernamental (Government)

## 📊 Database Schema

### Main Tables

- **User** - System users with roles
- **Customer** - Customer database
- **Product** - Inventory items
- **Sale** - Sales transactions
- **Payment** - Payment records
- **Quotation** - Price quotes
- **Refund** - Return transactions
- **NCFSequence** - NCF number management
- **AuditLog** - System activity log
- **Setting** - Configuration

## 🛡️ Security

- Passwords hashed with bcrypt
- JWT sessions with secure cookies
- CSRF protection
- SQL injection prevention (Prisma)
- XSS protection (React)
- Role-based access control
- Audit logging

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## 📝 License

Proprietary - All rights reserved

## 👥 Support

For issues or questions, please contact the development team.

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Project setup
- [x] Database design
- [x] Authentication
- [x] RBAC
- [x] Business configuration persistence

### Phase 2: Core Features ✅
- [x] Sales module with NCF generation
- [x] Inventory management
- [x] Customer management with RNC validation
- [x] Quotations system
- [x] Refunds processing
- [x] Reporting dashboard
- [x] Receipt printing
- [x] DGII compliance features

### Phase 3: Advanced Features 🚧
- [ ] Email notifications system
- [ ] Advanced analytics
- [ ] Multi-location support
- [ ] API integrations

### Phase 4: Optimization 🔮
- [ ] Offline mode
- [ ] Performance tuning
- [ ] Mobile app
- [ ] Automated backups

## 🚨 Troubleshooting

### Database locked error

```bash
# Close all connections and restart
rm prisma/dev.db-journal
npm run dev
```

### Port 3000 already in use

```bash
# Use different port
PORT=3001 npm run dev
```

### Prisma Client errors

```bash
# Regenerate Prisma Client
npx prisma generate
```

## 📚 Documentation

### 🚀 Guías para Principiantes
- **[Guía Rápida de Producción](./docs/GUIA_RAPIDA_INICIO.md)** - Despliegue en servidor en 60 minutos (¡Comience aquí!)
- **[Preguntas Frecuentes (FAQ)](./docs/FAQ.md)** - Respuestas a dudas comunes
- **[Guía del Usuario](./docs/USER_GUIDE.md)** - Manual completo paso a paso

### 🛠️ Documentación Técnica
- **[Guía de Instalación en Servidor](./docs/deployment/INSTALLATION_GUIDE.md)** - Instalación detallada paso a paso
- **[API REST](./docs/API.md)** - Referencia completa de endpoints
- **[Guía del Desarrollador](./docs/DEVELOPER_GUIDE.md)** - Desarrollo y contribución
- **[Guía de Despliegue](./docs/DEPLOYMENT_GUIDE.md)** - Configuración de producción avanzada

### 📋 Documentos Adicionales
- **[Wiki](./docs/wiki/)** - Base de conocimientos y FAQ
- **[Documentación de Desarrollo](./docs/development/)** - Docs internos y planes

---

**¿Nuevo en producción?** Comience con la **[Guía Rápida de Producción](./docs/GUIA_RAPIDA_INICIO.md)** - despliegue completo en 60 minutos.

**¿Tiene dudas?** Consulte las **[Preguntas Frecuentes](./docs/FAQ.md)**.

---

## 📋 Changelog

### Version 1.2.0 (December 22, 2025)
- ✨ **Logo Management System**: Added pre-generated professional logos and custom logo upload functionality
- 🎨 **Branding Enhancement**: Logos now appear on invoices, receipts, and quotations
- 🔧 **LogoSelector Component**: New reusable component for logo selection
- 📁 **File Storage API**: Enhanced `/api/storage/uploads/[filename]` endpoint for serving uploaded files
- 📚 **Documentation Updates**: Updated user guide, developer guide, and API documentation

### Version 1.1.0 (December 18, 2025)
- Initial production release with full DGII compliance

---

**Version**: 1.2.0  
**Last Updated**: December 22, 2025  
**Status**: Production Ready ✅
