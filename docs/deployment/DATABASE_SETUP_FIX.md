# Database Setup Fix - Critical Production Issue

## Issue Description
When deploying the POS System, you may encounter the following error during database seeding:

```
PrismaClientInitializationError: 
Invalid `prisma.user.upsert()` invocation in
/prisma/seed.ts:9:35

error: Environment variable not found: DATABASE_URL.
```

## Root Cause
The `prisma/seed.ts` file is missing the required `dotenv/config` import, which prevents it from loading environment variables from the `.env` file.

## Solution

### Step 1: Fix the Seed Script
Edit the `prisma/seed.ts` file and add the import at the **top** of the file:

```typescript
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
```

### Step 2: Run Database Setup Commands
Execute these commands in order:

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Apply database migrations
npx prisma migrate deploy

# 3. Seed initial data (users, products, settings)
npm run db:seed
```

### Step 3: Verify Setup
Check that the database was created properly:

```bash
# Check database file exists
ls -la *.db

# Verify tables were created
sqlite3 production.db ".tables"

# Check initial users
sqlite3 production.db "SELECT username, role FROM User;"
```

## Expected Results
After successful setup, you should see:
- Database file created (e.g., `production.db` or `dev.db`)
- Multiple tables created including `User`, `Product`, `Customer`, etc.
- 3 default users: admin, manager, cashier
- Sample products and settings

## Default Credentials
- **Username**: admin
- **Password**: admin123

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## Prevention
This fix has been applied to the codebase. Future deployments should not encounter this issue.

## Verification Commands
Test the application after database setup:

```bash
# Start the application
pm2 start ecosystem.config.js

# Test login API
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Check application logs
pm2 logs pos-system --lines 20
```

## Troubleshooting
If issues persist:
1. Check `.env` file exists and has correct `DATABASE_URL`
2. Verify file permissions on database directory
3. Ensure all migrations completed successfully
4. Check PM2 logs for detailed error messages

---
**Database Setup Fix Applied**: This document ensures successful production deployments by addressing the common seed script environment variable issue.