import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import AdmZip from 'adm-zip'
// import { prisma } from './prisma'

// Types and Interfaces
export interface BackupMetadata {
  id: string
  name: string
  type: 'full' | 'partial' | 'incremental'
  size: number
  compressed: boolean
  encrypted: boolean
  checksum: string
  createdAt: Date
  createdBy: string
  components: BackupComponent[]
  retention: {
    keepUntil: Date
    autoDelete: boolean
  }
  status: 'pending' | 'running' | 'completed' | 'failed'
  errorMessage?: string
}

export interface BackupComponent {
  name: string
  type: 'database' | 'config' | 'cache' | 'files'
  size: number
  checksum: string
}

export interface BackupOptions {
  name?: string
  type: 'full' | 'partial'
  components?: string[]
  encrypt: boolean
  compress: boolean
  retentionDays?: number
  userId: string
}

export interface RestoreOptions {
  backupId: string
  components?: string[]
  overwrite: boolean
  validateOnly: boolean
  userId: string
}

// Component result interface
interface ComponentResult {
  buffer: Buffer
  checksum: string
  size: number
}

// Constants
const BACKUP_DIR = path.join(process.cwd(), 'backups')
const TEMP_DIR = path.join(process.cwd(), 'temp')
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production'

// Utility Functions
async function ensureDirectories() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    await fs.mkdir(TEMP_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating directories:', error)
    throw error
  }
}

function generateChecksum(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function encryptData(data: Buffer, key: string = ENCRYPTION_KEY): Buffer {
  const algorithm = 'aes-256-cbc'
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, key)
  let encrypted = cipher.update(data)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  
  // Return IV + encrypted data
  return Buffer.concat([iv, encrypted])
}

function decryptData(encryptedData: Buffer, key: string = ENCRYPTION_KEY): Buffer {
  const algorithm = 'aes-256-cbc'
  const _iv = encryptedData.slice(0, 16)
  const encrypted = encryptedData.slice(16)
  
  const decipher = crypto.createDecipher(algorithm, key)
  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  
  return decrypted
}

// Database Backup Functions
async function backupDatabase(): Promise<ComponentResult> {
  console.log('Starting database backup...')
  
  try {
    // Get database path from Prisma
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db'
    
    // Read database file
    const dbBuffer = await fs.readFile(dbPath)
    const checksum = generateChecksum(dbBuffer)
    
    console.log(`Database backup completed. Size: ${dbBuffer.length} bytes, Checksum: ${checksum}`)
    
    return {
      buffer: dbBuffer,
      checksum,
      size: dbBuffer.length
    }
  } catch (error) {
    console.error('Database backup failed:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Database backup failed: ${message}`)
  }
}

// Configuration Backup Functions
async function backupConfiguration(): Promise<ComponentResult> {
  console.log('Starting configuration backup...')
  
  try {
    const configFiles = [
      '.env',
      'email-config.json',
      'next.config.ts',
      'package.json'
    ]
    
    const zip = new AdmZip()
    const componentFiles: { name: string; size: number; checksum: string }[] = []
    
    for (const file of configFiles) {
      try {
        const filePath = path.join(process.cwd(), file)
        const fileBuffer = await fs.readFile(filePath)
        zip.addFile(file, fileBuffer)
        
        componentFiles.push({
          name: file,
          size: fileBuffer.length,
          checksum: generateChecksum(fileBuffer)
        })
      } catch {
        console.warn(`Config file not found or inaccessible: ${file}`)
      }
    }
    
    const configBuffer = zip.toBuffer()
    const checksum = generateChecksum(configBuffer)
    
    console.log(`Configuration backup completed. Files: ${componentFiles.length}, Size: ${configBuffer.length} bytes`)
    
    return {
      buffer: configBuffer,
      checksum,
      size: configBuffer.length
    }
  } catch (error) {
    console.error('Configuration backup failed:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Configuration backup failed: ${message}`)
  }
}

// Cache Backup Functions
async function backupCache(): Promise<ComponentResult> {
  console.log('Starting cache backup...')
  
  try {
    const cacheDirs = [
      'cache',
      'prisma/migrations'
    ]
    
    const zip = new AdmZip()
    const componentFiles: { name: string; size: number; checksum: string }[] = []
    
    for (const dir of cacheDirs) {
      try {
        const dirPath = path.join(process.cwd(), dir)
        const stats = await fs.stat(dirPath)
        
        if (stats.isDirectory()) {
          const files = await getAllFiles(dirPath)
          
          for (const file of files) {
            const relativePath = path.relative(process.cwd(), file)
            const fileBuffer = await fs.readFile(file)
            zip.addFile(relativePath, fileBuffer)
            
            componentFiles.push({
              name: relativePath,
              size: fileBuffer.length,
              checksum: generateChecksum(fileBuffer)
            })
          }
        }
      } catch {
        console.warn(`Cache directory not found: ${dir}`)
      }
    }
    
    const cacheBuffer = zip.toBuffer()
    const checksum = generateChecksum(cacheBuffer)
    
    console.log(`Cache backup completed. Files: ${componentFiles.length}, Size: ${cacheBuffer.length} bytes`)
    
    return {
      buffer: cacheBuffer,
      checksum,
      size: cacheBuffer.length
    }
  } catch (error) {
    console.error('Cache backup failed:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Cache backup failed: ${message}`)
  }
}

// File System Backup Functions
async function backupFiles(): Promise<ComponentResult> {
  console.log('Starting files backup...')
  
  try {
    const fileDirs = [
      'public',
      'uploads'
    ]
    
    const zip = new AdmZip()
    const componentFiles: { name: string; size: number; checksum: string }[] = []
    
    for (const dir of fileDirs) {
      try {
        const dirPath = path.join(process.cwd(), dir)
        const stats = await fs.stat(dirPath)
        
        if (stats.isDirectory()) {
          const files = await getAllFiles(dirPath)
          
          for (const file of files) {
            const relativePath = path.relative(process.cwd(), file)
            const fileBuffer = await fs.readFile(file)
            zip.addFile(relativePath, fileBuffer)
            
            componentFiles.push({
              name: relativePath,
              size: fileBuffer.length,
              checksum: generateChecksum(fileBuffer)
            })
          }
        }
      } catch {
        console.warn(`File directory not found: ${dir}`)
      }
    }
    
    const filesBuffer = zip.toBuffer()
    const checksum = generateChecksum(filesBuffer)
    
    console.log(`Files backup completed. Files: ${componentFiles.length}, Size: ${filesBuffer.length} bytes`)
    
    return {
      buffer: filesBuffer,
      checksum,
      size: filesBuffer.length
    }
  } catch (error) {
    console.error('Files backup failed:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Files backup failed: ${message}`)
  }
}

// Helper function to get all files in a directory recursively
async function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dirPath)
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file)
    const stat = await fs.stat(fullPath)
    
    if (stat.isDirectory()) {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles)
    } else {
      arrayOfFiles.push(fullPath)
    }
  }
  
  return arrayOfFiles
}

