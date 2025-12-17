# POS System - Server Installation Guide

## Overview
This guide provides step-by-step instructions for installing the POS System on a new server using PM2 for process management.

## System Requirements

### Hardware Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB minimum free space (for database and backups)
- **Network**: Stable internet connection for email and DGII sync

### Software Requirements
- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **PM2**: Process manager (installed globally)
- **Git**: For cloning repository
- **SQLite**: Database engine (usually pre-installed with Node.js)

### Optional Dependencies
- **Nginx**: Reverse proxy (recommended for production)
- **SSL Certificate**: For HTTPS (recommended for production)
- **Firewall**: UFW or similar for security

## Pre-Installation Setup

### 1. System Update
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip
```

### 2. Node.js Installation
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. PM2 Installation
```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided by PM2
```

### 4. Project Directory Setup
```bash
# Create application directory
sudo mkdir -p /opt/pos-system
sudo chown $USER:$USER /opt/pos-system
cd /opt/pos-system
```

## Installation Steps

### 1. Clone or Upload Application
```bash
# Option A: Clone from repository (if available)
git clone <repository-url> .

# Option B: Upload application files
# Upload all application files to /opt/pos-system/
```

### 2. Install Dependencies
```bash
# Navigate to project directory
cd /opt/pos-system

# Install Node.js dependencies
npm install

# Verify installation
npm list
```

### 3. Environment Configuration

#### Create Production Environment File
```bash
# Copy example environment file
cp .env .env.production

# Edit environment configuration
nano .env.production
```

#### Environment Variables Configuration
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

### 4. Database Setup

#### Generate Prisma Client
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data
npm run db:seed
```

#### Verify Database Setup
```bash
# Check database file
ls -la *.db

# Verify tables
sqlite3 production.db ".tables"

# Check initial data
sqlite3 production.db "SELECT username, role FROM User;"
```

### 5. Build Application
```bash
# Build the Next.js application
npm run build

# Verify build output
ls -la .next/
```

### 6. PM2 Configuration

#### Create PM2 Ecosystem File
```bash
# Create ecosystem file
nano ecosystem.config.js
```

#### Ecosystem Configuration
```javascript
module.exports = {
  apps: [
    {
      name: 'pos-system',
      script: 'npm',
      args: 'start',
      cwd: '/opt/pos-system',
      instances: 1, // Use 'max' for multiple instances
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
        HOST: '0.0.0.0',
      },
      error_file: '/var/log/pos-system/error.log',
      out_file: '/var/log/pos-system/out.log',
      log_file: '/var/log/pos-system/combined.log',
      time: true
    }
  ]
}
```

#### Setup Log Directory
```bash
# Create log directory
sudo mkdir -p /var/log/pos-system
sudo chown $USER:$USER /var/log/pos-system
```

### 7. Start Application with PM2
```bash
# Start application using ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check application status
pm2 status

# View application logs
pm2 logs pos-system
```

### 8. Application Verification

#### Check Application Health
```bash
# Check if application is running
curl -I http://localhost:3000

# Check PM2 status
pm2 status
pm2 monit

# Check logs for errors
pm2 logs pos-system --lines 50
```

#### Access Application
- **Local Access**: http://localhost:3000
- **Network Access**: http://your-server-ip:3000

#### Default Login Credentials
- **Username**: admin
- **Password**: admin123
- **Role**: Administrator

**⚠️ IMPORTANT**: Change the default password immediately after first login!

## Production Deployment

### 1. Nginx Reverse Proxy (Recommended)

#### Install Nginx
```bash
sudo apt install -y nginx
```

#### Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/pos-system
```

#### Nginx Configuration Content
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

#### Enable Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 2. SSL Certificate Setup (Let's Encrypt)

#### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### Setup Auto-renewal
```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Check cron job (should be auto-created)
sudo crontab -l
```

### 3. Firewall Configuration
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow specific application port (if not using Nginx)
sudo ufw allow 3000

# Check status
sudo ufw status
```

### 4. Systemd Service (Alternative to PM2)

#### Create Systemd Service
```bash
sudo nano /etc/systemd/system/pos-system.service
```

#### Service Configuration
```ini
[Unit]
Description=POS System
After=network.target

[Service]
Type=simple
User=posuser
WorkingDirectory=/opt/pos-system
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

#### Setup Service User
```bash
# Create service user
sudo useradd -r -s /bin/false posuser
sudo chown -R posuser:posuser /opt/pos-system

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable pos-system
sudo systemctl start pos-system
sudo systemctl status pos-system
```

## Backup Configuration

### 1. Automated Backup Script
```bash
# Create backup script
nano /opt/pos-system/backup.sh
```

#### Backup Script Content
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/backups/pos-system"
APP_DIR="/opt/pos-system"
DB_FILE="$APP_DIR/production.db"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
tar -czf "$BACKUP_DIR/pos-system-backup-$DATE.tar.gz" \
    -C $APP_DIR \
    production.db \
    .env.production \
    backups/ \
    cache/ \
    --exclude=node_modules \
    --exclude=.next

# Keep only last 30 backups
find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +30 -delete

echo "Backup completed: pos-system-backup-$DATE.tar.gz"
```

#### Make Script Executable
```bash
chmod +x /opt/pos-system/backup.sh
```

