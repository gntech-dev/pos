import { prisma } from './prisma'

/**
 * NCF Types for Dominican Republic DGII compliance
 * B01: Tax Credit (Crédito Fiscal) - For companies with RNC
 * B02: Consumer Invoice (Consumidor Final) - For individuals
 * B04: Credit Notes (Notas de Crédito) - For refunds
 * B14: Special Regime (Régimen Especial)
 * B15: Gubernamental (Government entities)
 * B16: Export (Exportaciones)
 */
export type NCFType = 'B01' | 'B02' | 'B04' | 'B14' | 'B15' | 'B16'

/**
 * Generate the next NCF for a given type
 * Format: B01XXXXXXXX (11 characters total)
 */
export async function generateNCF(type: NCFType): Promise<string> {
  const sequence = await prisma.nCFSequence.findUnique({
    where: { type }
  })

  if (!sequence) {
    throw new Error(`NCF sequence not found for type: ${type}`)
  }

  if (!sequence.isActive) {
    throw new Error(`NCF sequence is inactive for type: ${type}`)
  }

  // Check if sequence has expired
  if (new Date() > sequence.expiryDate) {
    throw new Error(`NCF sequence has expired for type: ${type}`)
  }

  // Check if we've reached the end of the sequence
  if (sequence.currentNumber >= sequence.endNumber) {
    throw new Error(`NCF sequence exhausted for type: ${type}`)
  }

  // Increment the current number
  const nextNumber = sequence.currentNumber + 1

  // Update the sequence
  await prisma.nCFSequence.update({
    where: { type },
    data: { currentNumber: nextNumber }
  })

  // Format: B01 + 8 digits (padded with zeros)
  const ncf = `${sequence.prefix}${nextNumber.toString().padStart(8, '0')}`

  return ncf
}

/**
 * Validate NCF format
 */
export function validateNCFFormat(ncf: string): boolean {
  // NCF should be 11 characters: 3 letter prefix + 8 digits
  const ncfRegex = /^(B01|B02|B14|B15|B16)\d{8}$/
  return ncfRegex.test(ncf)
}

/**
 * Get NCF type based on customer type
 */
export function getNCFType(hasRNC: boolean, isGovernment: boolean = false, isExport: boolean = false): NCFType {
  if (isExport) return 'B16'
  if (isGovernment) return 'B15'
  if (hasRNC) return 'B01'
  return 'B02'
}

/**
 * Check if NCF sequence is about to expire (within 30 days)
 */
export async function checkNCFExpiration(type: NCFType): Promise<{ isExpiring: boolean; daysLeft: number }> {
  const sequence = await prisma.nCFSequence.findUnique({
    where: { type }
  })

  if (!sequence) {
    throw new Error(`NCF sequence not found for type: ${type}`)
  }

  const now = new Date()
  const expiryDate = new Date(sequence.expiryDate)
  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return {
    isExpiring: daysLeft <= 30,
    daysLeft
  }
}

/**
 * Check if NCF sequence is running low (less than 100 numbers left)
 */
export async function checkNCFAvailability(type: NCFType): Promise<{ isLow: boolean; remaining: number }> {
  const sequence = await prisma.nCFSequence.findUnique({
    where: { type }
  })

  if (!sequence) {
    throw new Error(`NCF sequence not found for type: ${type}`)
  }

  const remaining = sequence.endNumber - sequence.currentNumber

  return {
    isLow: remaining < 100,
    remaining
  }
}

/**
 * Get NCF expiration date for a specific NCF
 */
export async function getNCFExpirationDate(ncf: string): Promise<Date | null> {
  if (!ncf || ncf.length < 3) {
    return null
  }

  // Extract the NCF type from the first 3 characters
  const ncfType = ncf.substring(0, 3) as NCFType

  const sequence = await prisma.nCFSequence.findUnique({
    where: { type: ncfType }
  })

  return sequence ? sequence.expiryDate : null
}

/**
 * Get NCF expiration info for display on receipts
 */
export async function getNCFExpirationInfo(ncf: string): Promise<{ expiryDate: Date | null; daysUntilExpiry: number | null; isExpired: boolean }> {
  console.log('getNCFExpirationInfo called with NCF:', ncf)
  const expiryDate = await getNCFExpirationDate(ncf)
  console.log('Retrieved expiryDate:', expiryDate)
  
  if (!expiryDate) {
    console.log('No expiry date found, returning defaults')
    return { expiryDate: null, daysUntilExpiry: null, isExpired: false }
  }

  const now = new Date()
  const expiry = new Date(expiryDate)
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  const result = {
    expiryDate,
    daysUntilExpiry,
    isExpired: daysUntilExpiry < 0
  }
  console.log('Final NCF info:', result)
  return result
}
