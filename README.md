# 🏪 POS System - Professional Point of Sale

> **A production-ready Point of Sale system for Dominican Republic businesses with full DGII compliance**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.19.6-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

## 🎯 What is this?

**For Business Owners & Novices:**
This is a complete Point of Sale (POS) system designed specifically for small businesses in the Dominican Republic. It handles sales, inventory, customer management, and generates legally compliant invoices automatically.

**For Developers & Experts:**
A modern, full-stack web application built with Next.js 15, TypeScript, and SQLite. Features enterprise-grade architecture with comprehensive testing, CI/CD, and monitoring capabilities.

## ⚠️ System Requirements

| Component   | Requirement                            | Notes                         |
| ----------- | -------------------------------------- | ----------------------------- |
| **OS**      | Linux (Ubuntu 20.04+ or Debian 11+)    | Production only               |
| **Node.js** | 20.19.6+                               | LTS recommended               |
| **Python**  | 3.8+                                   | For utility scripts           |
| **Memory**  | 2GB RAM minimum, 4GB recommended       |                               |
| **Storage** | 20GB minimum                           | For database and logs         |
| **Browser** | Modern browser with JavaScript enabled | Chrome, Firefox, Safari, Edge |

> **🚨 Critical**: This system runs exclusively on Linux servers. Use WSL2, VirtualBox, or native Linux for development.

## 📁 Project Structure

```
pos-system/
├── .github/
│   ├── ISSUE_TEMPLATE/     # GitHub issue templates
│   ├── PULL_REQUEST_TEMPLATE/ # PR templates
│   └── workflows/          # GitHub Actions CI/CD pipelines
├── .husky/                 # Git hooks (pre-commit)
├── app/                    # Next.js application pages and API routes
├── components/             # Reusable React components
├── config/                 # Configuration files (PM2, email, etc.)
├── database/               # Database schema and migrations (Prisma)
├── docs/                   # Documentation and guides
│   ├── api/               # API documentation
│   ├── adr/               # Architecture Decision Records
│   └── architecture/      # System architecture docs
├── lib/                    # Legacy utility functions
├── public/                 # Static assets (images, icons)
├── scripts/                # Deployment and maintenance scripts
├── src/                    # Modern source code organization
│   ├── constants/         # Application constants
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── validation/        # Input validation schemas
├── storage/                # Persistent data storage
├── tests/                  # Test suites (unit, integration)
├── types/                  # TypeScript type definitions
├── .dockerignore           # Docker ignore patterns
├── .editorconfig           # Code style configuration
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore patterns
├── .nvmrc                  # Node.js version specification
├── .prettierrc             # Code formatting configuration
├── CHANGELOG.md            # Version history
├── CODE_OF_CONDUCT.md      # Community code of conduct
├── CONTRIBUTING.md         # Contribution guidelines
├── Dockerfile              # Docker container configuration
├── docker-compose.yml      # Docker Compose setup
├── jest.config.js          # Jest testing configuration
├── LICENSE                 # MIT License
├── package.json            # Node.js dependencies and scripts
├── README.md               # This file
├── SECURITY.md             # Security policy
├── tsconfig.json           # TypeScript configuration
└── [other config files]
```

## 🛠️ Production vs Development Environments

This system is designed primarily for **production business use** with robust security and performance optimizations.

### Production Environment (Primary)

- **Purpose**: Live business operations with real data
- **Database**: `prod.db` (production database)
- **URLs**: `https://yourdomain.com` (HTTPS required)
- **Features**: Performance optimized, secure error handling, automated backups
- **Security**: Enterprise-grade authentication, SSL/TLS, firewall, fail2ban
- **Data**: Real business data with compliance features

### Development Environment (Secondary)

- **Purpose**: Local development, testing, and feature development
- **Database**: `dev.db` (local SQLite file)
- **URLs**: `http://localhost:3000`
- **Features**: Hot reload, detailed error messages, development tools
- **Security**: Basic authentication for local testing
- **Data**: Sample data included for testing

