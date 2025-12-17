# POS System - Manual Deployment Guide

## Overview
This guide provides step-by-step instructions for manually deploying the POS System on a server using PM2. Follow these instructions carefully to ensure a successful production deployment.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Node.js**: Version 18.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB minimum free space
- **Network**: Stable internet connection

### Software Dependencies
- Node.js 18+
- npm (comes with Node.js)
- PM2 (process manager)
- Git (for cloning repository)
- SQLite (usually included with Node.js)
- Nginx (recommended for production)
- SSL certificate (recommended for production)

## Step 1: System Preparation

### 1.1 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip
```

### 1.2 Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.3 Install PM2 Globally
```bash
sudo npm install -g pm2

# Verify installation
pm2 --version

# Setup PM2 startup
pm2 startup
# Follow the instructions provided by PM2
```

## Step 2: Application Setup

### 2.1 Create Application Directory
```bash
sudo mkdir -p /opt/pos-system
sudo chown $USER:$USER /opt/pos-system
cd /opt/pos-system
```

### 2.2 Clone or Upload Application
```bash
# Option A: Clone from repository
git clone <your-repository-url> .

# Option B: Upload application files manually
# Upload all application files to /opt/pos-system/
```

### 2.3 Install Dependencies
```bash
npm install
```

### 2.4 Environment Configuration
```bash
# Create production environment file
cp .env .env.production

# Edit environment variables
nano .env.production
```

#### Required Environment Variables
```bash
# Database Configuration
DATABASE_URL="file:./production.db"

# Application Settings
NODE_ENV="production"
NEXTAUTH_URL="https://your-domain.com"  # Use HTTPS in production
NEXTAUTH_SECRET="your-super-secret-production-key-change-this"

# SMTP Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_TLS="true"
SMTP_TIMEOUT="30000"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_SENDER_NAME="POS System - Your Business Name"

# Business Information (Update these)
BUSINESS_NAME="Your Business Name"
BUSINESS_RNC="your-business-rnc"
BUSINESS_ADDRESS="Your Business Address"
BUSINESS_PHONE="your-phone-number"
```

## Step 3: Database Setup

### 3.1 Generate Prisma Client
```bash
npx prisma generate
```

### 3.2 Run Database Migrations
```bash
npx prisma migrate deploy
```

### 3.3 Seed Initial Data (Optional)
```bash
npm run db:seed
```

### 3.4 Verify Database Setup
```bash
# Check database file
ls -la *.db

# Verify tables
sqlite3 production.db ".tables"

# Check initial data
sqlite3 production.db "SELECT username, role FROM User;"
```

## Step 4: Build Application

### 4.1 Build for Production
```bash
npm run build
```

### 4.2 Verify Build
```bash
ls -la .next/
```

## Step 5: PM2 Configuration

### 5.1 Create PM2 Configuration
```bash
# Create logs directory
mkdir -p logs

# Create ecosystem file
nano ecosystem.config.js
```

### 5.2 PM2 Configuration Content
```javascript
module.exports = {
  apps: [
    {
      name: 'pos-system',
      script: 'npm',
      args: 'start',
      cwd: '/opt/pos-system',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000
    }
  ]
}
```

### 5.3 Start Application with PM2
```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

### 5.4 Verify Application
```bash
# Check if application is running
pm2 list

# Check logs
pm2 logs pos-system

# Test HTTP endpoint
curl -I http://localhost:3000
```

## Step 6: Nginx Setup (Recommended)

### 6.1 Install Nginx
```bash
sudo apt install -y nginx
```

### 6.2 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/pos-system
```

### 6.3 Nginx Configuration Content
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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

### 6.4 Enable Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 7: SSL Certificate Setup (Recommended)

### 7.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --non-interactive --agree-tos --email your-email@example.com
```

### 7.3 Setup Auto-renewal
```bash
# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 8: Firewall Configuration

### 8.1 Configure UFW
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

## Step 9: Backup Configuration

### 9.1 Create Backup Directory
```bash
sudo mkdir -p /opt/backups/pos-system
sudo chown $USER:$USER /opt/backups/pos-system
```

### 9.2 Create Backup Script
```bash
nano /opt/pos-system/backup.sh
```

### 9.3 Backup Script Content
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/backups/pos-system"
APP_DIR="/opt/pos-system"
DB_FILE="$APP_DIR/production.db"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Stop application
pm2 stop pos-system

# Create backup
tar -czf "$BACKUP_DIR/pos-system-backup-$DATE.tar.gz" \
    -C $APP_DIR \
    production.db \
    .env.production \
    backups/ \
    cache/ \
    --exclude=node_modules \
    --exclude=.next

# Start application
pm2 start pos-system

# Keep only last 30 backups
find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +30 -delete

echo "Backup completed: pos-system-backup-$DATE.tar.gz"
```

### 9.4 Make Script Executable
```bash
chmod +x /opt/pos-system/backup.sh
```

### 9.5 Schedule Backups
```bash
# Add to crontab (daily backup at 2 AM)
crontab -e

# Add this line:
0 2 * * * /opt/pos-system/backup.sh >> /var/log/pos-system-backup.log 2>&1
```

## Step 10: Monitoring Setup

### 10.1 Application Monitoring
```bash
# Monitor PM2 processes
pm2 monit

# View logs in real-time
pm2 logs pos-system --follow

# Check application info
pm2 info pos-system
```

### 10.2 Log Management
```bash
# Rotate logs (create logrotate config)
sudo nano /etc/logrotate.d/pos-system
```

