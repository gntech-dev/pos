#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function disable2FAForTesting() {
  try {
    console.log('🔧 Disabling 2FA for testing...')
    
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    })

    if (!adminUser) {
      console.log('❌ Admin user not found!')
      return
    }

    console.log('👤 Found user:', adminUser.username)
    console.log('   2FA was enabled:', adminUser.twoFactorEnabled)

    // Disable 2FA for admin user
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null
      }
    })

    console.log('✅ 2FA disabled successfully for admin user!')
    console.log('   Username:', updatedUser.username)
    console.log('   2FA Enabled:', updatedUser.twoFactorEnabled)
    console.log('   Has Secret:', updatedUser.twoFactorSecret ? 'YES' : 'NO')
    console.log('   Has Backup Codes:', updatedUser.backupCodes ? 'YES' : 'NO')

    console.log('\n📝 Test credentials:')
    console.log('   Username: admin')
    console.log('   Password: admin123')
    console.log('   2FA: DISABLED (you can test normal login now)')

  } catch (error) {
    console.error('❌ Error disabling 2FA:', error)
  } finally {
    await prisma.$disconnect()
  }
}

disable2FAForTesting()