**⚠️ Critical**: Production configurations are secure and optimized. Development settings should never be used in production!

## 🚀 Production Deployment Guide

This guide focuses on **production deployment** for business use. For development testing, see the installation methods below.

### Quick Production Setup (Recommended)

```bash
# 1. Get the system
git clone https://github.com/gntech-dev/pos.git
cd pos

# 2. Configure for production
cp .env.example .env
nano .env  # Configure with your domain and secrets

# 3. Install dependencies
npm install --legacy-peer-deps

# 4. Setup production database
npm run db:migrate
npm run db:seed

# 5. Build for production
npm run build

# 6. Start production server
npm run start
```

### First Production Login

- **Username**: admin@example.com
- **Password**: admin123
- **Important**: Change password immediately and configure business settings

### Production Requirements

- **Domain name** with DNS configured
- **SSL certificate** (Let's Encrypt recommended)
- **Email SMTP** configuration for notifications
- **Server security** hardening
- **Backup strategy** implementation

### Updating Your Application

To get the latest features and bug fixes:

```bash
# Pull latest changes
git pull origin main

# Restart (if using Docker)
docker-compose restart

# Or restart PM2 (if using traditional deployment)
pm2 restart pos-system
```

> **Need Help?** Check the [Installation Guide](#-installation) below for detailed instructions.

## 🚀 Features

### 💰 **Core Business Features** (For Business Owners)

| Feature                    | Description                                 | Benefit                         |
| -------------------------- | ------------------------------------------- | ------------------------------- |
| **📊 Sales Management**    | Process sales with automatic NCF generation | DGII compliant invoices         |
| **📦 Inventory Control**   | Product management with barcode scanning    | Real-time stock tracking        |
| **👥 Customer Management** | RNC/Cédula validation and customer database | Build customer relationships    |
| **💳 Payment Processing**  | Multiple payment methods support            | Flexible payment options        |
| **🧾 Quotations**          | Create and manage price quotes              | Professional quote generation   |
| **🔄 Refunds**             | Process returns with credit notes           | Handle customer returns         |
| **📈 Reporting**           | Sales, inventory, and tax reports           | Business insights and analytics |
| **🖨️ Receipt Printing**    | ESC/POS thermal printer support             | Professional receipts           |
| **📧 Email Invoices**      | Send professional PDF invoices              | Digital invoice delivery        |

### 🔒 **Security & Compliance** (For Business Owners & IT Managers)

| Feature                          | Description                                               | Compliance                 |
| -------------------------------- | --------------------------------------------------------- | -------------------------- |
| **🔐 Two-Factor Authentication** | Optional TOTP-based 2FA with backup codes                 | Enhanced security          |
| **📋 Audit Logging**             | Complete audit trail of all system actions                | Regulatory compliance      |
| **🔐 Data Encryption**           | AES-256-GCM encryption for sensitive data                 | Data protection            |
| **🚦 Rate Limiting**             | Advanced rate limiting with suspicious activity detection | Abuse prevention           |
| **📜 DGII Compliance**           | NCF, RNC validation, tax reports                          | Dominican Republic tax law |

### 🛠️ **Technical Features** (For Developers & IT Staff)

| Feature                      | Description                                         | Technical Benefit                |
| ---------------------------- | --------------------------------------------------- | -------------------------------- |
| **🏗️ Modern Architecture**   | Service-oriented architecture with clean separation | Maintainable codebase            |
| **✅ TypeScript**            | Full type safety throughout the application         | Reduced bugs, better IDE support |
| **🧪 Comprehensive Testing** | Unit and integration tests with CI/CD               | Quality assurance                |
| **🐳 Docker Support**        | Containerized deployment with Docker Compose        | Easy deployment and scaling      |
| **📊 Monitoring & Metrics**  | Health checks and business metrics APIs             | System observability             |
| **🔧 API-First Design**      | RESTful API with comprehensive documentation        | Integration capabilities         |
| **📱 Responsive Design**     | Works on desktop, tablet, and mobile                | Multi-device support             |

### 🚧 **Coming Soon**

- **📱 Mobile App** - Native iOS/Android apps
- **🌐 Offline Mode** - Works without internet connection
- **☁️ Cloud Backup** - Automatic cloud backups
- **🤖 AI Features** - Smart inventory predictions
- **🔗 Integrations** - Third-party service integrations

## 🏗️ Architecture & Code Quality

### **Modern Code Organization**

- **Service Layer**: Business logic separated into dedicated services (`src/services/`)
- **Validation Layer**: Input validation with Zod schemas (`src/validation/`)
- **Constants**: Centralized application constants (`src/constants/`)
- **Custom Hooks**: Reusable React hooks (`src/hooks/`)
- **Utilities**: Helper functions and formatters (`src/utils/`)

### **Quality Assurance**

- **Pre-commit Hooks**: Automated linting and testing before commits
- **Code Formatting**: Prettier configuration for consistent code style
- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code quality and style enforcement

### **Documentation**

- **API Documentation**: Comprehensive API reference (`docs/api/`)
- **Architecture Decisions**: ADRs for important technical decisions (`docs/adr/`)
- **Code of Conduct**: Community guidelines (`CODE_OF_CONDUCT.md`)
- **Security Policy**: Vulnerability reporting process (`SECURITY.md`)

### **CI/CD Pipeline**

- **Automated Testing**: Unit and integration tests on every push
- **Security Scanning**: Weekly security vulnerability checks
- **Code Coverage**: Test coverage reporting with Codecov
- **Multi-stage Builds**: Optimized Docker builds for production

### **Monitoring & Observability**

- **Health Checks**: `/api/health` endpoint for system monitoring
- **Metrics**: `/api/metrics` endpoint for business metrics
- **Audit Logging**: Complete audit trail of all system actions
- **Error Tracking**: Comprehensive error logging and reporting

## 📋 Prerequisites

- **Operating System**: Ubuntu 20.04+ or Debian 11+ (Linux only)
- **Node.js**: 20+ (v20.19.6+ recommended)
- **Package Manager**: npm or pnpm
- **Version Control**: Git
- **Server**: VPS/Dedicated server for production (2GB RAM minimum)

> **⚠️ Important**: This system requires Linux. For development, use Ubuntu natively, WSL2, or a Linux VM.

## 🛠️ Installation Methods

Choose the installation method that best fits your deployment needs:

### 🖥️ **Method 1: Production Server Deployment (Primary Method)**

Complete production deployment with security hardening, SSL, and monitoring. See the detailed "Production Server Deployment" section below.

### 🐳 **Method 2: Docker Deployment (Alternative Method)**

Docker provides a consistent environment for development and testing.

#### Quick Docker Setup (Development)

```bash
# 1. Clone the repository
git clone https://github.com/gntech-dev/pos.git
cd pos

# 2. Start with Docker Compose (development mode)
docker-compose up --build

# 3. Open http://localhost:3000 in your browser
```

**Note**: Docker is suitable for development. For production, use the server deployment method.

#### Docker Commands Reference

```bash
# Start in background (recommended for production)
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Rebuild after changes
docker-compose up --build --force-recreate
```

#### Docker Development Verification

```bash
# Check containers are running
docker-compose ps

# View application logs
docker-compose logs -f app

# Access container shell (for debugging)
docker-compose exec app bash

# Check database in container
docker-compose exec app sqlite3 /app/dev.db ".tables"
```

**Pros**: Easy setup, consistent environment, perfect for development and testing
**Cons**: Requires Docker installation, less flexible for advanced development workflows

### 💻 **Method 3: Development Local Setup (Secondary Method)**

For developers who want to modify the code or understand the internals. Not recommended for production use.

#### Prerequisites Check

```bash
# Check Node.js version (must be 20.19.6+)
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

#### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/gntech-dev/pos.git
cd pos

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy environment file
cp .env.example .env

# 4. Edit environment variables (IMPORTANT!)
nano .env  # or use your preferred editor
```

#### Environment Configuration

Edit `.env` file with your **development** settings:

```env
# Database - Local development database
DATABASE_URL="file:./dev.db"

# Authentication - Local URLs only
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-for-local-development-only"

# Environment - Development mode (hot reload, detailed errors)
NODE_ENV="development"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Email - Optional for development (can be left empty)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_FROM=""
```

**Development vs Production Differences:**

- **Database**: `dev.db` for development, `prod.db` for production
- **URLs**: `localhost` for development, your domain for production
- **Secrets**: Use simple secrets for dev, generate secure ones for production
- **NODE_ENV**: `development` enables debugging, `production` optimizes performance
- **Email**: Optional in development, required for production notifications

#### Database Setup

```bash
# Create database and run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

#### Start Development Server

````bash
#### Start Development Server

```bash
# Start the application
npm run dev

# Application will be available at:
# http://localhost:3000
````

#### Verify Development Setup

```bash
# Check if application is running
curl http://localhost:3000

# Check database was created
ls -la dev.db

# Verify database tables
sqlite3 dev.db ".tables"

# Test login API
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### Development Troubleshooting

**❌ "npm install" fails**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**❌ "Database connection failed"**

```bash
# Check if database file exists
ls -la dev.db

# Reset database
npm run db:migrate
npm run db:seed
```

**❌ "Port 3000 already in use"**

```bash
# Kill process using port 3000
sudo lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

**❌ "Module not found" errors**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Clear Next.js cache
rm -rf .next
```

### 🖥️ **Method 3: Production Server Deployment (Primary Method)**

For production deployment on a Linux server.

#### Server Requirements

- Ubuntu 20.04+ or Debian 11+
- 2GB RAM minimum, 4GB recommended
- 20GB storage minimum
- Domain name (recommended) or static local IP

#### Production Deployment Steps

**Prerequisites Check:**

```bash
# Verify system requirements
lsb_release -a
free -h
df -h

# Check if required ports are available
sudo netstat -tlnp | grep -E ':(80|443|3000)'

# Verify internet connection
ping -c 3 google.com
```

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install curl (required for Node.js installation)
sudo apt install -y curl

# 3. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2
sudo npm install -g pm2

# 5. Clone and setup
git clone https://github.com/gntech-dev/pos.git
cd pos
npm ci --omit=dev

# 6. Configure environment and PM2
cp .env.example .env
cp config/ecosystem.config.example.js ecosystem.config.js
cp config/email-config.example.json email-config.json

# 7. Generate secure secrets
openssl rand -base64 32

# Copy the generated secret and edit configuration files
nano .env
nano ecosystem.config.js  # Optional: customize PM2 settings
nano email-config.json    # Configure your email settings
```

#### Environment Configuration

Edit `.env` with your **production** settings:

```env
# Database - Production database (separate from development)
DATABASE_URL="file:./prod.db"

# NextAuth Configuration - Use HTTPS domain in production
NEXTAUTH_URL="https://yourdomain.com"  # Replace with your actual domain
NEXTAUTH_SECRET="YOUR_GENERATED_SECRET_HERE"  # Use the openssl output above

# Application Settings - Production optimizations
NODE_ENV="production"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"  # Replace with your actual domain

# Email Configuration - Required for production notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-business@gmail.com"
SMTP_PASS="your-gmail-app-password"
EMAIL_FROM="noreply@yourdomain.com"
```

**Production vs Development Differences:**

- **Database**: `prod.db` (separate from dev.db to avoid conflicts)
- **URLs**: Use your actual domain with HTTPS
- **Secrets**: Generate secure random secrets (never reuse dev secrets)
- **NODE_ENV**: `production` for performance and security
- **Email**: Configure SMTP for business notifications and receipts
- **Security**: Use HTTPS, secure secrets, proper firewall configuration

```bash
# 8. Setup database
npm run db:migrate
npm run db:seed

# 9. Set proper permissions
chmod 664 prod.db
chown -R $USER:$USER .

# 10. Build application
npm run build

# 11. Start with PM2
pm2 start ecosystem.config.js --env production

# 12. Save PM2 configuration
pm2 save

# 13. Setup auto-start on boot
pm2 startup

# 14. Check status
pm2 status
pm2 logs pos-system --lines 20
```

#### Post-Installation Verification

```bash
# Test application health
curl http://localhost:3000/api/health

# Check PM2 status
pm2 monit
```

### 🌐 Nginx Reverse Proxy Setup (Production)

```bash
# Install Nginx
sudo apt install -y nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/pos-system
```

**Add this configuration:**

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 🔒 SSL Certificate Setup (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Test renewal
sudo certbot renew --dry-run
```

### 🛡️ Security Hardening

```bash
# Configure firewall
sudo apt install -y ufw
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Secure database file
chmod 600 prod.db

# Setup fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### 💾 Backup Configuration

```bash
# Create backup script
nano ~/backup.sh
```

**Add this content:**

```bash
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Stop application
pm2 stop pos-system

# Create backup
tar -czf "$BACKUP_DIR/pos-backup-$DATE.tar.gz" \
    -C /home/$USER/apps/pos-system \
    prod.db \
    .env \
    storage/ \
    --exclude=node_modules

# Start application
pm2 start pos-system

# Keep last 7 backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Make executable
chmod +x ~/backup.sh

# Test backup
~/backup.sh

# Setup cron for daily backups
crontab -e
# Add: 0 2 * * * /home/$USER/backup.sh
```

### 📊 Monitoring

```bash
# Check system resources
htop

# Monitor logs
pm2 logs pos-system --lines 50

# Check application status
pm2 monit

# Database integrity
sqlite3 prod.db "PRAGMA integrity_check;"
```

### 🌐 Domain Configuration (Optional)

If you have a domain name, configure DNS:

1. **Point domain to server IP** in your DNS settings
2. **Update nginx config** with your actual domain
3. **Update .env** with domain URLs

### 📧 Email Configuration (Optional)

Configure SMTP for notifications and receipts:

```bash
# Edit .env file
nano .env
```

Add email settings:

```env
# SMTP Configuration
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
```

### ⚡ Performance Optimization

```bash
# Enable nginx gzip compression
sudo nano /etc/nginx/nginx.conf
# Add: gzip on; gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Restart nginx
sudo systemctl restart nginx

# PM2 clustering (for high traffic)
pm2 start ecosystem.config.js -i max
```

### 🔧 **Troubleshooting Installation**

#### Common Issues

**❌ "npm install" fails**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**❌ "Database connection failed"**

```bash
# Check if database file exists
ls -la dev.db

# Reset database
npm run db:migrate
npm run db:seed
```

**❌ "Port 3000 already in use"**

```bash
# Kill process using port 3000
sudo lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

**❌ Docker issues**

```bash
# Check Docker status
docker --version
docker-compose --version

# Restart Docker service
sudo systemctl restart docker
```

#### Getting Help

- 📖 Check the [FAQ](./docs/FAQ.md)
- 🐛 [Report Issues](https://github.com/gntech-dev/pos/issues)
- 💬 [Discussions](https://github.com/gntech-dev/pos/discussions)

## 📖 Usage Guide (For Business Users)

### 🎯 **Getting Started After Installation**

Once your system is running, follow these steps to set up your business:

#### 1. **First Login**

- Open your browser to `http://localhost:3000` (or your server URL)
- Login with default credentials:
  - **Email**: admin@example.com
  - **Password**: admin123
- **⚠️ Important**: Change the password immediately!

#### 2. **Initial Business Setup**

Navigate to **Settings** and configure:

- **Company Information**: Name, address, phone, RNC
- **Tax Settings**: ITBIS rate, tax identification
- **Logo**: Upload your company logo
- **Printer Settings**: Configure receipt printer

#### 3. **Add Your First Products**

Go to **Inventory → Products** and add products:

- Product name and description
- Price and cost
- Stock quantity
- Barcode (optional)
- Category

#### 4. **Process Your First Sale**

1. Go to **POS** or **Sales**
2. Search and add products to cart
3. Enter customer information (optional)
4. Select payment method
5. Complete the sale
6. Print receipt or email invoice

### 💼 **Daily Operations**

#### **Morning Routine**

- Check inventory levels
- Review yesterday's sales report
- Update any price changes
- Verify system is running (check `/api/health`)

#### **During Business Hours**

- Process sales through POS interface
- Monitor inventory levels
- Handle customer inquiries
- Process refunds when needed

#### **End of Day**

- Generate daily sales report
- Backup data (if not automated)
- Close cash register
- Review audit logs

### 📊 **Key Features Guide**

#### **Sales Management**

- **Quick Sale**: Add items → Payment → Complete
- **Customer Tracking**: Link sales to customers for loyalty
- **NCF Generation**: Automatic DGII-compliant invoice numbers
- **Multiple Payments**: Cash, card, transfers in same transaction

#### **Inventory Control**

- **Stock Alerts**: Automatic notifications for low stock
- **Barcode Scanning**: Quick product lookup
- **Categories**: Organize products by type
- **Price Management**: Easy price updates

#### **Customer Management**

- **RNC Validation**: Automatic Dominican ID validation
- **Purchase History**: Track customer buying patterns
- **Contact Info**: Store phone, email, address
- **Loyalty Program**: Ready for customer rewards

#### **Reporting & Analytics**

- **Sales Reports**: Daily, weekly, monthly summaries
- **Tax Reports**: DGII-compliant tax filings
- **Inventory Reports**: Stock levels and movements
- **Customer Reports**: Top customers, sales by customer

### 🔧 **Advanced Features**

#### **User Management** (Admin Only)

- Create user accounts for staff
- Assign roles: Admin, Manager, Cashier
- Set permissions per user
- Monitor user activity

#### **Business Configuration**

- Customize invoice templates
- Set up email notifications
- Configure backup schedules
- Manage company branding

#### **Security Features**

- Two-factor authentication (recommended)
- Audit logging (all actions tracked)
- Automatic session timeouts
- Rate limiting protection

### 🚨 **Common Tasks & Solutions**

#### **Adding New Products**

1. Go to Inventory → Products → Add Product
2. Fill in: Name, Price, Stock, Category
3. Save and test with a sale

#### **Handling Refunds**

1. Find original sale in Sales → Search
2. Click "Refund" button
3. Select items to refund
4. Process refund payment
5. System generates credit note automatically

#### **Customer Registration**

1. During sale or in Customers section
2. Enter: Name, RNC/Cédula, Contact info
3. System validates RNC format
4. Link to sales for tracking

#### **End-of-Month Reporting**

1. Go to Reports → Tax Reports
2. Select date range
3. Generate DGII-compliant report
4. Export to PDF or Excel

### 📞 **Support & Resources**

#### **Built-in Help**

- **Keyboard Shortcuts**: Press `?` for shortcuts
- **Tooltips**: Hover over icons for explanations
- **Context Help**: Click help icons throughout the app

#### **Documentation**

- **[User Guide](./docs/USER_GUIDE.md)** - Complete user manual
- **[FAQ](./docs/FAQ.md)** - Common questions answered
- **[Video Tutorials](https://github.com/gntech-dev/pos/discussions/categories/tutorials)** - Step-by-step videos

#### **Getting Help**

- **In-App Support**: Use the help button in the app
- **Community Forum**: [GitHub Discussions](https://github.com/gntech-dev/pos/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/gntech-dev/pos/issues)
- **Email Support**: support@gntech-dev.com

## 🧪 Testing

### **For Business Users**

The system includes automated testing to ensure reliability. You don't need to run tests manually - they're executed automatically during development and deployment.

### **For Developers**

#### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run only unit tests
npm test -- tests/unit

# Run only integration tests
npm test -- tests/integration
```

#### Test Structure

```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # API and workflow integration tests
├── setup.ts        # Test environment configuration
└── example.test.ts # Sample test file
```

#### Writing Tests

```typescript
import { describe, it, expect } from '@jest/globals'

describe('Product Service', () => {
  it('should create a new product', async () => {
    const product = await ProductService.create({
      name: 'Test Product',
      price: 100,
    })

    expect(product.name).toBe('Test Product')
    expect(product.price).toBe(100)
  })
})
```

#### Test Coverage

- **Target**: 80%+ code coverage
- **Reports**: Generated automatically in CI/CD
- **View Coverage**: Open `coverage/lcov-report/index.html`

### **API Testing**

#### Using the API

The system provides RESTful APIs for integration:

```bash
# Health check
curl http://localhost:3000/api/health

# Get metrics
curl http://localhost:3000/api/metrics

# List products (requires auth)
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/products
```

#### API Documentation

- **[API Overview](./docs/api/overview.md)** - Complete API reference
- **Postman Collection**: Available in `docs/api/`
- **OpenAPI Spec**: Coming soon

## 🔌 API Integration (For Developers)

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

## 🔄 CI/CD

The project uses GitHub Actions for continuous integration and deployment.

### Workflows

- **CI Pipeline**: Runs on every push and pull request
  - Installs dependencies
  - Runs linter
  - Executes tests
  - Builds the application

### Branch Protection

- `main` branch is protected
- Requires passing CI checks for merges
- Requires code review for pull requests

## 🔌 API Integration (For Developers)

### **Authentication**

All API requests require JWT authentication:

```bash
# Login to get token
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Use token in requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/products
```

### **Core Endpoints**

#### Products API

```bash
# List products
GET /api/products

# Create product
POST /api/products
{
  "name": "New Product",
  "price": 29.99,
  "stock": 100
}

# Update product
PUT /api/products/{id}

# Delete product
DELETE /api/products/{id}
```

#### Sales API

```bash
# Create sale
POST /api/sales
{
  "items": [
    {"productId": "123", "quantity": 2, "price": 10.00}
  ],
  "paymentMethod": "CASH",
  "customerId": "456"
}

# List sales
GET /api/sales?date_from=2025-01-01&date_to=2025-01-31
```

#### Customers API

```bash
# List customers
GET /api/customers

# Create customer
POST /api/customers
{
  "name": "John Doe",
  "rnc": "123456789",
  "email": "john@example.com"
}
```

### **Webhooks** (Coming Soon)

Receive real-time notifications for:

- New sales
- Inventory alerts
- Customer registrations
- System events

### **SDKs & Libraries**

- **JavaScript SDK**: `npm install pos-system-sdk` (planned)
- **Python Client**: Coming soon
- **Postman Collection**: Available in repository

### **Rate Limits**

- **Authenticated requests**: 1000/hour per user
- **Unauthenticated requests**: 100/hour per IP
- **Health checks**: Unlimited

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

## 🚀 Production Deployment

### **Quick Deploy with Docker**

```bash
# On your production server
git clone https://github.com/gntech-dev/pos.git
cd pos

# Configure environment
cp .env.example .env
nano .env  # Set production values

# Deploy with Docker
docker-compose -f docker-compose.yml up -d --build

# Check if running
curl http://localhost:3000/api/health
```

### **Traditional Server Deployment**

#### 1. **Server Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. **Application Setup**

```bash
# Clone and setup
git clone https://github.com/gntech-dev/pos.git
cd pos
npm ci --omit=dev

# Configure environment
cp .env.example .env
nano .env  # Set production values

# Build application
npm run build
```

#### 3. **Database Setup**

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

#### 4. **Start with PM2**

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup

# Check status
pm2 status
pm2 logs pos-system
```

### **Updating from GitHub**

To update your production application with the latest changes from GitHub:

```bash
# Navigate to your application directory
cd /path/to/your/pos-system

# Stop the PM2 process
pm2 stop pos-system

# Pull latest changes from GitHub
git pull origin main

# Install any new dependencies (if package.json was updated)
npm ci --omit=dev

# Run database migrations (if schema changed)
npm run db:migrate

# Rebuild the application
npm run build

# Restart the application
pm2 restart pos-system

# Check that it's running
pm2 status
curl http://localhost:3000/api/health
```

> **⚠️ Important**: Always backup your database before updating, especially if migrations are involved.

### **Nginx Reverse Proxy** (Recommended)

```nginx
# /etc/nginx/sites-available/pos-system
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **SSL with Let's Encrypt**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is automatic
```

## 📊 Monitoring & Maintenance

### **Health Monitoring**

#### System Health

```bash
# Check application health
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-29T...",
  "version": "1.0.2",
  "uptime": 3600,
  "memory": {
    "used": 45,
    "total": 120,
    "external": 5
  },
  "database": "connected"
}
```

#### Business Metrics

```bash
# Get business metrics (requires auth)
curl -H "Authorization: Bearer <token>" \
     https://your-domain.com/api/metrics
```

### **Log Management**

#### PM2 Logs

```bash
# View application logs
pm2 logs pos-system

# View logs with follow
pm2 logs pos-system --lines 100 -f

# Clear logs
pm2 flush
```

#### System Logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u nginx -f
sudo journalctl -u pm2-root -f
```

### **Backup Strategy**

#### Automated Backups

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 dev.db ".backup 'backups/backup_$DATE.db'"

# Compress old backups
find backups/ -name "*.db" -mtime +30 -exec gzip {} \;
```

#### Manual Backup

```bash
# Stop application
pm2 stop pos-system

# Backup database
cp dev.db backups/manual_backup_$(date +%Y%m%d).db

# Backup uploads
tar -czf backups/uploads_$(date +%Y%m%d).tar.gz storage/uploads/

# Restart application
pm2 start pos-system
```

### **Performance Monitoring**

#### Key Metrics to Monitor

- **Response Time**: API endpoints should respond <500ms
- **Memory Usage**: Should not exceed 80% of available RAM
- **Database Connections**: Monitor SQLite lock contention
- **Error Rate**: Should be <1% of total requests

#### Performance Optimization

```bash
# Enable PM2 clustering (if needed)
pm2 start ecosystem.config.js -i max

# Monitor performance
pm2 monit

# Generate load test
npm install -g artillery
artillery quick --count 50 --num 10 http://localhost:3000/api/health
```

### **Security Hardening**

#### Server Security

```bash
# Update packages regularly
sudo apt update && sudo apt upgrade

# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Setup fail2ban
sudo apt install fail2ban
```

#### Application Security

- Keep dependencies updated: `npm audit fix`
- Rotate secrets regularly
- Monitor for suspicious activity
- Enable 2FA for admin accounts
- Regular security audits

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **Application Won't Start**

```bash
# Check Node.js version
node --version  # Should be 20.19.6+

# Check if port is in use
sudo lsof -i :3000

# Check environment variables
cat .env | grep -v PASSWORD  # Don't show passwords

# Check PM2 status
pm2 status
pm2 logs pos-system --lines 50
```

#### **Database Connection Failed**

```bash
# Check if database file exists
ls -la dev.db

# Check file permissions
ls -la dev.db

# Reset database
npm run db:migrate
npm run db:seed
```

#### **Slow Performance**

```bash
# Check memory usage
pm2 monit

# Check system resources
htop  # or top

# Restart application
pm2 restart pos-system

# Check database locks
sqlite3 dev.db "PRAGMA lock_status;"
```

#### **Login Issues**

- Check if user exists in database
- Verify password is correct
- Check if account is active
- Review authentication logs

#### **Email Not Sending**

```bash
# Test email configuration
npm run test:email  # If available

# Check SMTP settings in .env
# Verify email server connectivity
telnet smtp.gmail.com 587
```

### **Getting Professional Support**

#### **Community Support**

- 📖 [Documentation](./docs/)
- 💬 [GitHub Discussions](https://github.com/gntech-dev/pos/discussions)
- 🐛 [Issue Tracker](https://github.com/gntech-dev/pos/issues)

#### **Professional Services**

- **Setup & Installation**: Professional installation service
- **Custom Development**: Feature development and integrations
- **Training**: Staff training and user guides
- **Support Plans**: Priority support and maintenance

Contact: enterprise@gntech-dev.com

---

## 📋 Changelog

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
