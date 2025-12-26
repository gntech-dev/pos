import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_ENTITIES, getClientIP } from './audit'

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Content Security Policy
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  )

  // HSTS (HTTP Strict Transport Security) - only for HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

/**
 * Detect suspicious activity patterns
 */
export async function detectSuspiciousActivity(
  req: NextRequest,
  userId?: string
): Promise<boolean> {
  const clientIP = getClientIP(req)
  const userAgent = req.headers.get('user-agent') || ''
  const pathname = req.nextUrl.pathname

  let isSuspicious = false
  let reason = ''

  // Check for common attack patterns
  if (pathname.includes('../') || pathname.includes('..\\')) {
    isSuspicious = true
    reason = 'Path traversal attempt'
  }

  // Check for SQL injection patterns
  const sqlPatterns = ['union select', '1=1', 'or 1=1', 'script>', '<script']
  if (sqlPatterns.some(pattern => req.url.toLowerCase().includes(pattern))) {
    isSuspicious = true
    reason = 'Potential SQL injection or XSS attempt'
  }

  // Check for unusual user agents
  if (!userAgent || userAgent.length < 10) {
    isSuspicious = true
    reason = 'Suspicious or missing user agent'
  }

  // Check for rapid requests from same IP (additional layer beyond rate limiting)
  // This would require a more sophisticated implementation with Redis/memory store

  if (isSuspicious && userId) {
    await logAuditEvent({
      userId: userId || 'unknown',
      action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
      entity: AUDIT_ENTITIES.AUTH,
      entityId: clientIP,
      oldValue: { reason, userAgent: userAgent.substring(0, 100) },
      newValue: { pathname, method: req.method },
      ipAddress: clientIP,
    })
  }

  return isSuspicious
}

/**
 * Validate request origin
 */
export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const _host = req.headers.get('host')

  // In development, allow localhost
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  // In production, check against allowed origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []

  if (origin && !allowedOrigins.includes(origin)) {
    return false
  }

  return true
}

/**
 * Security middleware wrapper
 */
export async function withSecurity(
  req: NextRequest,
  handler: () => Promise<NextResponse>,
  options: {
    checkSuspicious?: boolean
    userId?: string
    validateOrigin?: boolean
  } = {}
): Promise<NextResponse> {
  const { checkSuspicious = true, userId, validateOrigin: shouldValidateOrigin = false } = options

  // Validate origin if required
  if (shouldValidateOrigin && !validateOrigin(req)) {
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    )
  }

  // Check for suspicious activity
  if (checkSuspicious) {
    const isSuspicious = await detectSuspiciousActivity(req, userId)
    if (isSuspicious) {
      return NextResponse.json(
        { error: 'Suspicious activity detected' },
        { status: 403 }
      )
    }
  }

  // Execute the handler
  const response = await handler()

  // Add security headers
  return addSecurityHeaders(response)
}