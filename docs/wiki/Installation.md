# Installation Guide

This guide covers installing and setting up the POS System for development and basic production use.

**⚠️ System Requirements**: This system is designed exclusively for **Linux servers**. Not compatible with Windows Server.

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+ or Debian 11+
- **RAM**: 2GB
- **Storage**: 10GB free space
- **Network**: Internet connection for initial setup

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **CPU**: 2 cores

## Quick Development Installation

### Prerequisites

#### 1. Install Node.js 20+
```bash
# Add NodeSource repository for Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 2. Install Git
```bash
sudo apt install -y git
```

### Installation Steps

#### 1. Clone Repository
```bash
# Create a directory for your projects
mkdir -p ~/projects
cd ~/projects

# Clone the repository
git clone https://github.com/gntech-dev/pos.git pos-system
cd pos-system
```

#### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

#### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment file (optional for development)
nano .env
```

#### 4. Setup Database
```bash
# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

#### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

For production deployment with PM2, Nginx, SSL certificates, and automated backups, see the [[Deployment Guide|../DEPLOYMENT_GUIDE]].

## Post-Installation Setup

### 1. Create Admin User

After installation, create your first admin user:

1. Access the application at `http://localhost:3000`
2. Use the default login (if available)
3. Go to Settings > Users
4. Create admin user
5. Delete default accounts

### 2. Configure Business Settings

1. Go to Settings
2. Enter business information:
   - Business name
   - RNC number
   - Address
   - Phone
   - Email

### 3. NCF Configuration

1. Go to Settings > NCF
2. Configure NCF sequences
3. Set up sequence ranges
4. Enable expiration alerts

### 4. Email Configuration

1. Go to Settings > Email
2. Configure SMTP settings
3. Test email functionality

## Troubleshooting Installation

### Node.js Issues

**Error: Node.js version too old**
```bash
# Check version
node --version

# Update Node.js to version 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Database Issues

**Migration fails**
```bash
# Reset database
npm run db:migrate:reset

# Try again
npm run db:migrate
```

**Permission denied**
```bash
# Check file permissions
ls -la *.db

# Fix permissions
chmod 664 *.db
```

### Network Issues

**Port 3000 already in use**
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Build Issues

**Build fails**
```bash
# Clear cache
rm -rf .next node_modules/.cache

# Reinstall dependencies
npm install --legacy-peer-deps

# Try build again
npm run build
```

## Verification

After installation, verify everything works:

1. **Login**: Can log in with admin credentials
2. **Dashboard**: Loads correctly
3. **Products**: Can add/view products
4. **Sales**: Can process a test sale
5. **Reports**: Can generate reports
6. **Backup**: Can create backup

## Next Steps

- [[User Guide|../USER_GUIDE]] - Learn how to use the system
- [[Configuration|Settings]] - Advanced configuration
- [[Backup and Restore|Backup-Restore]] - Data protection
- [[Deployment Guide|../DEPLOYMENT_GUIDE]] - Production deployment