# Remote System Database Fix

## Quick Fix for Remote Deployment

If your remote system has the database initialization error, apply this fix:

### Step 1: Fix the Seed Script
Edit `prisma/seed.ts` on your remote system:

```bash
nano prisma/seed.ts
```

Add this line at the **very top** of the file (line 1):

```typescript
import "dotenv/config"
```

The file should start with:
```typescript
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
```

### Step 2: Apply Database Setup
```bash
# Stop the application
pm2 stop pos-system

# Apply migrations (if not done already)
npx prisma migrate deploy

# Seed the database
npm run db:seed

# Restart the application
pm2 start pos-system

# Check logs for success
pm2 logs pos-system --lines 20
```

### Step 3: Verify the Fix
```bash
# Test login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Check database
sqlite3 production.db "SELECT username, role FROM User;"
```

### Expected Results
- Login should return HTTP 200 with user data
- Database should show 3 users: admin, manager, cashier
- No more "table does not exist" errors

### If Issues Persist
1. Check environment file exists: `ls -la .env`
2. Verify DATABASE_URL is set: `grep DATABASE_URL .env`
3. Check PM2 logs: `pm2 logs pos-system --lines 50`
4. Ensure all dependencies installed: `npm install`

---
**This fix resolves the database initialization issue that prevents user login in production deployments.**