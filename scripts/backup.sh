#!/bin/bash

# POS System Backup Script
# This script creates automated backups of the POS System

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
LOG_FILE="/var/log/pos-system/backup.log"
RETENTION_DAYS=30

# Database configuration
DB_FILE="$APP_DIR/production.db"
ENV_FILE="$APP_DIR/.env.production"

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

# Check if application is running
check_application_status() {
    log "Checking application status..."
    
    if pm2 list | grep -q "pos-system.*online"; then
        APP_RUNNING=true
        log "Application is currently running"
        
        # Stop application for consistent backup
        log "Stopping application for consistent backup..."
        pm2 stop pos-system
        sleep 5
    else
        APP_RUNNING=false
        log "Application is not running"
    fi
}

# Start application if it was running
start_application() {
    if [ "$APP_RUNNING" = true ]; then
        log "Starting application..."
        pm2 start pos-system
        success "Application restarted"
    fi
}

# Create backup directory
setup_backup_directory() {
    log "Setting up backup directory..."
    sudo mkdir -p $BACKUP_DIR
    sudo chown -R $USER:$USER $BACKUP_DIR
    success "Backup directory ready: $BACKUP_DIR"
}

# Create database backup
backup_database() {
    log "Creating database backup..."
    
    if [ ! -f "$DB_FILE" ]; then
        error "Database file not found: $DB_FILE"
    fi
    
    # Verify database integrity
    if ! sqlite3 "$DB_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
        error "Database integrity check failed"
    fi
    
    # Create database backup
    BACKUP_DB="$TEMP_DIR/database_$TIMESTAMP.db"
    cp "$DB_FILE" "$BACKUP_DB"
    
    # Compress database
    gzip "$BACKUP_DB"
    success "Database backup created"
}

# Create application backup
backup_application() {
    log "Creating application backup..."
    
    # List of files/directories to backup
    BACKUP_ITEMS=(
        "production.db"
        ".env.production"
        "backups/"
        "cache/"
        "logs/"
        "prisma/schema.prisma"
        "package.json"
        "package-lock.json"
        "ecosystem.config.js"
    )
    
    for item in "${BACKUP_ITEMS[@]}"; do
        if [ -e "$APP_DIR/$item" ]; then
            log "Backing up: $item"
            if [ -d "$APP_DIR/$item" ]; then
                cp -r "$APP_DIR/$item" "$TEMP_DIR/" 2>/dev/null || true
            else
                cp "$APP_DIR/$item" "$TEMP_DIR/" 2>/dev/null || true
            fi
        else
            log "Skipping (not found): $item"
        fi
    done
    
    # Exclude unnecessary files
    log "Excluding unnecessary files..."
    find "$TEMP_DIR" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$TEMP_DIR" -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$TEMP_DIR" -name "*.log" -type f -exec rm -f {} + 2>/dev/null || true
    
    success "Application files backup created"
}

# Create configuration backup
backup_configuration() {
    log "Creating configuration backup..."
    
    # System configuration
    {
        echo "=== PM2 Configuration ==="
        pm2 list
        echo ""
        echo "=== Environment Variables ==="
        env | grep -E "(NODE_ENV|DATABASE_URL|NEXTAUTH|SMTP)" || echo "No environment variables found"
        echo ""
        echo "=== System Information ==="
        echo "Date: $(date)"
        echo "Uptime: $(uptime)"
        echo "Disk Usage:"
        df -h
        echo ""
        echo "Memory Usage:"
        free -h
    } > "$TEMP_DIR/system_info.txt"
    
    success "Configuration backup created"
}

