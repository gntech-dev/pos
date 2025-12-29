# Deployment Verification Checklist

## Pre-Deployment Verification ✅

### Code Readiness
- [ ] Database fix applied (`dotenv/config` import in seed.ts)
- [ ] All changes committed to Git
- [ ] Documentation updated
- [ ] Build successful locally
- [ ] Tests passing locally

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] PM2 installed globally
- [ ] Environment variables configured
- [ ] Database URL properly set
- [ ] SMTP settings configured (if needed)

## Post-Deployment Verification ✅

### Application Status
- [ ] PM2 status shows "online"
- [ ] Application responding on port 3000
- [ ] No critical errors in PM2 logs
- [ ] Memory usage within limits
- [ ] Application restarts successfully

### Database Verification
- [ ] Database file created (production.db/dev.db)
- [ ] All tables present: User, Product, Customer, etc.
- [ ] Seed data populated (3 users, sample products)
- [ ] Database queries execute successfully

### Authentication Test
- [ ] Login API returns HTTP 200 for valid credentials
- [ ] Default admin user exists (admin/admin123)
- [ ] Session tokens generated correctly
- [ ] Protected routes accessible after login

### Core Functionality Test
- [ ] Dashboard loads and displays statistics
- [ ] User can view/add products
- [ ] User can create customers
- [ ] User can process test sales
- [ ] Email functionality works (if configured)

## Troubleshooting Commands

### Check Application Health
```bash
pm2 status
pm2 info pos-system
pm2 logs pos-system --lines 50
curl -I http://localhost:3000
```

### Check Database
```bash
ls -la *.db
sqlite3 production.db ".tables"
sqlite3 production.db "SELECT username, role FROM User;"
sqlite3 production.db "SELECT COUNT(*) FROM Product;"
```

### Check Dependencies
```bash
npm list --depth=0
node --version
npm --version
```

### Restart Sequence (if issues)
```bash
pm2 stop pos-system
npm install
npm run build
npx prisma migrate deploy
npm run db:seed
pm2 start pos-system
```

## Success Indicators ✅

### Green Flags
- PM2 status: "online" ✅
- Login test: HTTP 200 response ✅
- Database: Users table has 3 records ✅
- Dashboard: Shows 3 products ✅
- Logs: No "table does not exist" errors ✅

### Red Flags
- PM2 status: "errored" or "stopped" ❌
- Login test: HTTP 500 or authentication errors ❌
- Database: Missing tables or empty User table ❌
- Logs: "Environment variable not found" errors ❌

## Remote Deployment Steps

### Option 1: Git Pull (Recommended)
```bash
cd /opt/pos-system
git pull origin main
npm install
npm run build
pm2 restart pos-system
```

### Option 2: Manual Fix
1. Edit `prisma/seed.ts` - add `import "dotenv/config"` at top
2. Run: `npx prisma migrate deploy`
3. Run: `npm run db:seed`
4. Restart: `pm2 restart pos-system`

## Final Verification
After applying fixes, verify:
- [ ] Application accessible via web browser
- [ ] Login works with admin/admin123
- [ ] Dashboard shows correct data
- [ ] No errors in recent logs
- [ ] All core features functional

---
**Complete this checklist to ensure successful production deployment.**