### 10.3 Logrotate Configuration
```
/opt/pos-system/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Step 11: Initial Configuration

### 11.1 Access Application
- **Local**: http://localhost:3000
- **Domain**: http://your-domain.com (after DNS setup)

### 11.2 Default Login
- **Username**: admin
- **Password**: admin123

⚠️ **IMPORTANT**: Change the default password immediately after first login!

### 11.3 Business Configuration
1. **Update Business Settings**:
   - Business name, RNC, address, phone
   - Email settings for receipts
   - Tax rates and NCF configurations

2. **User Management**:
   - Create additional users
   - Assign appropriate roles (Admin, Manager, Cashier)
   - Configure permissions

3. **Product Setup**:
   - Import initial products
   - Set up categories
   - Configure pricing

## Step 12: Verification

### 12.1 System Health Check
```bash
# Check application status
pm2 status

# Check system resources
htop
df -h
free -m

# Check logs for errors
pm2 logs pos-system --lines 50
```

### 12.2 Functionality Test
1. **Login Test**: Verify authentication works
2. **Dashboard Test**: Check statistics display
3. **Product Test**: Add/view products
4. **Sale Test**: Process a test sale
5. **Email Test**: Send test email
6. **Backup Test**: Create and verify backup

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs pos-system --lines 50

# Check environment variables
cat .env.production

# Verify port availability
netstat -tlnp | grep 3000
```

#### Database Issues
```bash
# Check database file permissions
ls -la *.db

# Verify database integrity
sqlite3 production.db "PRAGMA integrity_check;"

# Check database schema
sqlite3 production.db ".schema"
```

#### Email Configuration Issues
```bash
# Test email configuration
curl -X POST http://localhost:3000/api/email/test

# Check SMTP settings in .env.production
```

#### Performance Issues
```bash
# Monitor memory usage
pm2 monit

# Check system resources
htop
df -h

# Restart application
pm2 restart pos-system
```

## Maintenance

### Daily Tasks
- Check application status: `pm2 status`
- Review error logs: `pm2 logs pos-system --lines 50`
- Monitor disk space: `df -h`

### Weekly Tasks
- Update system packages: `sudo apt update && sudo apt upgrade`
- Check backup files: `ls -la /opt/backups/pos-system/`
- Review performance metrics

### Monthly Tasks
- Security updates: `sudo apt update && sudo apt upgrade`
- Database optimization: Consider VACUUM if using SQLite
- Review user access and permissions
- Test disaster recovery procedure

## Security Checklist

### ✅ Complete These Items
- [ ] Change default admin password
- [ ] Configure strong NEXTAUTH_SECRET
- [ ] Enable HTTPS with SSL certificate
- [ ] Configure firewall rules
- [ ] Set up regular security updates
- [ ] Configure proper file permissions
- [ ] Enable log monitoring
- [ ] Set up automated backups
- [ ] Review and update environment variables
- [ ] Configure rate limiting if needed

### File Permissions
```bash
# Set secure permissions
chmod 600 .env.production
chmod 644 *.db
chmod 755 *.sh
chown -R posuser:posuser /opt/pos-system  # If using dedicated user
```

## Emergency Procedures

### Application Recovery
```bash
# Restart application
pm2 restart pos-system

# Reload without downtime
pm2 reload pos-system

# Check application health
curl -I http://localhost:3000
```

### Database Recovery
```bash
# Restore from backup
tar -xzf /opt/backups/pos-system/pos-system-backup-YYYYMMDD_HHMMSS.tar.gz -C /tmp/
cp /tmp/production.db /opt/pos-system/
pm2 restart pos-system
```

### Complete System Recovery
1. Stop application: `pm2 stop pos-system`
2. Restore application files from backup
3. Restore database file
4. Restart application: `pm2 start pos-system`
5. Verify functionality

## Support Resources

### Documentation
- **Installation Guide**: This document
- **Testing Guide**: `TESTING_DOCUMENTATION.md`
- **Technical Specs**: `TECH_STACK.md`
- **API Documentation**: Available in `/app/api/` directories

### Useful Commands Reference
```bash
# Application Management
pm2 start ecosystem.config.js    # Start application
pm2 restart pos-system           # Restart application
pm2 stop pos-system              # Stop application
pm2 logs pos-system              # View logs
pm2 monit                        # Monitor application

# System Status
pm2 status                       # Check PM2 status
systemctl status nginx           # Check Nginx status
sudo ufw status                  # Check firewall status

# Backup & Maintenance
./backup.sh                      # Create backup
npm run db:seed                  # Reset database (development only)
npm run build                    # Rebuild application

# Troubleshooting
pm2 logs pos-system --lines 50   # View recent logs
sqlite3 production.db ".tables"  # Check database
curl -I http://localhost:3000    # Test connectivity
```

## Final Notes

### Success Indicators
- ✅ Application running: `pm2 status` shows "online"
- ✅ Web accessible: http://your-domain.com loads correctly
- ✅ Login works: Default credentials authenticate
- ✅ Database responsive: SQLite queries work
- ✅ Logs clean: No critical errors in `pm2 logs`
- ✅ Backups working: `/opt/backups/pos-system/` has recent files

### Post-Deployment Checklist
- [ ] Change default passwords
- [ ] Configure business settings
- [ ] Set up email integration
- [ ] Configure NCF sequences
- [ ] Create additional users
- [ ] Import products and inventory
- [ ] Test all core functionality
- [ ] Set up monitoring alerts
- [ ] Document any customizations
- [ ] Train users on the system

---

**Deployment Complete!** 🎉

Your POS System is now manually deployed and running. Follow the post-deployment checklist to complete the setup and start using the system.