# Create final backup archive
create_backup_archive() {
    log "Creating final backup archive..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="pos-system-backup-$TIMESTAMP"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME.tar.gz"
    
    # Create tar archive
    tar -czf "$BACKUP_PATH" -C "$TEMP_DIR" .
    
    # Verify backup
    if [ -f "$BACKUP_PATH" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
        success "Backup created: $BACKUP_PATH (Size: $BACKUP_SIZE)"
        
        # Store backup metadata
        {
            echo "Backup Name: $BACKUP_NAME"
            echo "Created: $(date)"
            echo "Size: $BACKUP_SIZE"
            echo "Application Running: $APP_RUNNING"
            echo "Database File: $(basename $DB_FILE)"
            echo "Version: $(node --version 2>/dev/null || echo 'N/A')"
        } > "$BACKUP_DIR/${BACKUP_NAME}.metadata.txt"
    else
        error "Failed to create backup archive"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    COUNT_BEFORE=$(find $BACKUP_DIR -name "pos-system-backup-*.tar.gz" | wc -l)
    
    find $BACKUP_DIR -name "pos-system-backup-*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    find $BACKUP_DIR -name "pos-system-backup-*.metadata.txt" -type f -mtime +$RETENTION_DAYS -delete
    
    COUNT_AFTER=$(find $BACKUP_DIR -name "pos-system-backup-*.tar.gz" | wc -l)
    DELETED=$((COUNT_BEFORE - COUNT_AFTER))
    
    if [ $DELETED -gt 0 ]; then
        success "Deleted $DELETED old backup(s)"
    else
        log "No old backups to delete"
    fi
    
    # Show remaining backups
    log "Remaining backups:"
    find $BACKUP_DIR -name "pos-system-backup-*.tar.gz" -type f -printf "  %T+ %p\n" | sort | head -10
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    LATEST_BACKUP=$(find $BACKUP_DIR -name "pos-system-backup-*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -n "$LATEST_BACKUP" ]; then
        # Test archive extraction
        TEST_DIR="/tmp/backup_test_$$"
        mkdir -p "$TEST_DIR"
        
        if tar -tzf "$LATEST_BACKUP" >/dev/null 2>&1; then
            tar -xzf "$LATEST_BACKUP" -C "$TEST_DIR"
            
            # Check for essential files
            if [ -f "$TEST_DIR/database_$(basename $LATEST_BACKUP .tar.gz | cut -d'-' -f4-).db.gz" ] || \
               [ -f "$TEST_DIR/production.db" ]; then
                success "Backup integrity verified"
            else
                warning "Backup may be incomplete (database file missing)"
            fi
            
            # Cleanup test directory
            rm -rf "$TEST_DIR"
        else
            error "Backup archive is corrupted"
        fi
    else
        error "No backup found to verify"
    fi
}

# Send notification (if email is configured)
send_notification() {
    if command -v mail &> /dev/null && [ -f "$BACKUP_DIR/latest_backup.txt" ]; then
        LATEST_BACKUP=$(cat "$BACKUP_DIR/latest_backup.txt" 2>/dev/null || echo "Unknown")
        
        echo "POS System Backup Completed

Backup Details:
- Latest Backup: $LATEST_BACKUP
- Backup Directory: $BACKUP_DIR
- Retention Days: $RETENTION_DAYS
- Timestamp: $(date)

Please check the backup logs for more details.
" | mail -s "POS System Backup Completed" admin@localhost || true
    fi
}

# Display backup summary
display_summary() {
    echo ""
    echo "============================================"
    echo -e "${GREEN}POS System Backup Summary${NC}"
    echo "============================================"
    echo ""
    echo "Backup Details:"
    echo "  Directory: $BACKUP_DIR"
    echo "  Retention: $RETENTION_DAYS days"
    echo "  Latest Backup: $(find $BACKUP_DIR -name "pos-system-backup-*.tar.gz" -type f -printf '%T+ %p\n' | sort -n | tail -1 | cut -d' ' -f2- | xargs basename 2>/dev/null || echo 'None')"
    echo ""
    echo "Available Backups:"
    find $BACKUP_DIR -name "pos-system-backup-*.tar.gz" -type f -printf "  %T+ %s bytes %p\n" | sort -r | head -5
    echo ""
    echo "Total Backup Size:"
    du -sh $BACKUP_DIR
    echo ""
}

# Main execution
main() {
    echo "============================================"
    echo "POS System Backup Script"
    echo "============================================"
    echo ""
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    # Set up logging
    sudo mkdir -p /var/log/pos-system
    sudo chown -R $USER:$USER /var/log/pos-system
    
    log "Starting backup process..."
    log "Temporary directory: $TEMP_DIR"
    
    # Execute backup steps
    setup_backup_directory
    check_application_status
    
    # Create backups
    backup_database
    backup_application
    backup_configuration
    create_backup_archive
    
    # Cleanup and verification
    cleanup_old_backups
    verify_backup
    
    # Store latest backup info
    LATEST_BACKUP=$(find $BACKUP_DIR -name "pos-system-backup-*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    echo "$LATEST_BACKUP" > "$BACKUP_DIR/latest_backup.txt"
    
    # Start application if it was running
    start_application
    
    # Cleanup temporary directory
    rm -rf "$TEMP_DIR"
    
    display_summary
    send_notification
    
    success "Backup process completed successfully!"
}

# Handle interrupts
cleanup_on_exit() {
    log "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR" 2>/dev/null || true
    
    # Ensure application is started if it was running
    if [ "$APP_RUNNING" = true ]; then
        start_application
    fi
}

trap cleanup_on_exit EXIT INT TERM

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --retention DAYS    Set backup retention period (default: 30)"
            echo "  --verify-only       Only verify existing backups"
            echo "  --help             Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  RETENTION_DAYS=30   Backup retention period"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Main execution
if [ "$VERIFY_ONLY" = true ]; then
    setup_backup_directory
    verify_backup
else
    main "$@"
fi