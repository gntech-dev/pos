# Deployment Guide - POS System

This guide covers deploying the POS system to production environments.

## Prerequisites

### System Requirements
- Ubuntu 20.04+ or CentOS 7+
- Node.js 18+ (LTS recommended)
- 2GB RAM minimum, 4GB recommended
- 20GB storage minimum
- Domain name (optional but recommended)

### Network Requirements
- Port 80/443 for web access
- Port 3000 for application (internal)
- Database access (SQLite local or external)

## Production Deployment

### 1. Server Preparation

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Install PM2
```bash
sudo npm install -g pm2
```

#### Install Nginx
```bash
sudo apt install nginx -y
```

### 2. Application Setup

#### Clone Repository
```bash
cd /home/gntech
git clone <your-repo-url> pos-system
cd pos-system
```

#### Install Dependencies
```bash
npm install --legacy-peer-deps --production
```

#### Environment Configuration
```bash
cp .env.example .env
nano .env
```

**Production .env:**
```env
DATABASE_URL="file:./prod.db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secure-random-secret-here"
NODE_ENV="production"
```

#### Database Setup
```bash
# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

#### Build Application
```bash
npm run build
```

### 3. PM2 Configuration

#### Create Ecosystem File
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
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/gntech/pos-system/logs/err.log',
    out_file: '/home/gntech/pos-system/logs/out.log',
    log_file: '/home/gntech/pos-system/logs/combined.log',
    time: true
  }]
}
```

#### Create Logs Directory
```bash
mkdir -p logs
```

#### Start Application
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx Configuration

#### SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/pos-system
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

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Database Backup Setup

#### Create Backup Script
```bash
# /home/gntech/pos-system/backup.sh
#!/bin/bash

BACKUP_DIR="/home/gntech/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pos_backup_$DATE.db"

mkdir -p $BACKUP_DIR

# Stop application
pm2 stop pos-system

# Copy database
cp prod.db $BACKUP_FILE

# Start application
pm2 start pos-system

# Clean old backups (keep last 30)
find $BACKUP_DIR -name "pos_backup_*.db" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

#### Make Executable and Schedule
```bash
chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /home/gntech/pos-system/backup.sh
```

### 6. Monitoring Setup

#### PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### System Monitoring
```bash
# Install htop for monitoring
sudo apt install htop -y

# Check logs
pm2 logs pos-system
```

### 7. Security Hardening

#### Firewall Setup
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

#### Fail2Ban
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

#### User Permissions
```bash
sudo useradd -m -s /bin/bash posuser
sudo chown -R posuser:posuser /home/gntech/pos-system
```

## Cloud Deployment

### AWS EC2
1. Launch EC2 instance (t3.medium recommended)
2. Configure security groups (ports 22, 80, 443)
3. Follow server preparation steps
4. Use Elastic IP for static IP

### DigitalOcean Droplet
1. Create Ubuntu droplet (2GB RAM minimum)
2. Add SSH keys
3. Follow installation steps
4. Configure floating IP

### Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  pos-system:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./prod.db:/app/prod.db
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## Maintenance

### Updates
```bash
# Pull latest changes
git pull origin main

# Install updates
npm install --legacy-peer-deps

# Build and restart
npm run build
pm2 restart pos-system
```

### Database Maintenance
```bash
# Vacuum database
sqlite3 prod.db "VACUUM;"

# Check integrity
sqlite3 prod.db "PRAGMA integrity_check;"
```

### Log Rotation
```bash
# PM2 handles log rotation automatically
pm2 reloadLogs
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs pos-system

# Check database
ls -la prod.db
```

#### Nginx Errors
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

#### Database Locked
```bash
# Kill hanging processes
pkill -f sqlite

# Restart application
pm2 restart pos-system
```

#### SSL Certificate Issues
```bash
# Renew certificates
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

### Performance Tuning

#### PM2 Optimization
```bash
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

#### Nginx Optimization
```nginx
worker_processes auto;
worker_connections 1024;
```

#### Database Optimization
```sql
PRAGMA cache_size = 10000;
PRAGMA synchronous = NORMAL;
PRAGMA journal_mode = WAL;
```

## Backup and Recovery

### Automated Backups
- Daily database backups
- Weekly full system backups
- Offsite backup storage

### Recovery Procedure
1. Stop application
2. Restore database from backup
3. Verify data integrity
4. Restart application
5. Test functionality

## Support

For deployment issues:
- Check application logs
- Review server resources
- Contact system administrator
- Check GitHub issues