import { RateLimiterMemory } from 'rate-limiter-flexible'
import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configurations
export const rateLimitConfigs = {
  // Strict limits for sensitive endpoints
  login: {
    points: 5, // Number of requests
    duration: 900, // Per 15 minutes (900 seconds)
    blockDuration: 900, // Block for 15 minutes
    keyPrefix: 'login_',
    execEvenly: true, // Spread requests evenly
  },
  
  // Validation endpoints (RNC, Cédula, NCF)
  validation: {
    points: 100, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 300, // Block for 5 minutes
    keyPrefix: 'validation_',
  },
  
  // Search endpoints
  search: {
    points: 50, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 300, // Block for 5 minutes
    keyPrefix: 'search_',
  },
  
  // General API endpoints
  general: {
    points: 1000, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 60, // Block for 1 minute
    keyPrefix: 'general_',
  },
  
  // Admin endpoints (more permissive for authenticated users)
  admin: {
    points: 2000, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 60, // Block for 1 minute
    keyPrefix: 'admin_',
  }
}

// Rate limiter response interface
interface RateLimiterRes {
  remainingPoints: number
  msBeforeNext: number
  totalHits: number
}

// Create rate limiters
const rateLimiters = {
  login: new RateLimiterMemory(rateLimitConfigs.login),
  validation: new RateLimiterMemory(rateLimitConfigs.validation),
  search: new RateLimiterMemory(rateLimitConfigs.search),
  general: new RateLimiterMemory(rateLimitConfigs.general),
  admin: new RateLimiterMemory(rateLimitConfigs.admin),
}

// Interface for rate limit options
export interface RateLimitOptions {
  limiter: keyof typeof rateLimiters
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// Get client IP address
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return '127.0.0.1' // Fallback IP
}

// Generate rate limit key
function generateKey(req: NextRequest, prefix: string, customKey?: string): string {
  if (customKey) {
    return `${prefix}${customKey}`
  }
  
  const ip = getClientIP(req)
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  // Include user agent hash to prevent abuse from different browsers on same IP
  const uaHash = Buffer.from(userAgent).toString('base64').slice(0, 8)
  
  return `${prefix}${ip}_${uaHash}`
}

// Rate limiting middleware
export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions
): Promise<{ success: boolean; remaining?: number; resetTime?: number }> {
  try {
    const { limiter, keyGenerator } = options
    const rateLimiter = rateLimiters[limiter]
    
    if (!rateLimiter) {
      console.warn(`Unknown rate limiter: ${limiter}`)
      return { success: true }
    }
    
    const key = keyGenerator ? keyGenerator(req) : generateKey(req, rateLimitConfigs[limiter].keyPrefix)
    const res = await rateLimiter.consume(key)
    
    return {
      success: true,
      remaining: res.remainingPoints,
      resetTime: res.msBeforeNext
    }
    
  } catch (rateLimiterRes) {
    // Rate limit exceeded
    const remainingPoints = (rateLimiterRes as RateLimiterRes)?.remainingPoints || 0
    const msBeforeNext = (rateLimiterRes as RateLimiterRes)?.msBeforeNext || 60 * 1000
    
    console.warn(`Rate limit exceeded for ${getClientIP(req)} on ${options.limiter}`, {
      ip: getClientIP(req),
      endpoint: req.nextUrl.pathname,
      limiter: options.limiter,
      remainingPoints,
      resetTime: new Date(Date.now() + msBeforeNext)
    })
    
    return {
      success: false,
      remaining: remainingPoints,
      resetTime: msBeforeNext
    }
  }
}

// Create Next.js response for rate limit exceeded
interface RateLimitResponse {
  resetTime?: number
  remaining?: number
}

export function createRateLimitResponse(res: RateLimitResponse, options: RateLimitOptions): NextResponse {
  const resetTime = res.resetTime || 60000 // Default 1 minute
  
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(resetTime / 1000)
    },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil(resetTime / 1000).toString(),
        'X-RateLimit-Limit': rateLimitConfigs[options.limiter].points.toString(),
        'X-RateLimit-Remaining': (res.remaining || 0).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + resetTime).toISOString()
      }
    }
  )
}

