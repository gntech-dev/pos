import crypto from 'crypto'

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16

// Get encryption key from environment or generate a default one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(KEY_LENGTH).toString('hex')

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)

  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Return format: iv:authTag:encryptedData
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const _iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Hash sensitive data (one-way)
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length)
  }

  const start = data.substring(0, visibleChars)
  const end = data.substring(data.length - visibleChars)
  const masked = '*'.repeat(data.length - visibleChars * 2)

  return start + masked + end
}

/**
 * Validate encryption key
 */
export function validateEncryptionKey(): boolean {
  try {
    const testData = 'test'
    const encrypted = encryptData(testData)
    const decrypted = decryptData(encrypted)
    return decrypted === testData
  } catch {
    return false
  }
}