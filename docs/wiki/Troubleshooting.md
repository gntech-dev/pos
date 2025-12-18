# Troubleshooting Guide

This guide helps resolve common issues with the POS System.

## Login Issues

### Can't Log In

**Problem**: Invalid credentials error

**Solutions**:
1. Check username and password (case sensitive)
2. Ensure Caps Lock is off
3. Try resetting password (if admin)
4. Check if account is locked due to failed attempts

**Account Locked**:
- Wait for automatic unlock (15 minutes)
- Contact administrator to unlock

### Session Expired

**Problem**: Redirected to login unexpectedly

**Solutions**:
1. Log in again
2. Check browser cookies are enabled
3. Clear browser cache
4. Check server time sync

## Database Issues

### Database Locked Error

**Problem**: `SQLITE_BUSY` or database locked

**Solutions**:
```bash
# Stop the application
pm2 stop pos-system

# Check for hanging processes
ps aux | grep sqlite

# Kill any hanging processes
kill -9 <PID>

# Restart application
pm2 start pos-system
```

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