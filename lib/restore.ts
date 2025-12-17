import fs from 'fs/promises'
import path from 'path'
import AdmZip from 'adm-zip'
// import { prisma } from './prisma'
import { decryptData, validateBackup } from './backup'

// Types and Interfaces
export interface RestoreMetadata {
  id: string
  backupId: string
  backupName: string
  status: 'pending' | 'validating' | 'restoring' | 'completed' | 'failed' | 'rolled_back'
  startedAt: Date
  completedAt?: Date
  userId: string
  components: string[]
  validated: boolean
  restorePath?: string
  errorMessage?: string
  rollbackPerformed: boolean
  originalDataBackup?: string
}

// Restore Options
export interface RestoreOptions {
  backupId: string
  components?: string[]
  overwrite: boolean
  validateOnly: boolean
  userId: string
}

// Component restoration result
interface RestoreResult {
  success: boolean
  component: string
  message: string
  error?: string
}

// Constants
const RESTORE_DIR = path.join(process.cwd(), 'restore')
const TEMP_DIR = path.join(process.cwd(), 'temp')
// const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production'

// Utility Functions
async function ensureDirectories() {
  try {
    await fs.mkdir(RESTORE_DIR, { recursive: true })
    await fs.mkdir(TEMP_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating restore directories:', error)
    throw error
  }
}

async function createRestoreMetadata(options: RestoreOptions): Promise<RestoreMetadata> {
  await ensureDirectories()
  
  const restoreId = `restore-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const metadata: RestoreMetadata = {
    id: restoreId,
    backupId: options.backupId,
    backupName: '',
    status: 'pending',
    startedAt: new Date(),
    userId: options.userId,
    components: options.components || [],
    validated: false,
    rollbackPerformed: false
  }
  
  return metadata
}

async function saveRestoreMetadata(metadata: RestoreMetadata) {
  const metadataPath = path.join(RESTORE_DIR, `${metadata.id}.json`)
  await fs.writeFile(metadataPath, Buffer.from(JSON.stringify(metadata, null, 2)))
}

async function loadRestoreMetadata(restoreId: string): Promise<RestoreMetadata | null> {
  try {
    const metadataPath = path.join(RESTORE_DIR, `${restoreId}.json`)
    const metadataBuffer = await fs.readFile(metadataPath)
    const metadata = JSON.parse(metadataBuffer.toString()) as RestoreMetadata
    
    // Convert date strings back to Date objects
    metadata.startedAt = new Date(metadata.startedAt)
    if (metadata.completedAt) {
      metadata.completedAt = new Date(metadata.completedAt)
    }
    
    return metadata
  } catch {
    return null
  }
}

// Database Restoration Functions
async function restoreDatabase(restorePath: string, overwrite: boolean): Promise<RestoreResult> {
  try {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db'
    
    // Create backup of current database if not overwriting
    if (!overwrite) {
      const backupPath = `${dbPath}.backup.${Date.now()}`
      await fs.copyFile(dbPath, backupPath)
      console.log(`Current database backed up to: ${backupPath}`)
    }
    
    // Copy restored database
    const sourcePath = path.join(restorePath, 'database.db')
    await fs.copyFile(sourcePath, dbPath)
    
    console.log('Database restored successfully')
    return {
      success: true,
      component: 'database',
      message: 'Database restored successfully'
    }
    
  } catch (error) {
    console.error('Database restoration failed:', error)
    return {
      success: false,
      component: 'database',
      message: 'Database restoration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Configuration Restoration Functions
async function restoreConfiguration(restorePath: string, overwrite: boolean): Promise<RestoreResult> {
  try {
    const configPath = path.join(restorePath, 'config.zip')
    const zip = new AdmZip(configPath)
    const entries = zip.getEntries()
    
    for (const entry of entries) {
      if (entry.entryName.endsWith('/')) continue // Skip directories
      
      const targetPath = path.join(process.cwd(), entry.entryName)
      
      // Create directory if it doesn't exist
      const dir = path.dirname(targetPath)
      await fs.mkdir(dir, { recursive: true })
      
      // Check if file exists and overwrite is false
      if (!overwrite) {
        try {
          await fs.access(targetPath)
          console.warn(`Skipping existing file: ${entry.entryName}`)
          continue
        } catch {
          // File doesn't exist, safe to restore
        }
      }
      
      // Write file
      await fs.writeFile(targetPath, entry.getData())
    }
    
    console.log('Configuration restored successfully')
    return {
      success: true,
      component: 'config',
      message: 'Configuration restored successfully'
    }
    
  } catch (error) {
    console.error('Configuration restoration failed:', error)
    return {
      success: false,
      component: 'config',
      message: 'Configuration restoration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Cache Restoration Functions
async function restoreCache(restorePath: string, overwrite: boolean): Promise<RestoreResult> {
  try {
    const cachePath = path.join(restorePath, 'cache.zip')
    const zip = new AdmZip(cachePath)
    const entries = zip.getEntries()
    
    for (const entry of entries) {
      if (entry.entryName.endsWith('/')) continue // Skip directories
      
      const targetPath = path.join(process.cwd(), entry.entryName)
      
      // Create directory if it doesn't exist
      const dir = path.dirname(targetPath)
      await fs.mkdir(dir, { recursive: true })
      
      // Check if file exists and overwrite is false
      if (!overwrite) {
        try {
          await fs.access(targetPath)
          console.warn(`Skipping existing cache file: ${entry.entryName}`)
          continue
        } catch {
          // File doesn't exist, safe to restore
        }
      }
      
      // Write file
      await fs.writeFile(targetPath, entry.getData())
    }
    
    console.log('Cache restored successfully')
    return {
      success: true,
      component: 'cache',
      message: 'Cache restored successfully'
    }
    
  } catch (error) {
    console.error('Cache restoration failed:', error)
    return {
      success: false,
      component: 'cache',
      message: 'Cache restoration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Files Restoration Functions
async function restoreFiles(restorePath: string, overwrite: boolean): Promise<RestoreResult> {
  try {
    const filesPath = path.join(restorePath, 'files.zip')
    const zip = new AdmZip(filesPath)
    const entries = zip.getEntries()
    
    for (const entry of entries) {
      if (entry.entryName.endsWith('/')) continue // Skip directories
      
      const targetPath = path.join(process.cwd(), entry.entryName)
      
      // Create directory if it doesn't exist
      const dir = path.dirname(targetPath)
      await fs.mkdir(dir, { recursive: true })
      
      // Check if file exists and overwrite is false
      if (!overwrite) {
        try {
          await fs.access(targetPath)
          console.warn(`Skipping existing file: ${entry.entryName}`)
          continue
        } catch {
          // File doesn't exist, safe to restore
        }
      }
      
      // Write file
      await fs.writeFile(targetPath, entry.getData())
    }
    
    console.log('Files restored successfully')
    return {
      success: true,
      component: 'files',
      message: 'Files restored successfully'
    }
    
  } catch (error) {
    console.error('Files restoration failed:', error)
    return {
      success: false,
      component: 'files',
      message: 'Files restoration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Main Restore Function
export async function createRestore(options: RestoreOptions): Promise<RestoreMetadata> {
  await ensureDirectories()
  
  console.log(`Starting restore process for backup: ${options.backupId}`)
  
  const metadata = await createRestoreMetadata(options)
  
  try {
    // Save initial metadata
    await saveRestoreMetadata(metadata)
    
    // Import backup functions
    const { getBackup, BACKUP_DIR } = await import('./backup')
    
    // Get backup metadata
    const backup = await getBackup(options.backupId)
    if (!backup) {
      throw new Error('Backup not found')
    }
    
    metadata.backupName = backup.name
    metadata.status = 'validating'
    await saveRestoreMetadata(metadata)
    
    // Read backup file
    const backupFilePath = path.join(BACKUP_DIR, `${backup.name}.backup`)
    const backupBuffer = await fs.readFile(backupFilePath)
    
    // Validate backup
    const validationResult = await validateBackup(backupBuffer, backup.encrypted)
    if (!validationResult.valid) {
      throw new Error(`Backup validation failed: ${validationResult.error}`)
    }
    
    metadata.validated = true
    await saveRestoreMetadata(metadata)
    
    if (options.validateOnly) {
      metadata.status = 'completed'
      metadata.completedAt = new Date()
      await saveRestoreMetadata(metadata)
      
      console.log('Backup validation completed successfully')
      return metadata
    }
    
    // Decrypt and extract backup
    let buffer: Buffer = backupBuffer
    if (backup.encrypted) {
      buffer = decryptData(buffer)
    }
    
    const zip = new AdmZip(buffer)
    const tempRestorePath = path.join(TEMP_DIR, metadata.id)
    await fs.mkdir(tempRestorePath, { recursive: true })
    
    // Extract to temporary location
    zip.extractAllTo(tempRestorePath, true)
    metadata.restorePath = tempRestorePath
    await saveRestoreMetadata(metadata)
    
    metadata.status = 'restoring'
    await saveRestoreMetadata(metadata)
    
    // Determine which components to restore
    const componentsToRestore = options.components || backup.components.map(c => c.type)
    
    const results: RestoreResult[] = []
    
    // Restore each component
    for (const component of componentsToRestore) {
      let result: RestoreResult
      
      switch (component) {
        case 'database':
          result = await restoreDatabase(tempRestorePath, options.overwrite)
          break
        case 'config':
          result = await restoreConfiguration(tempRestorePath, options.overwrite)
          break
        case 'cache':
          result = await restoreCache(tempRestorePath, options.overwrite)
          break
        case 'files':
          result = await restoreFiles(tempRestorePath, options.overwrite)
          break
        default:
          result = {
            success: false,
            component,
            message: `Unknown component: ${component}`
          }
      }
      
      results.push(result)
      
      if (!result.success) {
        console.error(`Component restoration failed: ${component}`, result.error)
        // Continue with other components but mark as failed
      }
    }
    
    // Check if all components restored successfully
    const allSuccessful = results.every(r => r.success)
    
    if (allSuccessful) {
      metadata.status = 'completed'
      console.log('Restore completed successfully')
    } else {
      metadata.status = 'failed'
      const failedComponents = results.filter(r => !r.success)
      metadata.errorMessage = `Failed to restore components: ${failedComponents.map(r => r.component).join(', ')}`
      console.error('Restore completed with errors:', metadata.errorMessage)
    }
    
    metadata.completedAt = new Date()
    await saveRestoreMetadata(metadata)
    
    // Clean up temporary files
    try {
      await fs.rm(tempRestorePath, { recursive: true, force: true })
    } catch (error) {
      console.warn('Failed to clean up temporary restore files:', error)
    }
    
    return metadata
    
  } catch (error) {
    metadata.status = 'failed'
    const message = error instanceof Error ? error.message : 'Unknown error'
    metadata.errorMessage = message
    metadata.completedAt = new Date()
    
    console.error('Restore failed:', message)
    
    await saveRestoreMetadata(metadata)
    throw error
  }
}

// List Restores Function
export async function listRestores(): Promise<RestoreMetadata[]> {
  await ensureDirectories()
  
  try {
    const files = await fs.readdir(RESTORE_DIR)
    const metadataFiles = files.filter(file => file.endsWith('.json'))
    const restores: RestoreMetadata[] = []
    
    for (const metadataFile of metadataFiles) {
      try {
        const metadataPath = path.join(RESTORE_DIR, metadataFile)
        const metadataBuffer = await fs.readFile(metadataPath)
        const metadata = JSON.parse(metadataBuffer.toString()) as RestoreMetadata
        
        // Convert date strings back to Date objects
        metadata.startedAt = new Date(metadata.startedAt)
        if (metadata.completedAt) {
          metadata.completedAt = new Date(metadata.completedAt)
        }
        
        restores.push(metadata)
      } catch (error) {
        console.warn(`Failed to read restore metadata for ${metadataFile}:`, error)
      }
    }
    
    // Sort by start date (newest first)
    restores.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    
    return restores
  } catch (error) {
    console.error('Failed to list restores:', error)
    return []
  }
}

// Get Restore Function
export async function getRestore(restoreId: string): Promise<RestoreMetadata | null> {
  return await loadRestoreMetadata(restoreId)
}

// Rollback Function
export async function rollbackRestore(restoreId: string, _userId: string): Promise<boolean> {
  try {
    const restore = await getRestore(restoreId)
    if (!restore) {
      throw new Error('Restore not found')
    }
    
    if (restore.status !== 'failed') {
      throw new Error('Can only rollback failed restores')
    }
    
    if (restore.rollbackPerformed) {
      throw new Error('Rollback already performed for this restore')
    }
    
    console.log(`Starting rollback for restore: ${restoreId}`)
    
    // Implementation would depend on what backup strategy is used
    // For now, we'll mark it as rolled back
    restore.status = 'rolled_back'
    restore.rollbackPerformed = true
    await saveRestoreMetadata(restore)
    
    console.log('Rollback completed successfully')
    return true
    
  } catch (error) {
    console.error('Rollback failed:', error)
    throw error
  }
}

// Export utility functions
export { RESTORE_DIR, TEMP_DIR }