# Utility Scripts

This directory contains utility scripts for database maintenance, deployment, and system administration.

## Database Scripts

### Python Scripts
These scripts are used for database schema updates and data migration.

#### `add_expiry_fields.py`
Adds expiry date fields to product batches table.

```bash
python add_expiry_fields.py
```

#### `add_expiry_to_receipts.py`
Adds expiry information to receipt printing functionality.

```bash
python add_expiry_to_receipts.py
```

#### `add_monitor_expiry.py`
Adds expiry monitoring functionality to the system.

```bash
python add_monitor_expiry.py
```

#### `update_ncf_state.py`
Updates NCF (Número de Comprobante Fiscal) state tracking.

```bash
python update_ncf_state.py
```

## NCF Alert Scripts

### `ncf-alerts-cron.js`
Automated NCF alerts monitoring and email notification script. This script checks for critical NCF issues and sends email notifications to administrators.

**Features:**
- Checks for expired NCF sequences
- Monitors sequences expiring within 30 days
- Alerts for low stock sequences
- Sends automated email notifications to admin users
- Logs all activities to audit trail

**Usage:**
```bash
# Run manually
node scripts/ncf-alerts-cron.js

# Or add to crontab for daily execution at 9 AM:
# 0 9 * * * cd /path/to/pos-system && node scripts/ncf-alerts-cron.js
```

**Requirements:**
- Node.js environment
- Database connection
- Email configuration in `email-config.json`
- Admin users with valid email addresses

**Email Recipients:**
The script automatically sends notifications to all users with `ADMIN` role who have valid email addresses configured.

## Deployment Scripts

### `backup.sh`
Automated backup script for database and application data.

```bash
./backup.sh
```

### `deploy.sh`
Deployment script for production environments.

```bash
./deploy.sh
```

## Utility Scripts

### `check_ncf_data.js`
Node.js script to validate and check NCF data integrity.

```bash
node check_ncf_data.js
```

## Usage Notes

- All scripts should be run from the project root directory
- Ensure proper permissions are set for executable scripts
- Database scripts may require database access
- Backup scripts should be run regularly for data safety
- Review script output for any errors or warnings

## Requirements

- Python 3.x for .py scripts
- Node.js for .js scripts
- Bash shell for .sh scripts
- Appropriate database access permissions
- File system write permissions for backups