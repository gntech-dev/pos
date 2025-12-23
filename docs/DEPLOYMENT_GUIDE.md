# Deployment Guide - POS System

This guide provides comprehensive step-by-step instructions for deploying the POS system to production Linux environments.

**⚠️ System Requirements**: This system is designed exclusively for **Linux servers**. Not compatible with Windows Server.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ or Debian 11+ (recommended)
- **Node.js**: 18+ (LTS recommended)
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 20GB minimum
- **Domain**: Domain name (optional but recommended)

### Network Requirements
- Port 80/443 for web access
- Port 3000 for application (internal)
- Database access (SQLite local)

## Production Deployment

### Step 1: Server Preparation

#### 1.1 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.2 Install Node.js 18+
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 1.3 Install PM2 Process Manager
```bash
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version
```

#### 1.4 Install Nginx Web Server
```bash
sudo apt install nginx -y

# Verify Nginx installation
sudo systemctl status nginx
```

#### 1.5 Install Additional Tools
```bash
# Install build tools and utilities
sudo apt install -y build-essential curl wget git htop ufw fail2ban sqlite3

# Install Certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Application Setup

#### 2.1 Create Application Directory
```bash
# Create a directory for your applications (replace 'yourusername' with your actual username)
sudo mkdir -p /home/yourusername/apps
sudo chown -R $USER:$USER /home/yourusername/apps
cd /home/yourusername/apps
```

#### 2.2 Clone Repository
```bash
# Clone the POS system repository
git clone https://github.com/gntech-dev/pos.git pos-system
cd pos-system

# Verify the clone
ls -la
```

#### 2.3 Install Dependencies
```bash
# Install Node.js dependencies
npm install --legacy-peer-deps --production

# Verify installation
npm list --depth=0
```

#### 2.4 Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Production .env configuration:**
```env
# Database
DATABASE_URL="file:./prod.db"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secure-random-secret-here"

# Environment
NODE_ENV="production"

# Email Configuration (update with your SMTP settings)
EMAIL_FROM="noreply@your-domain.com"
EMAIL_HOST="smtp.your-email-provider.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@your-domain.com"
EMAIL_PASS="your-email-password"

# Base URL for logo handling
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
```

**Important Notes:**
- Generate a secure random string for `NEXTAUTH_SECRET` (you can use `openssl rand -base64 32`)
- Update SMTP settings with your actual email provider credentials
- Replace `your-domain.com` with your actual domain name

#### 2.5 Database Setup
```bash
# Run database migrations
npm run db:migrate

# Optional: Seed initial data
npm run db:seed

# Verify database creation
ls -la *.db
```

#### 2.6 Build Application
```bash
# Build the Next.js application
npm run build

# Verify build success
ls -la .next/
```

### Step 3: PM2 Configuration

#### 3.1 Create Ecosystem Configuration
```bash
# Copy the example ecosystem config
cp config/ecosystem.config.js ecosystem.config.js

