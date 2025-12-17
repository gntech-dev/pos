#!/bin/bash

# POS System Deployment Script
# This script automates the deployment process for the POS System

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/pos-system"
BACKUP_DIR="/opt/backups/pos-system"
LOG_FILE="/var/log/pos-system/deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    sudo mkdir -p /opt/pos-system
    sudo mkdir -p /opt/backups/pos-system
    sudo mkdir -p /var/log/pos-system
    sudo chown -R $USER:$USER /opt/pos-system
    sudo chown -R $USER:$USER /opt/backups/pos-system
    sudo chown -R $USER:$USER /var/log/pos-system
    success "Directories created successfully"
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+ first."
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ $NODE_VERSION -lt 18 ]; then
        error "Node.js version must be 18 or higher. Current version: $(node --version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        log "Installing git..."
        sudo apt update
        sudo apt install -y git
    fi
    
    success "System requirements check passed"
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    sudo apt update
    sudo apt install -y curl wget sqlite3
    success "System dependencies installed"
}

# Deploy application
deploy_application() {
    log "Starting deployment process..."
    
    # Create backup of existing installation
    if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
        log "Creating backup of existing installation..."
        BACKUP_NAME="pos-system-backup-$(date +%Y%m%d_%H%M%S)"
        sudo cp -r $APP_DIR ${BACKUP_DIR}/${BACKUP_NAME}
        success "Backup created: ${BACKUP_NAME}"
    fi
    
    # Stop existing application
    if pm2 list | grep -q pos-system; then
        log "Stopping existing application..."
        pm2 stop pos-system || true
        pm2 delete pos-system || true
    fi
    
    # Update application code (if using git)
    if [ -d ".git" ]; then
        log "Updating application code..."
        git pull origin main || warning "Could not update from git repository"
    fi
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --only=production
    
    # Build application
    log "Building application..."
    npm run build
    
    # Setup database
    log "Setting up database..."
    npx prisma generate
    npx prisma migrate deploy
    
    # Seed database if needed
    if [ "$SEED_DATABASE" = "true" ]; then
        log "Seeding database..."
        npm run db:seed
    fi
    
    success "Application deployed successfully"
}

# Start application with PM2
start_application() {
    log "Starting application with PM2..."
    
    # Create logs directory
    mkdir -p logs
    
    # Start application
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup | grep -v "sudo" | bash || warning "Could not setup PM2 startup"
    
    success "Application started successfully"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        sudo ufw allow 22/tcp    # SSH
        sudo ufw allow 80/tcp    # HTTP
        sudo ufw allow 443/tcp   # HTTPS
        sudo ufw allow 3000/tcp  # Application (if needed)
        echo "y" | sudo ufw enable
        success "Firewall configured"
    else
        warning "UFW not found. Please configure firewall manually."
    fi
}

# Setup SSL certificate (optional)
setup_ssl() {
    if [ "$SETUP_SSL" = "true" ] && [ -n "$DOMAIN" ]; then
        log "Setting up SSL certificate for domain: $DOMAIN"
        
        # Install certbot
        sudo apt install -y certbot python3-certbot-nginx
        
        # Get SSL certificate
        sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
        
        success "SSL certificate configured"
    else
        warning "SSL setup skipped. Set SETUP_SSL=true and DOMAIN=yourdomain.com to enable."
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is running
    if pm2 list | grep -q "pos-system.*online"; then
        success "Application is running"
        
        # Test HTTP endpoint
        if curl -f -s http://localhost:3000 > /dev/null; then
            success "HTTP endpoint is accessible"
        else
            warning "HTTP endpoint might not be ready yet"
        fi
    else
        error "Application failed to start"
    fi
}

# Display deployment summary
display_summary() {
    echo ""
    echo "============================================"
    echo -e "${GREEN}POS System Deployment Complete!${NC}"
    echo "============================================"
    echo ""
    echo "Application Status:"
    pm2 status
    echo ""
    echo "Application Logs:"
    echo "  pm2 logs pos-system"
    echo ""
    echo "Application Management:"
    echo "  pm2 restart pos-system   # Restart application"
    echo "  pm2 stop pos-system      # Stop application"
    echo "  pm2 monit                # Monitor application"
    echo ""
    echo "Useful URLs:"
    echo "  Local:  http://localhost:3000"
    echo "  Domain: http://$DOMAIN (if configured)"
    echo ""
    echo "Default Login:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Change the default password after first login!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Configure business settings"
    echo "2. Set up email configuration"
    echo "3. Configure NCF sequences"
    echo "4. Create additional users"
    echo "5. Import products and inventory"
    echo ""
    echo "Documentation:"
    echo "  Installation: INSTALLATION_GUIDE.md"
    echo "  Testing: TESTING_DOCUMENTATION.md"
    echo ""
}

# Main execution
main() {
    echo "============================================"
    echo "POS System Deployment Script"
    echo "============================================"
    echo ""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --seed-db)
                SEED_DATABASE="true"
                shift
                ;;
            --setup-ssl)
                SETUP_SSL="true"
                shift
                ;;
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --email)
                EMAIL="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --seed-db        Seed database with initial data"
                echo "  --setup-ssl      Setup SSL certificate"
                echo "  --domain DOMAIN  Domain for SSL certificate"
                echo "  --email EMAIL    Email for SSL certificate"
                echo "  --help          Show this help message"
                echo ""
                echo "Environment Variables:"
                echo "  SEED_DATABASE=true  Seed database"
                echo "  SETUP_SSL=true      Setup SSL"
                echo "  DOMAIN=your.com     Domain name"
                echo "  EMAIL=you@com       Email address"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Default values
    SEED_DATABASE="${SEED_DATABASE:-false}"
    SETUP_SSL="${SETUP_SSL:-false}"
    DOMAIN="${DOMAIN:-}"
    EMAIL="${EMAIL:-}"
    
    # Execute deployment steps
    check_root
    create_directories
    check_requirements
    install_dependencies
    deploy_application
    start_application
    configure_firewall
    
    if [ "$SETUP_SSL" = "true" ] && [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
        setup_ssl
    fi
    
    health_check
    display_summary
    
    success "Deployment completed successfully!"
}

# Run main function
main "$@"