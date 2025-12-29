// Application constants
export const APP_CONFIG = {
  name: 'POS System',
  version: '1.0.2',
  description: 'Professional Point of Sale System for Dominican Republic',
  author: 'gntech-dev',
  year: 2025
} as const

// User roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  TRANSFER: 'TRANSFER'
} as const

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]

// Sale statuses
export const SALE_STATUSES = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
} as const

export type SaleStatus = typeof SALE_STATUSES[keyof typeof SALE_STATUSES]

// Product categories
export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Food & Beverage',
  'Home & Garden',
  'Health & Beauty',
  'Sports & Outdoors',
  'Books & Media',
  'Automotive',
  'Other'
] as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]

// Tax rates (Dominican Republic)
export const TAX_RATES = {
  ITBIS: 0.18, // 18% ITBIS
  ISC: 0.10,   // 10% ISC for some products
  EXEMPT: 0    // Exempt products
} as const

// NCF types (Dominican Republic)
export const NCF_TYPES = {
  B01: 'B01', // Final Consumer Invoice
  B02: 'B02', // Credit Note
  B03: 'B03', // Debit Note
  B04: 'B04', // Special Regime
  B11: 'B11', // Provisional Regime
  B12: 'B12', // Provisional Credit Note
  B13: 'B13', // Provisional Debit Note
  B14: 'B14', // Provisional Special Regime
  B15: 'B15', // Minor Expenses
  B16: 'B16'  // Minor Expenses Credit Note
} as const

export type NcfType = typeof NCF_TYPES[keyof typeof NCF_TYPES]

// API response status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error'
} as const

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 10
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600,    // 1 hour
  DAY: 86400     // 24 hours
} as const