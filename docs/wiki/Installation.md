# Installation Guide

This guide covers installing and setting up the POS System.

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+, CentOS 7+, or Windows 10+
- **RAM**: 2GB
- **Storage**: 10GB free space
- **Network**: Internet connection for initial setup

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **CPU**: 2 cores

## Quick Installation

### Using the Installation Script

```bash
# Download the installation script
wget https://raw.githubusercontent.com/your-repo/pos-system/main/install.sh
chmod +x install.sh

# Run the installer
sudo ./install.sh
```

### Manual Installation

#### 1. Install Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

#### 2. Clone Repository

```bash
git clone https://github.com/your-username/pos-system.git
cd pos-system
```

#### 3. Install Dependencies

```bash
npm install --legacy-peer-deps
```

#### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

#### 5. Setup Database

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

#### 6. Start Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

For production deployment, see the [[Deployment Guide|Deployment]].

## Post-Installation Setup

### 1. Create Admin User

After installation, create your first admin user:

1. Access the application
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

# Update Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
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
ls -la dev.db

# Fix permissions
chmod 664 dev.db
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

# Reinstall
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

- [[User Guide|User-Guide]] - Learn how to use the system
- [[Configuration|Configuration]] - Advanced configuration
- [[Backup and Restore|Backup-Restore]] - Data protection