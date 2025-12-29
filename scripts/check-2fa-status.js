#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function check2FAStatus() {
  try {
    console.log('🔍 Checking 2FA status for all users...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
        role: true,
        lastLogin: true
      }
    })

    users.forEach(user => {
      console.log('\n👤 User:', user.username)
      console.log('   Email:', user.email)
      console.log('   Role:', user.role)
      console.log('   2FA Enabled:', user.twoFactorEnabled ? '✅ YES' : '❌ NO')
      console.log('   Has Secret:', user.twoFactorSecret ? '✅ YES' : '❌ NO')
      console.log('   Has Backup Codes:', user.backupCodes ? '✅ YES' : '❌ NO')
      console.log('   Last Login:', user.lastLogin ? user.lastLogin.toISOString() : 'Never')
      
      if (user.twoFactorSecret) {
        console.log('   Secret (first 10 chars):', user.twoFactorSecret.substring(0, 10) + '...')
      }
      
      if (user.backupCodes) {
        try {
          const codes = JSON.parse(user.backupCodes)
          console.log('   Backup Codes Count:', codes.length)
        } catch (e) {
          console.log('   Backup Codes: Invalid JSON')
        }
      }
    })

    console.log('\n✅ 2FA status check completed!')
    
  } catch (error) {
    console.error('❌ Error checking 2FA status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

check2FAStatus()