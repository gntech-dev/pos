# Uploads Directory

This directory is used to store user-uploaded files in the POS system.

## Purpose

- **Product Images:** Photos of products uploaded by administrators
- **Documents:** Invoice templates, receipts, and other business documents
- **User Files:** Any files uploaded through the system's file upload functionality

## Backup Integration

This directory is automatically included in the system's backup process under the "Files" component. When creating backups, all files in this directory are:

1. Compressed into the backup archive
2. Encrypted (if encryption is enabled)
3. Saved with proper metadata for restoration

## Permissions

- **Read/Write:** System administrators and authorized users
- **Backup:** Automatically included in full and partial file backups

## File Management

- Files should be organized in subdirectories by type (e.g., `/products`, `/documents`)
- Large files should be compressed before upload to save space
- Regular cleanup of obsolete files is recommended

---

**Note:** This directory was created to resolve the "File directory not found: uploads" backup error.