// Main Backup Function
export async function createBackup(options: BackupOptions): Promise<BackupMetadata> {
  await ensureDirectories()
  
  const backupId = crypto.randomUUID()
  const timestamp = new Date()
  const backupName = options.name || `backup-${timestamp.toISOString().split('T')[0]}-${backupId.slice(0, 8)}`
  
  console.log(`Starting backup: ${backupName} (${options.type})`)
  
  const metadata: BackupMetadata = {
    id: backupId,
    name: backupName,
    type: options.type,
    size: 0,
    compressed: options.compress,
    encrypted: options.encrypt,
    checksum: '',
    createdAt: timestamp,
    createdBy: options.userId,
    components: [],
    retention: {
      keepUntil: new Date(timestamp.getTime() + (options.retentionDays || 30) * 24 * 60 * 60 * 1000),
      autoDelete: true
    },
    status: 'running'
  }
  
  try {
    // Determine which components to backup
    const componentsToBackup = options.components || ['database', 'config', 'cache', 'files']
    
    // Create temporary backup structure
    const tempBackupDir = path.join(TEMP_DIR, backupId)
    await fs.mkdir(tempBackupDir, { recursive: true })
    
    const backupZip = new AdmZip()
    let _totalSize = 0
    
    // Backup each component
    for (const component of componentsToBackup) {
      let result: ComponentResult
      
      switch (component) {
        case 'database':
          result = await backupDatabase()
          backupZip.addFile('database.db', result.buffer)
          break
        case 'config':
          result = await backupConfiguration()
          backupZip.addFile('config.zip', result.buffer)
          break
        case 'cache':
          result = await backupCache()
          backupZip.addFile('cache.zip', result.buffer)
          break
        case 'files':
          result = await backupFiles()
          backupZip.addFile('files.zip', result.buffer)
          break
        default:
          console.warn(`Unknown component: ${component}`)
          continue
      }
      
      metadata.components.push({
        name: component,
        type: component as 'database' | 'config' | 'cache' | 'files',
        size: result.size,
        checksum: result.checksum
      })
      _totalSize += result.size
    }
    
    // Add metadata file
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2))
    backupZip.addFile('metadata.json', metadataBuffer)
    
    // Create final backup buffer
    let backupBuffer = backupZip.toBuffer()
    
    // Apply compression if requested
    if (options.compress) {
      console.log('Applying compression...')
      // AdmZip already compresses by default
    }
    
    // Apply encryption if requested
    if (options.encrypt) {
      console.log('Applying encryption...')
      backupBuffer = encryptData(backupBuffer)
    }
    
    // Generate final checksum
    metadata.checksum = generateChecksum(backupBuffer)
    metadata.size = backupBuffer.length
    
    // Save backup file
    const backupFilePath = path.join(BACKUP_DIR, `${backupName}.backup`)
    await fs.writeFile(backupFilePath, backupBuffer)
    
    // Update metadata with final checksum
    metadata.status = 'completed'
    
    // Save metadata separately
    const metadataPath = path.join(BACKUP_DIR, `${backupName}.metadata.json`)
    await fs.writeFile(metadataPath, Buffer.from(JSON.stringify(metadata, null, 2)))
    
    // Clean up temporary files
    await fs.rm(tempBackupDir, { recursive: true, force: true })
    
    console.log(`Backup completed successfully: ${backupName}`)
    console.log(`Total size: ${metadata.size} bytes`)
    console.log(`Checksum: ${metadata.checksum}`)
    
    return metadata
    
  } catch (error) {
    metadata.status = 'failed'
    const message = error instanceof Error ? error.message : 'Unknown error'
    metadata.errorMessage = message
    
    console.error(`Backup failed: ${message}`)
    throw error
  }
}

