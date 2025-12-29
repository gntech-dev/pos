# 🔧 Troubleshooting Guide - Professional Problem Solving

> **Comprehensive troubleshooting guide for common issues and advanced problem resolution**

## 🚨 Emergency Contacts

**Before troubleshooting:**

- 📞 **Emergency Support**: +1 (829) 123-4567 (24/7 for enterprise customers)
- 📧 **Technical Support**: support@gntech-dev.com
- 💬 **Community Help**: [GitHub Discussions](https://github.com/gntech-dev/pos/discussions)

## 🔍 Diagnostic Tools

### System Health Check

```bash
# Quick health check
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "version": "1.0.2",
  "uptime": 3600,
  "database": "connected"
}
```

### Log Analysis

```bash
# PM2 logs
pm2 logs pos-system --lines 100

# Application logs (if using Docker)
docker-compose logs -f

# System logs
sudo journalctl -u nginx -f
sudo journalctl -u pm2-root -f
```

### Performance Monitoring

```bash
# System resources
htop
df -h  # Disk usage
free -h  # Memory usage

# Application metrics
curl http://localhost:3000/api/metrics
```

## 🔐 Authentication & Login Issues

### ❌ "Invalid Credentials" Error

**Symptoms:**

- Login form shows "Invalid credentials"
- Password reset not working
- Account appears locked

**Diagnostic Steps:**

```bash
# Check user exists in database
sqlite3 dev.db "SELECT email, isActive FROM User WHERE email='user@example.com';"

# Check password hash
sqlite3 dev.db "SELECT password FROM User WHERE email='user@example.com';"

# Check failed login attempts
sqlite3 dev.db "SELECT * FROM Audit WHERE action='LOGIN_FAILED' ORDER BY createdAt DESC LIMIT 5;"
```

**Solutions:**

1. **Reset Password via Database**

   ```bash
   # Generate new password hash (replace 'newpassword' with actual password)
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword', 12).then(hash => console.log(hash));"

   # Update in database
   sqlite3 dev.db "UPDATE User SET password='NEW_HASH_HERE' WHERE email='user@example.com';"
   ```

2. **Unlock Account**

   ```bash
   # Reset failed attempts
   sqlite3 dev.db "UPDATE User SET failedAttempts=0, lockedUntil=NULL WHERE email='user@example.com';"
   ```

3. **Check Account Status**
   ```bash
   sqlite3 dev.db "UPDATE User SET isActive=1 WHERE email='user@example.com';"
   ```

### 🚪 Session Expired Issues

**Symptoms:**

- Random logouts
- "Session expired" messages
- Need to login frequently

**Causes & Solutions:**

1. **JWT Secret Mismatch**

   ```bash
   # Check .env file
   cat .env | grep NEXTAUTH_SECRET

   # Ensure it's consistent across deployments
   # Regenerate if compromised
   openssl rand -base64 32
   ```

2. **Browser Cookie Issues**
   - Clear browser cookies for the domain
   - Check browser settings for cookie blocking
   - Try incognito/private browsing mode

3. **Server Time Sync**

   ```bash
   # Check server time
   date

   # Sync with NTP
   sudo apt install ntp
   sudo systemctl enable ntp
   sudo systemctl start ntp
   ```

## 🗄️ Database Issues

### 🚫 "Database Locked" Error

**Symptoms:**

- `SQLITE_BUSY` errors
- Application becomes unresponsive
- Sales transactions fail

**Immediate Actions:**

```bash
# 1. Stop the application
pm2 stop pos-system

# 2. Check for hanging processes
ps aux | grep sqlite3
ps aux | grep node

# 3. Kill hanging processes (CAUTION!)
kill -9 <PID>

# 4. Check database integrity
sqlite3 dev.db "PRAGMA integrity_check;"

# 5. Restart application
pm2 start pos-system
```

**Preventive Measures:**

```bash
# Enable WAL mode for better concurrency
sqlite3 dev.db "PRAGMA journal_mode=WAL;"

# Increase timeout
sqlite3 dev.db "PRAGMA busy_timeout=30000;"

# Regular maintenance
sqlite3 dev.db "VACUUM;"
```

### 💥 Database Corruption

**Symptoms:**

- Random crashes
- Data inconsistency
- "Database disk image is malformed"

**Recovery Steps:**

```bash
# 1. Stop application
pm2 stop pos-system

# 2. Create backup of corrupted database
cp dev.db dev.db.corrupted

# 3. Attempt repair
sqlite3 dev.db ".recover" > recovered.sql
sqlite3 dev.db.repaired < recovered.sql

# 4. Verify integrity
sqlite3 dev.db.repaired "PRAGMA integrity_check;"

# 5. Replace if successful
mv dev.db.repaired dev.db

# 6. Restart application
pm2 start pos-system
```

**Prevention:**

- Regular backups (see [[Backup Strategy|Deployment#backup-strategy]])
- Monitor disk space: `df -h`
- Use SSD storage for better reliability

### 🐌 Slow Database Performance

**Symptoms:**

- Slow page loads
- Delayed search results
- Timeout errors

**Optimization Steps:**

```bash
# 1. Analyze query performance
sqlite3 dev.db "EXPLAIN QUERY PLAN SELECT * FROM Sale WHERE createdAt > '2025-01-01';"

# 2. Add indexes for common queries
sqlite3 dev.db "CREATE INDEX IF NOT EXISTS idx_sale_date ON Sale(createdAt);"
sqlite3 dev.db "CREATE INDEX IF NOT EXISTS idx_product_name ON Product(name);"

# 3. Optimize database
sqlite3 dev.db "VACUUM;"
sqlite3 dev.db "ANALYZE;"

# 4. Check memory usage
sqlite3 dev.db "PRAGMA cache_size=-64000;"  # 64MB cache
```

## 🌐 Network & Connectivity Issues

### 🚫 "Connection Refused" Errors

**Symptoms:**

- Cannot access application
- API calls fail
- WebSocket connections drop

**Diagnostic Steps:**

```bash
# Check if application is running
pm2 status

# Check port availability
sudo netstat -tlnp | grep :3000

# Test local connectivity
curl http://localhost:3000

# Check firewall
sudo ufw status
sudo iptables -L
```

**Solutions:**

1. **Application Not Running**

   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

2. **Port Conflicts**

   ```bash
   # Find process using port
   sudo lsof -i :3000

   # Kill conflicting process
   sudo kill -9 <PID>
   ```

3. **Firewall Blocking**
   ```bash
   sudo ufw allow 3000
   sudo ufw reload
   ```

### 📡 Email Delivery Issues

**Symptoms:**

- Invoice emails not sending
- Password reset emails failing
- SMTP connection errors

**Diagnostic Steps:**

```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Check email configuration
cat .env | grep EMAIL

# Test email sending
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"Test email"}'
```

**Common Fixes:**

1. **Gmail SMTP Settings**

   ```env
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT="587"
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"
   EMAIL_FROM="your-email@gmail.com"
   ```

2. **Enable Less Secure Apps** (or use App Passwords)
   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate App Password for the application

3. **Check Email Logs**
   ```bash
   pm2 logs pos-system | grep -i email
   ```

## 🐳 Docker Issues

### 🚫 "Docker Not Running"

**Symptoms:**

- `docker-compose up` fails
- "Cannot connect to Docker daemon"

**Solutions:**

```bash
# Start Docker service
sudo systemctl start docker

# Enable auto-start
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Restart session or run:
newgrp docker
```

### 💾 Docker Disk Space Issues

**Symptoms:**

- "No space left on device"
- Container builds fail
- Application crashes

**Cleanup Commands:**

```bash
# Remove unused containers
docker container prune -f

# Remove unused images
docker image prune -f

# Remove unused volumes
docker volume prune -f

# Complete cleanup
docker system prune -a --volumes -f

# Check disk usage
docker system df
```

### 🔄 Docker Compose Issues

**Symptoms:**

- Services won't start
- Port conflicts
- Environment variable issues

**Debugging:**

```bash
# Check configuration
docker-compose config

# Start with verbose logging
docker-compose up --verbose

# Check service logs
docker-compose logs app
docker-compose logs db

# Rebuild without cache
docker-compose build --no-cache
```

## ⚡ Performance Issues

### 🐌 Slow Application Response

**Symptoms:**

- Page loads take >3 seconds
- API calls timeout
- High CPU/memory usage

**Performance Tuning:**

1. **Memory Optimization**

   ```bash
   # Check memory usage
   pm2 monit

   # Increase Node.js memory limit
   pm2 start ecosystem.config.js --node-args="--max-old-space-size=2048"
   ```

2. **Database Optimization**

   ```bash
   # Enable query logging temporarily
   export DEBUG=prisma:query

   # Check slow queries
   pm2 logs | grep "prisma:query"
   ```

3. **Caching Strategies**
   ```bash
   # Implement Redis for session storage (future)
   # Enable database query caching
   # Use CDN for static assets
   ```

### 📈 High Resource Usage

**Symptoms:**

- CPU usage >80%
- Memory usage >90%
- Disk I/O bottlenecks

**Monitoring & Resolution:**

```bash
# Real-time monitoring
pm2 monit

# System resource check
top
iotop  # Disk I/O
iftop  # Network I/O

# Application profiling
pm2 profile pos-system 30
```

## 🖨️ Hardware Issues

### 🖨️ Receipt Printer Problems

**Symptoms:**

- Printer not responding
- Garbled text output
- Paper jam errors

**Troubleshooting:**

```bash
# Check USB connection
lsusb | grep -i printer

# Check printer permissions
ls -la /dev/usb/lp*

# Test printer
echo "Test print" | lp -d <printer-name>

# Check printer logs
dmesg | grep -i usb
```

**ESC/POS Configuration:**

```javascript
// Check printer settings in application
// Verify correct vendor/product IDs
// Test with different baud rates
```

### 📱 Barcode Scanner Issues

**Symptoms:**

- Scanner not recognized
- Incorrect barcode reading
- Input lag

**Solutions:**

```bash
# Check scanner connection
lsusb

# Configure as keyboard input
# Most scanners work as HID devices

# Test scanner input
# Focus on input field and scan test barcode
```

## 🔒 Security Issues

### 🚨 Suspicious Activity

**Symptoms:**

- Multiple failed login attempts
- Unusual API call patterns
- Unexpected data changes

**Investigation:**

```bash
# Check audit logs
sqlite3 dev.db "SELECT * FROM Audit WHERE createdAt > datetime('now', '-1 hour') ORDER BY createdAt DESC;"

# Check failed login attempts
sqlite3 dev.db "SELECT email, failedAttempts, lastFailedLogin FROM User WHERE failedAttempts > 0;"

# Review recent changes
sqlite3 dev.db "SELECT * FROM Audit WHERE action IN ('CREATE', 'UPDATE', 'DELETE') ORDER BY createdAt DESC LIMIT 50;"
```

### 🛡️ Security Hardening

**Immediate Actions:**

```bash
# Change all default passwords
# Enable 2FA for admin accounts
# Update NEXTAUTH_SECRET
# Review user permissions
# Enable rate limiting
```

## 📞 Getting Professional Help

### 🆘 When to Contact Support

**Emergency Situations:**

- Complete system outage
- Data loss or corruption
- Security breach suspected
- Production system down

**Priority Support:**

- Business-critical issues
- Multiple user impact
- Revenue-affecting problems

### 📋 Information to Provide

When contacting support, include:

- **System Information**: OS, Node.js version, Docker version
- **Error Messages**: Exact error text and stack traces
- **Steps to Reproduce**: Detailed reproduction steps
- **Logs**: Relevant log excerpts (sanitize sensitive data)
- **Configuration**: Non-sensitive config settings
- **Timeline**: When the issue started, frequency

### 🏢 Enterprise Support

**For enterprise customers:**

- **Dedicated Support Line**: +1 (829) 123-4567
- **Response Time**: <15 minutes for critical issues
- **On-site Support**: Available for major deployments
- **Custom SLAs**: Tailored service level agreements

---

## 📚 Additional Resources

- [[Installation Guide|Installation]] - Setup troubleshooting
- [[API Documentation|API-Documentation]] - Integration issues
- [[Security Guide|Security]] - Security-related problems
- [[Performance Tuning|Deployment#performance-monitoring]] - Optimization tips
- [[Backup & Recovery|Deployment#backup-strategy]] - Data recovery

**Need more help?** [Contact Support](mailto:support@gntech-dev.com) or [Create an Issue](https://github.com/gntech-dev/pos/issues)

_Last updated: December 29, 2025_

### Database Corruption

**Problem**: Database file corrupted

**Solutions**:

1. Restore from backup
2. Run integrity check:

```sql
PRAGMA integrity_check;
```

3. Rebuild database if needed

### Migration Errors

**Problem**: Database migration fails

**Solutions**:

```bash
# Reset migrations
npm run db:migrate:reset

# Run migrations again
npm run db:migrate
```

## Performance Issues

### Slow Loading

**Problem**: Pages load slowly

**Solutions**:

1. Check server resources (CPU, RAM)
2. Optimize database queries
3. Enable caching
4. Check network connection

### High Memory Usage

**Problem**: Application uses too much RAM

**Solutions**:

1. Restart application
2. Check for memory leaks
3. Increase server RAM
4. Optimize database connections

## Printing Issues

### Receipt Printer Not Working

**Problem**: Can't print receipts

**Solutions**:

1. Check printer connection (USB/network)
2. Verify printer drivers installed
3. Test printer with other applications
4. Check printer settings in application

### Thermal Printer Issues

**Problem**: Thermal printer prints garbage

**Solutions**:

1. Check ESC/POS compatibility
2. Verify correct printer model
3. Update printer firmware
4. Check cable connections

## NCF Issues

### NCF Sequence Exhausted

**Problem**: No more NCF numbers available

**Solutions**:

1. Request new NCF range from DGII
2. Update NCF sequences in settings
3. Contact DGII for extension

### Invalid NCF Format

**Problem**: NCF validation fails

**Solutions**:

1. Check NCF format (B01, B02, etc.)
2. Verify sequence ranges
3. Update NCF settings

## Network Issues

### Connection Timeout

**Problem**: API calls timeout

**Solutions**:

1. Check internet connection
2. Verify server is running
3. Check firewall settings
4. Increase timeout values

### CORS Errors

**Problem**: Cross-origin request blocked

**Solutions**:

1. Check API URLs in configuration
2. Verify CORS settings
3. Update allowed origins

## Email Issues

### Emails Not Sending

**Problem**: Email notifications fail

**Solutions**:

1. Check SMTP settings
2. Verify email credentials
3. Test SMTP connection
4. Check spam folder

### Email Templates Broken

**Problem**: Emails look malformed

**Solutions**:

1. Check HTML template syntax
2. Verify CSS inlining
3. Test with different email clients

## Backup/Restore Issues

### Backup Fails

**Problem**: Backup creation fails

**Solutions**:

1. Check disk space
2. Verify write permissions
3. Stop application during backup
4. Check backup logs

### Restore Fails

**Problem**: Database restore fails

**Solutions**:

1. Verify backup file integrity
2. Check file permissions
3. Stop application before restore
4. Test restore on copy first

## Security Issues

### Suspicious Activity

**Problem**: Unusual login attempts

**Solutions**:

1. Check access logs
2. Enable two-factor authentication
3. Change passwords
4. Block suspicious IPs

### Data Breach Concerns

**Problem**: Suspected unauthorized access

**Solutions**:

1. Change all passwords immediately
2. Review access logs
3. Enable audit logging
4. Contact security team

## Application Errors

### 500 Internal Server Error

**Problem**: Generic server error

**Solutions**:

1. Check application logs
2. Verify database connection
3. Check file permissions
4. Restart application

### 404 Not Found

**Problem**: Page not found

**Solutions**:

1. Check URL spelling
2. Verify route configuration
3. Check file existence
4. Clear browser cache

## Update Issues

### Update Fails

**Problem**: Application update fails

**Solutions**:

1. Backup database first
2. Check update logs
3. Roll back if needed
4. Contact support

### Compatibility Issues

**Problem**: Update breaks functionality

**Solutions**:

1. Check version compatibility
2. Review changelog
3. Test in staging environment
4. Roll back to previous version

## Logs and Debugging

### Accessing Logs

**Production (PM2)**:

```bash
pm2 logs pos-system
```

**Development**:

```bash
npm run dev
# Logs appear in terminal
```

### Debug Mode

Enable debug logging:

```bash
DEBUG=* npm run dev
```

### Log Analysis

Common log patterns:

- `ERROR`: Critical issues
- `WARN`: Warning conditions
- `INFO`: General information
- `DEBUG`: Detailed debugging info

## Email Issues

### PDF Generation Fails

**Problem**: Error when sending invoice emails

**Symptoms**:

- "Maximum call stack size exceeded"
- PDF appears corrupted
- Weird characters in payment method

**Solutions**:

1. Check browser compatibility (Chrome/Firefox recommended)
2. Clear browser cache and cookies
3. Ensure stable internet connection
4. Try refreshing the page

### Email Not Received

**Problem**: Invoice emails not arriving

**Solutions**:

1. Check spam/junk folder
2. Verify email address is correct
3. Check email configuration in settings
4. Test email settings with `/api/email/test`

### Character Encoding Issues

**Problem**: Spanish characters appear garbled

**Solutions**:

1. Use modern browser (Chrome 90+)
2. Ensure UTF-8 encoding
3. Check email client settings
4. Try different email client

## Getting Help

If you can't resolve an issue:

1. Gather information:
   - Error messages
   - Log files
   - System information
   - Steps to reproduce

2. Check resources:
   - [[FAQ|FAQ]]
   - GitHub Issues
   - Documentation

3. Contact support:
   - Create detailed bug report
   - Include system information
   - Provide steps to reproduce

## Prevention

### Regular Maintenance

- Keep system updated
- Monitor logs regularly
- Perform regular backups
- Check disk space

### Monitoring

- Set up alerts for errors
- Monitor performance metrics
- Review access logs
- Check backup integrity
