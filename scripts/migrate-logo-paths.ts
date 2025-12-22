import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateLogoPaths() {
  try {
    console.log('🔄 Migrating logo paths...')

    // Find all settings with logo paths
    const logoSettings = await prisma.setting.findMany({
      where: {
        key: 'business_logo',
        value: {
          startsWith: '/storage/uploads/'
        }
      }
    })

    console.log(`📋 Found ${logoSettings.length} logo settings to migrate`)

    // Update each logo path
    for (const setting of logoSettings) {
      const oldPath = setting.value
      const newPath = oldPath.replace('/storage/uploads/', '/api/storage/uploads/')

      await prisma.setting.update({
        where: { id: setting.id },
        data: {
          value: newPath,
          description: 'Logo de la empresa (migrado)'
        }
      })

      console.log(`✅ Migrated: ${oldPath} → ${newPath}`)
    }

    console.log('🎉 Logo path migration completed!')

  } catch (error) {
    console.error('❌ Error migrating logo paths:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateLogoPaths()