# Developer Guide - POS System

This guide provides information for developers working on the POS system.

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with custom credentials
- **State Management**: React Context
- **Styling**: Tailwind CSS
- **Deployment**: PM2, Nginx

### Project Structure
```
pos-system/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (pages)/           # Page components
│   └── globals.css        # Global styles
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
├── prisma/                # Database schema and migrations
├── types/                 # TypeScript definitions
├── middleware.ts          # Authentication middleware
└── docs/                  # Documentation
```

## Development Setup

### Prerequisites
- **Operating System**: Ubuntu 18.04+ or Debian 10+ (Linux only)
- **Node.js**: 18+ (v20.19.6 recommended)
- **Package Manager**: npm or pnpm
- **Version Control**: Git

> **⚠️ Important**: This system is designed exclusively for Linux. Development should be done on Linux natively, WSL2, or Linux VMs.

### Installation
```bash
git clone https://github.com/gntech-dev/pos.git
cd pos-system
npm install --legacy-peer-deps
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup
```bash
npm run db:migrate
npm run db:seed
```

### Development Server
```bash
npm run dev
```

## Database Schema

### Main Tables
- **User**: System users with roles
- **Customer**: Customer information
- **Product**: Inventory items
- **Sale**: Sales transactions
- **Payment**: Payment records
- **Quotation**: Price quotes
- **Refund**: Return transactions
- **NCFSequence**: NCF number management
- **AuditLog**: System activity logs
- **Setting**: Configuration settings

### Prisma Schema
Located in `prisma/schema.prisma`. Use Prisma Studio for visual database management:

```bash
npm run db:studio
```

## API Development

### Route Structure
API routes are located in `app/api/` and follow Next.js 13+ conventions.

Example route: `app/api/products/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Handle GET requests
}

export async function POST(req: NextRequest) {
  // Handle POST requests
}
```

### Authentication Middleware
Located in `middleware.ts`. Protects routes based on user roles.

### Rate Limiting
Implemented in `lib/rate-limit.ts` with different limiters for different endpoints.

## Component Development

### Component Structure
Components are located in `components/` directory.

Example component:
```typescript
'use client'

import { useState } from 'react'

interface ProductFormProps {
  onSubmit: (data: ProductData) => void
}

export default function ProductForm({ onSubmit }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductData>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### LogoSelector Component
The `LogoSelector` component provides a visual interface for selecting pre-generated logos or uploading custom logos.

**Location**: `components/LogoSelector.tsx`

**Props**:
```typescript
interface LogoSelectorProps {
  onLogoSelect: (logoPath: string) => void
  currentLogo?: string
}
```

**Features**:
- Grid display of 5 pre-generated SVG logos
- Custom logo upload functionality
- Visual preview of current logo
- Responsive design with Tailwind CSS

**Usage**:
```typescript
import LogoSelector from '../components/LogoSelector'

<LogoSelector
  onLogoSelect={(logoPath) => setBusinessData({ ...businessData, logo: logoPath })}
  currentLogo={businessData.logo}
/>
```

### Styling
Uses Tailwind CSS with custom design system.

## Authentication System

### User Roles
- **admin**: Full access
- **manager**: Sales, inventory, reports
- **cashier**: Basic sales operations

### Session Management
Uses custom session cookies with JWT-like functionality.

### Password Security
- bcrypt hashing
- Brute force protection
- Password strength requirements

## NCF Integration

### NCF Types
- B01: Crédito Fiscal (VAT invoices)
- B02: Consumo (Consumer invoices)
- B14: Regímenes Especiales
- B15: Gubernamental
- B16: Exportaciones

### Sequence Management
Automatic sequence tracking and expiration alerts.

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### API Tests
```bash
npm run test:api
```

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'pos-system',
    script: 'npm start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

### Nginx Configuration
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

## Code Quality

### Linting
```bash
npm run lint
```

### TypeScript
Strict TypeScript configuration in `tsconfig.json`.

### Code Formatting
Uses ESLint and Prettier for consistent code style.

## Security Considerations

### Input Validation
- Server-side validation on all API endpoints
- Sanitization of user inputs
- SQL injection prevention via Prisma

### Authentication Security
- Secure password hashing
- Session timeout
- CSRF protection
- Audit logging

### Data Protection
- Encryption of sensitive data
- Secure backup procedures
- GDPR compliance considerations

## Performance Optimization

### Database Optimization
- Indexed queries
- Connection pooling
- Query optimization

### Frontend Optimization
- Code splitting
- Image optimization
- Caching strategies

### Monitoring
- Error logging
- Performance monitoring
- Database query monitoring

## Contributing

### Git Workflow
1. Create feature branch
2. Make changes
3. Write tests
4. Submit pull request
5. Code review
6. Merge

### Code Standards
- Use TypeScript for all new code
- Follow React best practices
- Write comprehensive tests
- Document API changes
- Update documentation

## Troubleshooting

### Common Development Issues

#### Database Connection Issues
```bash
# Reset database
npm run db:migrate:reset

# Check database file
ls -la prisma/dev.db
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Authentication Issues
- Check middleware configuration
- Verify session cookie settings
- Check database user records

### Debug Mode
```bash
DEBUG=* npm run dev
```

## Support

For development questions:
- Check existing documentation
- Review GitHub issues
- Contact the development team