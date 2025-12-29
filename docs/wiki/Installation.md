# 🛠️ Installation Guide - Professional Setup

> **Complete installation and deployment guide for all environments**

## 📋 System Requirements

### Minimum Requirements

| Component            | Specification               | Notes                           |
| -------------------- | --------------------------- | ------------------------------- |
| **Operating System** | Ubuntu 20.04+ or Debian 11+ | Linux only - no Windows support |
| **Memory (RAM)**     | 2GB                         | 4GB recommended for production  |
| **Storage**          | 20GB SSD                    | For database, logs, and uploads |
| **CPU**              | 1 core                      | 2 cores recommended             |
| **Network**          | Stable internet             | Required for updates and email  |

### Recommended Production Setup

| Component   | Specification                           | Purpose                        |
| ----------- | --------------------------------------- | ------------------------------ |
| **Server**  | VPS/Dedicated (DigitalOcean, AWS, etc.) | 24/7 availability              |
| **OS**      | Ubuntu 22.04 LTS                        | Long-term support              |
| **Memory**  | 4GB RAM                                 | Handle concurrent users        |
| **Storage** | 50GB SSD                                | Growth capacity                |
| **CPU**     | 2+ cores                                | Performance for multiple users |
| **Domain**  | Custom domain                           | Professional branding          |

## 🚀 Installation Methods

### Method 1: Docker (Recommended for All Users)

Docker provides the easiest and most reliable installation experience.

#### Quick Docker Setup (5 Minutes)

```bash
# 1. Install Docker (if not installed)
# Visit: https://docs.docker.com/get-docker/

# 2. Clone the repository
git clone https://github.com/gntech-dev/pos.git
cd pos/pos-system

# 3. Start with Docker Compose
docker-compose up --build

# 4. Access the application
# Open: http://localhost:3000
```

#### Docker Production Deployment

```bash
# On your production server
git clone https://github.com/gntech-dev/pos.git
cd pos/pos-system

# Configure production environment
cp .env.example .env
nano .env  # Set production values

# Deploy in background
docker-compose -f docker-compose.yml up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

#### Docker Commands Reference

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f pos-system

# Restart services
docker-compose restart

# Update deployment
docker-compose pull && docker-compose up -d

# Stop and cleanup
docker-compose down -v  # Removes volumes too
```

### Method 2: Local Development (For Developers)

For developers who need to modify code or understand internals.

#### Prerequisites Check

```bash
# Required versions
node --version     # Should be 20.19.6+
npm --version      # Should be 10.0.0+
git --version      # Any recent version

# Install if missing
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

#### Development Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/gntech-dev/pos.git
cd pos/pos-system

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Environment setup
cp .env.example .env
# Edit .env with your settings

# 4. Database initialization
npm run db:migrate
npm run db:seed

# 5. Start development server
npm run dev

# 6. Access application
# Open: http://localhost:3000
```

#### Development Workflow

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build

# Start production build locally
npm start
```

### Method 3: Production Server Deployment

For deploying to a dedicated server or VPS.

#### Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget gnupg2 software-properties-common

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Verify installations
node --version && npm --version && pm2 --version
```

#### Application Deployment

```bash
# Create application directory
sudo mkdir -p /opt/pos-system
sudo chown $USER:$USER /opt/pos-system
cd /opt/pos-system

# Clone repository
git clone https://github.com/gntech-dev/pos.git .
cd pos-system

# Install dependencies
npm ci --only=production

# Setup environment
cp .env.example .env
nano .env  # Configure production settings

# Database setup
npm run db:migrate
npm run db:seed

# Build application
npm run build
```

#### Process Management with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Check status
pm2 status
pm2 logs pos-system --lines 50
```

#### Nginx Reverse Proxy Setup

```bash
# Install Nginx
sudo apt install -y nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/pos-system
```

Add this configuration:

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

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Test renewal
sudo certbot renew --dry-run

# Certificates auto-renew automatically
```

## ⚙️ First-Time Setup

After installation, complete these initial configuration steps:

### 1. Access the Application

- Open your browser to the application URL
- Default login: `admin@example.com` / `admin123`

### 2. Change Default Password

- Go to Settings → Profile
- Change password immediately
- Set up two-factor authentication

### 3. Configure Business Settings

Navigate to **Settings** and configure:

- **Company Information**: Name, address, RNC, phone
- **Tax Settings**: ITBIS rate, tax identification
- **Branding**: Logo, colors, invoice templates
- **Email Settings**: SMTP configuration

### 4. Add Initial Data

- **Products**: Add your inventory items
- **Users**: Create staff accounts
- **Customers**: Import or add customer database
- **Settings**: Configure payment methods, printers

### 5. Test Core Functions

- Process a test sale
- Print a receipt
- Send a test email
- Generate a report

## 🔧 Post-Installation Configuration

### Environment Variables

Critical production settings in `.env`:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Email Configuration
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_FROM="noreply@your-domain.com"

# Security
NODE_ENV="production"
```

### Backup Configuration

```bash
# Create backup script
sudo nano /opt/pos-system/backup.sh
```

Add backup script:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/pos-system/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
sqlite3 dev.db ".backup '$BACKUP_DIR/backup_$DATE.db'"

# Compress old backups
find $BACKUP_DIR -name "*.db" -mtime +30 -exec gzip {} \;

# Keep only last 30 days
find $BACKUP_DIR -name "*.db.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.db"
```

```bash
# Make executable and setup cron
sudo chmod +x /opt/pos-system/backup.sh
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/pos-system/backup.sh
```

### Monitoring Setup

```bash
# Health check endpoint
curl https://your-domain.com/api/health

# Setup log rotation
sudo nano /etc/logrotate.d/pos-system
```

Add logrotate config:

```
/opt/pos-system/.pm2/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
```

## 🐛 Troubleshooting Installation

### Docker Issues

```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Check disk space
df -h

# Clean up Docker
docker system prune -a
```

### Node.js Issues

```bash
# Check Node.js
node --version && npm --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Database Issues

```bash
# Check database file
ls -la dev.db

# Reset database
npm run db:migrate
npm run db:seed
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/pos-system

# Check file permissions
ls -la /opt/pos-system
```

### Network Issues

```bash
# Check firewall
sudo ufw status

# Allow necessary ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
```

## 📞 Support & Next Steps

### Verification Checklist

- [ ] Application accessible via browser
- [ ] Database connection working
- [ ] Email sending functional
- [ ] SSL certificate installed
- [ ] Backups configured
- [ ] Monitoring alerts set up

### Getting Help

- **Installation Issues**: Check [[Troubleshooting|Troubleshooting]]
- **Configuration Help**: See [[Deployment Guide|Deployment]]
- **Community Support**: [GitHub Discussions](https://github.com/gntech-dev/pos/discussions)
- **Professional Services**: enterprise@gntech-dev.com

### What's Next

1. [[Complete business setup|User-Guide#initial-setup]]
2. [[Add your products|User-Guide#inventory-management]]
3. [[Process your first sale|User-Guide#sales-processing]]
4. [[Set up users and permissions|User-Guide#user-management]]

---

**Installation completed successfully!** 🎉

_Last updated: December 29, 2025_

# Clone the repository

git clone https://github.com/gntech-dev/pos.git pos-system
cd pos-system

````

#### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
````

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
