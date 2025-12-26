import { prisma } from './prisma'
import { NextRequest } from 'next/server'

export interface AuditLogData {
  userId: string
  action: string
  entity: string
  entityId: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an audit event
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        ipAddress: data.ipAddress,
      }
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Try multiple headers for IP detection
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')

  if (forwarded) {
    // Take the first IP if there are multiple
    return forwarded.split(',')[0].trim()
  }

  if (realIP) return realIP
  if (clientIP) return clientIP

  return 'unknown'
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

/**
 * Common audit actions
 */
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',

  // User management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  USER_2FA_ENABLED: 'USER_2FA_ENABLED',
  USER_2FA_DISABLED: 'USER_2FA_DISABLED',

  // Sales
  SALE_CREATED: 'SALE_CREATED',
  SALE_UPDATED: 'SALE_UPDATED',
  SALE_DELETED: 'SALE_DELETED',

  // Products
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',

  // Customers
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED: 'CUSTOMER_DELETED',

  // Settings
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',

  // Security
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
} as const

/**
 * Common entities
 */
export const AUDIT_ENTITIES = {
  USER: 'User',
  SALE: 'Sale',
  PRODUCT: 'Product',
  CUSTOMER: 'Customer',
  SETTINGS: 'Settings',
  AUTH: 'Auth',
} as const