// Endpoint-specific rate limiters
export const endpointLimiters = {
  // Login endpoint - very strict
  login: (req: NextRequest) => rateLimit(req, { 
    limiter: 'login',
    keyGenerator: (req) => generateKey(req, rateLimitConfigs.login.keyPrefix, getClientIP(req))
  }),
  
  // RNC validation
  validateRNC: (req: NextRequest) => rateLimit(req, { 
    limiter: 'validation',
    keyGenerator: (req) => {
      const rnc = req.nextUrl.pathname.split('/').pop()
      return generateKey(req, rateLimitConfigs.validation.keyPrefix, `rnc_${rnc}`)
    }
  }),
  
  // Cédula validation
  validateCedula: (req: NextRequest) => rateLimit(req, { 
    limiter: 'validation',
    keyGenerator: (req) => {
      const cedula = req.nextUrl.pathname.split('/').pop()
      return generateKey(req, rateLimitConfigs.validation.keyPrefix, `cedula_${cedula}`)
    }
  }),
  
  // NCF expiration lookup
  ncfExpiration: (req: NextRequest) => rateLimit(req, { 
    limiter: 'validation',
    keyGenerator: (req) => {
      const ncf = req.nextUrl.pathname.split('/').pop()
      return generateKey(req, rateLimitConfigs.validation.keyPrefix, `ncf_${ncf}`)
    }
  }),
  
  // General validation endpoints
  validation: (req: NextRequest) => rateLimit(req, { limiter: 'validation' }),
  
  // Search endpoints
  search: (req: NextRequest) => rateLimit(req, { limiter: 'search' }),
  
  // General API endpoints
  general: (req: NextRequest) => rateLimit(req, { limiter: 'general' }),
  
  // Admin endpoints
  admin: (req: NextRequest) => rateLimit(req, { limiter: 'admin' })
}

// Brute force protection specific to login
export class BruteForceProtection {
  private static maxAttempts = 5
  private static blockDuration = 15 * 60 * 1000 // 15 minutes
  private static attempts = new Map<string, { count: number; blockedUntil: number }>()
  
  static async checkPassword(ip: string, username?: string): Promise<{
    allowed: boolean
    remainingAttempts?: number
    blockedUntil?: number
  }> {
    const key = username ? `${username}:${ip}` : ip
    const now = Date.now()
    const record = this.attempts.get(key)
    
    // If currently blocked
    if (record && record.blockedUntil > now) {
      return {
        allowed: false,
        blockedUntil: record.blockedUntil
      }
    }
    
    // If block duration has passed, reset
    if (record && record.blockedUntil <= now) {
      this.attempts.delete(key)
    }
    
    return { allowed: true }
  }
  
  static async recordFailure(ip: string, username?: string): Promise<void> {
    const key = username ? `${username}:${ip}` : ip
    const now = Date.now()
    const record = this.attempts.get(key) || { count: 0, blockedUntil: 0 }
    
    record.count++
    
    if (record.count >= this.maxAttempts) {
      record.blockedUntil = now + this.blockDuration
      console.warn(`Brute force protection triggered for ${key}`, {
        ip,
        username,
        attempts: record.count,
        blockedUntil: new Date(record.blockedUntil)
      })
    }
    
    this.attempts.set(key, record)
  }
  
  static async recordSuccess(ip: string, username?: string): Promise<void> {
    const key = username ? `${username}:${ip}` : ip
    this.attempts.delete(key)
  }
  
  static getRemainingAttempts(ip: string, username?: string): number {
    const key = username ? `${username}:${ip}` : ip
    const record = this.attempts.get(key)
    return record ? Math.max(0, this.maxAttempts - record.count) : this.maxAttempts
  }
}

// Rate limit violation logging
interface ViolationDetails {
  [key: string]: unknown
}

export function logRateLimitViolation(
  req: NextRequest,
  limiter: string,
  key: string,
  details?: ViolationDetails
): void {
  const violation = {
    timestamp: new Date().toISOString(),
    ip: getClientIP(req),
    method: req.method,
    url: req.url,
    pathname: req.nextUrl.pathname,
    userAgent: req.headers.get('user-agent'),
    limiter,
    key,
    ...details
  }
  
  console.warn('Rate limit violation detected:', violation)
  
  // In a production environment, you might want to:
  // 1. Send alerts to monitoring systems
  // 2. Store violations in a database
  // 3. Trigger automated responses (IP blocking, etc.)
}