### 2. Schedule Backups
```bash
# Add to crontab (daily backup at 2 AM)
crontab -e

# Add this line:
0 2 * * * /opt/pos-system/backup.sh >> /var/log/pos-system-backup.log 2>&1
```

## Monitoring & Maintenance

### 1. Application Monitoring
```bash
# Monitor PM2 processes
pm2 monit

# View real-time logs
pm2 logs pos-system --follow

# Check application status
pm2 status
pm2 info pos-system

# Restart application
pm2 restart pos-system

# Reload application (zero downtime)
pm2 reload pos-system
```

### 2. Log Management
```bash
# Rotate logs
sudo logrotate -f /etc/logrotate.d/pos-system

# Check log sizes
du -sh /var/log/pos-system/*

# Clear old logs
find /var/log/pos-system/ -name "*.log" -mtime +30 -delete
```

### 3. Performance Monitoring
```bash
# Check system resources
htop
df -h
free -m

# Check database size
ls -lh *.db

# Monitor database performance
sqlite3 production.db "PRAGMA integrity_check;"
```

### 4. Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
npm audit
npm update

# Restart application after updates
pm2 restart pos-system
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check PM2 logs
pm2 logs pos-system --lines 50

# Check system logs
sudo journalctl -u pos-system -f

# Verify environment variables
cat .env.production

# Check port availability
netstat -tlnp | grep 3000
```

#### 2. Database Connection Issues
```bash
# Check database file permissions
ls -la *.db

# Verify database integrity
sqlite3 production.db "PRAGMA integrity_check;"

# Check database schema
sqlite3 production.db ".schema"
```

#### 3. Email Configuration Issues
```bash
# Test email configuration
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{}'

# Check SMTP settings
# Verify username/password
# Check firewall rules
```

#### 4. Performance Issues
```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart pos-system

# Check system resources
htop
df -h
```

#### 5. NCF/DGII Sync Issues
```bash
# Check RNC cache
ls -la cache/rnc/

# Test RNC sync manually
curl -X POST http://localhost:3000/api/rnc/sync

# Check sync status
curl http://localhost:3000/api/ncf/monitor
```

### Log Locations
- **Application Logs**: `/var/log/pos-system/`
- **PM2 Logs**: Use `pm2 logs`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`

### Useful Commands
```bash
# Application status
pm2 status

# View application info
pm2 info pos-system

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart pos-system

# Stop application
pm2 stop pos-system

# Delete application from PM2
pm2 delete pos-system

# Check disk usage
du -sh /opt/pos-system/

# Check running processes
ps aux | grep node
```

## Security Checklist

### ✅ Security Configuration
- [ ] Change default admin password
- [ ] Configure strong NEXTAUTH_SECRET
- [ ] Enable HTTPS with SSL certificate
- [ ] Configure firewall rules
- [ ] Set up regular security updates
- [ ] Configure proper file permissions
- [ ] Enable log monitoring
- [ ] Set up automated backups
- [ ] Configure rate limiting
- [ ] Review and update environment variables

### File Permissions
```bash
# Set proper permissions
chmod 600 .env.production
chmod 644 *.db
chmod 755 *.sh
chown -R posuser:posuser /opt/pos-system
```

## Post-Installation Steps

### 1. Initial Configuration
1. **Access the application**: http://your-domain.com
2. **Login with default credentials**
3. **Change admin password**
4. **Configure business settings**
5. **Set up email configuration**
6. **Configure NCF sequences**
7. **Import initial products/inventory**

### 2. User Management
1. **Create additional users**
2. **Assign appropriate roles**
3. **Configure permissions**
4. **Test user access**

### 3. Business Configuration
1. **Update business information**
2. **Configure tax rates**
3. **Set up NCF types**
4. **Configure email templates**
5. **Set up backup schedule**

### 4. Testing
1. **Test all core functionalities**
2. **Verify backup/restore process**
3. **Test email functionality**
4. **Verify NCF compliance**
5. **Performance testing**

## Maintenance Schedule

### Daily
- [ ] Check application status
- [ ] Review error logs
- [ ] Monitor disk space

### Weekly
- [ ] Update system packages
- [ ] Review backup files
- [ ] Check performance metrics

### Monthly
- [ ] Security updates
- [ ] Database optimization
- [ ] Review user access
- [ ] Test disaster recovery

### Quarterly
- [ ] SSL certificate renewal check
- [ ] Security audit
- [ ] Performance tuning
- [ ] Documentation updates

## Support & Resources

### Documentation
- **Testing Guide**: `TESTING_DOCUMENTATION.md`
- **Technical Specs**: `TECH_STACK.md`
- **API Documentation**: Available in `/app/api/` directories

### Emergency Contacts
- **System Administrator**: [Your contact information]
- **Development Team**: [Developer contact information]

### Version Information
- **Application Version**: Check `package.json`
- **Node.js Version**: `node --version`
- **PM2 Version**: `pm2 --version`
- **Installation Date**: [Record installation date]

---

## Quick Reference Commands

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
npm run db:seed                  # Reset database
npm run build                    # Rebuild application

# Troubleshooting
pm2 logs pos-system --lines 50   # View recent logs
sqlite3 production.db ".tables"  # Check database
curl -I http://localhost:3000    # Test connectivity
```

---

**Installation Complete!** 🎉

Your POS System is now installed and running. Follow the post-installation steps to configure your business settings and start using the system.