// List Backups Function
export async function listBackups(): Promise<BackupMetadata[]> {
  await ensureDirectories()
  
  try {
    const files = await fs.readdir(BACKUP_DIR)
    const metadataFiles = files.filter(file => file.endsWith('.metadata.json'))
    const backups: BackupMetadata[] = []
    
    for (const metadataFile of metadataFiles) {
      try {
        const metadataPath = path.join(BACKUP_DIR, metadataFile)
        const metadataBuffer = await fs.readFile(metadataPath)
        const metadata = JSON.parse(metadataBuffer.toString()) as BackupMetadata
        
        // Convert date strings back to Date objects
        metadata.createdAt = new Date(metadata.createdAt)
        metadata.retention.keepUntil = new Date(metadata.retention.keepUntil)
        
        backups.push(metadata)
      } catch {
        console.warn(`Failed to read metadata for ${metadataFile}`)
      }
    }
    
    // Sort by creation date (newest first)
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    
    return backups
  } catch (error) {
    console.error('Failed to list backups:', error)
    return []
  }
}

// Get Backup Function
export async function getBackup(backupId: string): Promise<BackupMetadata | null> {
  const backups = await listBackups()
  return backups.find(backup => backup.id === backupId) || null
}

// Delete Backup Function
export async function deleteBackup(backupId: string): Promise<boolean> {
  await ensureDirectories()
  
  try {
    const backup = await getBackup(backupId)
    if (!backup) {
      throw new Error('Backup not found')
    }
    
    // Delete backup file
    const backupFilePath = path.join(BACKUP_DIR, `${backup.name}.backup`)
    await fs.unlink(backupFilePath)
    
    // Delete metadata file
    const metadataPath = path.join(BACKUP_DIR, `${backup.name}.metadata.json`)
    await fs.unlink(metadataPath)
    
    console.log(`Backup deleted: ${backup.name}`)
    return true
    
  } catch (error) {
    console.error('Failed to delete backup:', error)
    throw error
  }
}

// Cleanup Old Backups Function
export async function cleanupOldBackups(): Promise<number> {
  const backups = await listBackups()
  const now = new Date()
  let cleanedCount = 0
  
  for (const backup of backups) {
    if (backup.retention.autoDelete && backup.retention.keepUntil < now) {
      try {
        await deleteBackup(backup.id)
        cleanedCount++
      } catch (error) {
        console.warn(`Failed to delete old backup ${backup.name}:`, error)
      }
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} old backups`)
  }
  
  return cleanedCount
}

// Validate Backup Function
export async function validateBackup(backupBuffer: Buffer, encrypted: boolean = false): Promise<{ valid: boolean; error?: string }> {
  try {
    let buffer = backupBuffer
    
    // Decrypt if encrypted
    if (encrypted) {
      try {
        buffer = decryptData(buffer)
      } catch {
        return { valid: false, error: 'Failed to decrypt backup' }
      }
    }
    
    // Try to open as ZIP
    try {
      const zip = new AdmZip(buffer)
      const entries = zip.getEntries()
      
      if (entries.length === 0) {
        return { valid: false, error: 'Backup archive is empty' }
      }
      
      // Check for required files
      const hasMetadata = entries.some(entry => entry.entryName === 'metadata.json')
      if (!hasMetadata) {
        return { valid: false, error: 'Missing metadata.json in backup' }
      }
      
      return { valid: true }
      
    } catch {
      return { valid: false, error: 'Invalid backup archive format' }
    }
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { valid: false, error: message }
  }
}

// Export utility functions
export { BACKUP_DIR, TEMP_DIR, encryptData, decryptData, generateChecksum }