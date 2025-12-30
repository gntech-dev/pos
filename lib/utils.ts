import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency for Dominican Pesos
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  }).format(amount)
}

// Format date for display
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santo_Domingo',
  }).format(new Date(date))
}

// Validate RNC (9 or 11 digits)
export function validateRNC(rnc: string): boolean {
  const cleaned = rnc.replace(/\D/g, '')
  return cleaned.length === 9 || cleaned.length === 11
}

// Validate Cédula (11 digits)
export function validateCedula(cedula: string): boolean {
  const cleaned = cedula.replace(/\D/g, '')
  if (cleaned.length !== 11) return false

  // Dominican cedula validation algorithm
  // Weights: 1, 2, 1, 2, 1, 2, 1, 2, 1, 2 for positions 1-10
  let sum = 0
  for (let i = 0; i < 10; i++) {
    let digit = parseInt(cleaned[i])
    if (i % 2 === 1) { // Positions 2,4,6,8,10 (1-based) get multiplied by 2
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }

  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(cleaned[10])
}

// Generate NCF
export function generateNCF(prefix: string, sequence: number): string {
  const paddedSequence = sequence.toString().padStart(8, '0')
  return `${prefix}${paddedSequence}`
}

// Calculate tax
export function calculateTax(amount: number, taxRate: number = 0.18): number {
  return Math.round(amount * taxRate * 100) / 100
}

// Calculate total with tax
export function calculateTotal(subtotal: number, tax: number, discount: number = 0): number {
  return Math.round((subtotal + tax - discount) * 100) / 100
}

// Format Dominican cedula with dashes
export function formatCedula(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 10) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 10)}-${cleaned.slice(10, 11)}`
}

// Format Dominican RNC with dashes
export function formatRNC(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 8) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 8)}-${cleaned.slice(8, 9)}`
}

// Format Dominican phone number with dashes
export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
}

// Generate initials from a name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

// Validate email address
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate Dominican phone number
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 && cleaned.startsWith('8')
}

// Calculate Levenshtein distance between two strings
export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  return matrix[b.length][a.length]
}

// Calculate similarity score between two strings (0-1, where 1 is identical)
export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1

  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) return 1

  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  return 1 - (distance / maxLength)
}

// Normalize name for comparison (remove accents, extra spaces, etc.)
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}

// Check if two names are potential duplicates
export function arePotentialDuplicates(name1: string, name2: string, threshold: number = 0.8): boolean {
  const normalized1 = normalizeName(name1)
  const normalized2 = normalizeName(name2)

  // Exact match after normalization
  if (normalized1 === normalized2) return true

  // Check similarity
  const similarity = calculateSimilarity(normalized1, normalized2)
  return similarity >= threshold
}