# Edit the configuration
nano ecosystem.config.js
```

**ecosystem.config.js content:**
```javascript
module.exports = {
  apps: [{
    name: 'pos-system',
    script: 'npm start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

#### 3.2 Create Logs Directory
```bash
# Create logs directory
mkdir -p logs

# Set proper permissions
chmod 755 logs
```

#### 3.3 Start Application with PM2
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

# Verify PM2 status
pm2 status
pm2 logs pos-system --lines 20
```

### Step 4: Nginx Configuration

#### 4.1 SSL Certificate Setup (Let's Encrypt)
```bash
# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Test certificate renewal
sudo certbot renew --dry-run
```

#### 4.2 Create Nginx Configuration
```bash
# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/pos-system
```

**Nginx configuration content:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Proxy to application
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

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4.3 Enable Nginx Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Verify site is working
curl -I https://your-domain.com
```

### Step 5: Database Backup Setup

#### 5.1 Create Backup Directory
```bash
# Create backups directory
mkdir -p ~/backups

# Set proper permissions
chmod 755 ~/backups
```

#### 5.2 Create Backup Script
```bash
# Create backup script
nano ~/apps/pos-system/backup.sh
```

**backup.sh content:**
```bash
#!/bin/bash

# POS System Database Backup Script
# This script creates automated backups of the SQLite database

BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pos_backup_$DATE.db"
APP_DIR="$HOME/apps/pos-system"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Change to application directory
cd $APP_DIR

# Stop application to ensure database consistency
pm2 stop pos-system

# Wait for processes to stop
sleep 5

# Copy database file
cp prod.db $BACKUP_FILE

# Start application again
pm2 start pos-system

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "pos_backup_*.db" -mtime +30 -delete

# Log backup completion
echo "$(date): Backup completed: $BACKUP_FILE" >> $BACKUP_DIR/backup.log

# Optional: Send email notification (uncomment and configure)
# mail -s "POS System Backup Completed" admin@your-domain.com < $BACKUP_DIR/backup.log
```

#### 5.3 Make Backup Script Executable
```bash
# Make script executable
chmod +x ~/apps/pos-system/backup.sh

# Test backup script
~/apps/pos-system/backup.sh
```

#### 5.4 Schedule Automated Backups
```bash
# Edit crontab
crontab -e

# Add the following line for daily backups at 2 AM
# 0 2 * * * /home/yourusername/apps/pos-system/backup.sh

# Verify crontab
crontab -l
```

### Step 6: Monitoring and Security Setup

#### 6.1 PM2 Monitoring Configuration
```bash
# Install PM2 log rotation
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Restart PM2 to apply changes
pm2 restart all
```

#### 6.2 Firewall Configuration
```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow Nginx (HTTP and HTTPS)
sudo ufw allow 'Nginx Full'

# Check firewall status
sudo ufw status
```

#### 6.3 Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Enable and start Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Verify Fail2Ban status
sudo systemctl status fail2ban
```

#### 6.4 User Permissions Setup
```bash
# Create dedicated user for the application (optional but recommended)
sudo useradd -m -s /bin/bash posuser

# Set proper ownership
sudo chown -R $USER:$USER ~/apps/pos-system

# Set proper permissions for sensitive files
chmod 600 .env
chmod 600 prod.db
```

### Step 7: Testing and Verification

#### 7.1 Test Application Access
```bash
# Test local access
curl http://localhost:3000

# Test through Nginx
curl -I https://your-domain.com
```

#### 7.2 Test PM2 Management
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs pos-system --lines 50

# Monitor resources
pm2 monit
```

#### 7.3 Test Database Operations
```bash
# Check database integrity
sqlite3 prod.db "PRAGMA integrity_check;"

# Check database size
ls -lh prod.db
```

#### 7.4 Test Email Functionality (if configured)
```bash
# Test email sending from application
# Access the application and try sending a test email
```

## Cloud Deployment Options

### AWS EC2 Deployment
1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Instance type: t3.medium (2 vCPU, 4GB RAM recommended)
   - Configure security groups: SSH (22), HTTP (80), HTTPS (443)

2. **Configure Elastic IP**
   - Allocate Elastic IP for static public IP
   - Associate with your EC2 instance

3. **Follow Server Preparation Steps**
   - Follow steps 1-7 above

4. **Domain Configuration**
   - Point your domain to the Elastic IP
   - Configure Route 53 for DNS

### DigitalOcean Droplet Deployment
1. **Create Droplet**
   - Choose Ubuntu 20.04 LTS
   - Plan: 2GB RAM minimum
   - Add SSH keys during creation

2. **Configure Floating IP**
   - Reserve floating IP
   - Assign to your droplet

3. **Follow Installation Steps**
   - Follow steps 1-7 above

4. **Domain Configuration**
   - Update DNS records to point to floating IP

### Docker Deployment (Alternative)

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### Docker Compose Configuration
```yaml
version: '3.8'
services:
  pos-system:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./prod.db:/app/prod.db
      - ./storage:/app/storage
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prod.db
    restart: unless-stopped
```

## Maintenance Procedures

### Application Updates
```bash
# Navigate to application directory
cd ~/apps/pos-system

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --legacy-peer-deps

# Build updated application
npm run build

# Restart application
pm2 restart pos-system

# Check logs for any errors
pm2 logs pos-system --lines 20
```

### Database Maintenance
```bash
# Navigate to application directory
cd ~/apps/pos-system

# Vacuum database to optimize size
sqlite3 prod.db "VACUUM;"

# Check database integrity
sqlite3 prod.db "PRAGMA integrity_check;"

# Backup before maintenance
cp prod.db prod.db.backup
```

### Log Management
```bash
# View current logs
pm2 logs pos-system

# Reload logs (rotation)
pm2 reloadLogs

# Clear old logs manually if needed
pm2 flush
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Application Won't Start
```bash
# Check PM2 status
pm2 status

# View detailed logs
pm2 logs pos-system --lines 100

# Check if port 3000 is available
netstat -tlnp | grep :3000

# Verify database file exists and is accessible
ls -la prod.db

# Check Node.js version
node --version
```

#### Nginx Configuration Errors
```bash
# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if site is enabled
ls -la /etc/nginx/sites-enabled/

# Reload Nginx after fixes
sudo systemctl reload nginx
```

#### Database Connection Issues
```bash
# Check database file permissions
ls -la prod.db

# Test database connection
sqlite3 prod.db "SELECT 1;"

# Check for database locks
lsof | grep prod.db

# Kill any hanging SQLite processes
pkill -f sqlite3
```

#### SSL Certificate Problems
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Reload Nginx after renewal
sudo systemctl reload nginx

# Check certificate validity
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null
```

#### Memory Issues
```bash
# Check system memory usage
free -h

# Check PM2 process memory
pm2 show pos-system

# Monitor system resources
htop

# Adjust PM2 memory limit if needed
pm2 restart ecosystem.config.js --max-memory-restart 2G
```

#### Email Delivery Issues
```bash
# Check email configuration in .env
cat .env | grep EMAIL

# Test SMTP connection manually
telnet smtp.your-email-provider.com 587

# Check application logs for email errors
pm2 logs pos-system | grep -i email
```

### Performance Optimization

#### PM2 Optimization
```bash
# Enable cluster mode for better performance (if server has multiple cores)
pm2 start ecosystem.config.js -i max

# Set log rotation schedule
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

#### Nginx Optimization
```nginx
# Add to /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;
use epoll;
multi_accept on;
```

#### Database Optimization
```sql
-- Run these commands on your database
PRAGMA cache_size = 10000;
PRAGMA synchronous = NORMAL;
PRAGMA journal_mode = WAL;
PRAGMA temp_store = MEMORY;
```

## Backup and Recovery

### Automated Backup Strategy
- **Daily Database Backups**: Full database backup every day at 2 AM
- **Weekly System Backups**: Complete application and configuration backup weekly
- **Offsite Storage**: Upload backups to cloud storage (AWS S3, Google Cloud, etc.)

### Manual Backup Procedure
```bash
# Stop application
pm2 stop pos-system

# Create backup directory with timestamp
BACKUP_DIR="~/backups/manual/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup database
cp prod.db $BACKUP_DIR/

# Backup configuration files
cp .env $BACKUP_DIR/
cp ecosystem.config.js $BACKUP_DIR/

# Backup uploaded files
cp -r storage/ $BACKUP_DIR/

# Start application
pm2 start pos-system

# Compress backup
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR

echo "Manual backup completed: $BACKUP_DIR.tar.gz"
```

### Recovery Procedure
1. **Stop Application**
   ```bash
   pm2 stop pos-system
   ```

2. **Restore Database**
   ```bash
   cp ~/backups/pos_backup_20231201_020000.db prod.db
   ```

3. **Restore Configuration (if needed)**
   ```bash
   cp ~/backups/manual/config_backup/.env .env
   ```

4. **Verify Data Integrity**
   ```bash
   sqlite3 prod.db "PRAGMA integrity_check;"
   ```

5. **Restart Application**
   ```bash
   pm2 start pos-system
   ```

6. **Test Functionality**
   - Access the application
   - Test key features
   - Check logs for errors

## Security Best Practices

### Server Security
- Keep system packages updated
- Use strong passwords and SSH keys
- Configure firewall properly
- Enable Fail2Ban for brute force protection
- Use SSL/TLS certificates
- Regular security audits

### Application Security
- Keep dependencies updated
- Use environment variables for secrets
- Implement proper authentication
- Regular code reviews
- Monitor for security vulnerabilities

### Data Security
- Encrypt sensitive data
- Regular backups
- Secure backup storage
- Access control and permissions
- Data retention policies

## Support and Resources

### Getting Help
1. **Check Application Logs**
   ```bash
   pm2 logs pos-system --lines 100
   ```

2. **Review System Resources**
   ```bash
   htop
   df -h
   free -h
   ```

3. **Check GitHub Issues**
   - Search existing issues
   - Create new issue with detailed information

4. **Community Support**
   - Check documentation
   - Contact system administrator

### Useful Commands Reference
```bash
# PM2 commands
pm2 status                    # Check process status
pm2 logs pos-system          # View application logs
pm2 restart pos-system       # Restart application
pm2 stop pos-system          # Stop application
pm2 delete pos-system        # Remove from PM2

# Nginx commands
sudo nginx -t               # Test configuration
sudo systemctl reload nginx # Reload configuration
sudo systemctl status nginx # Check status

# System monitoring
htop                        # System monitor
df -h                       # Disk usage
free -h                     # Memory usage
uptime                      # System uptime

# Database commands
sqlite3 prod.db "PRAGMA integrity_check;"  # Check integrity
sqlite3 prod.db "VACUUM;"                  # Optimize database
```

---

**Last Updated**: December 2024
**Version**: 1.0.2