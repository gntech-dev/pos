import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import crypto from 'crypto'

/**
 * Generate a secret for 2FA
 */
export function generate2FASecret(): { secret: string; otpauthUrl: string } {
  const secret = speakeasy.generateSecret({
    name: 'POS System',
    issuer: 'POS System',
    length: 32
  })

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url || ''
  }
}

/**
 * Verify a 2FA token
 */
export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time windows (30 seconds each)
  })
}

/**
 * Generate QR code data URL for 2FA setup
 */
export async function generateQRCodeDataURL(otpauthUrl: string): Promise<string> {
  try {
    return await qrcode.toDataURL(otpauthUrl)
  } catch {
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate backup codes for 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
  }
  return codes
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string {
  return JSON.stringify(codes.map(code => crypto.createHash('sha256').update(code).digest('hex')))
}

/**
 * Verify a backup code
 */
export function verifyBackupCode(storedCodes: string[], inputCode: string): boolean {
  const hashedInput = crypto.createHash('sha256').update(inputCode).digest('hex')
  return storedCodes.includes(hashedInput)
}

/**
 * Remove used backup code
 */
export function removeUsedBackupCode(storedCodes: string[], usedCode: string): string[] {
  const hashedUsed = crypto.createHash('sha256').update(usedCode).digest('hex')
  return storedCodes.filter(code => code !== hashedUsed)
}