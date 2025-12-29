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
