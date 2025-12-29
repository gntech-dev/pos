import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth-utils"
import { setSessionCookie } from "@/lib/session"
import { endpointLimiters, createRateLimitResponse, BruteForceProtection, logRateLimitViolation } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    // Check rate limiting first
    const rateLimitResult = await endpointLimiters.login(req)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult, { limiter: 'login' })
    }

    // Check brute force protection
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip') ||
                     '127.0.0.1'
    
    const bruteForceCheck = await BruteForceProtection.checkPassword(clientIP)
    if (!bruteForceCheck.allowed) {
      const remainingTime = Math.ceil((bruteForceCheck.blockedUntil! - Date.now()) / 1000)
      logRateLimitViolation(req, 'brute_force', `${clientIP}`, {
        blockedUntil: bruteForceCheck.blockedUntil,
        remainingTime
      })
      
      return NextResponse.json(
        {
          error: "Too many login attempts",
          message: `Account temporarily blocked. Try again in ${remainingTime} seconds.`,
          retryAfter: remainingTime
        },
        {
          status: 429,
          headers: {
            'Retry-After': remainingTime.toString()
          }
        }
      )
    }

    const body = await req.json()
    const { username, password } = body

    // DEBUG: Log parsed request body to help diagnose client issues
    try {
      console.log('Parsed login body:', {
        username: username || null,
        hasPassword: !!password
      })
    } catch {
      console.log('Could not log login body')
    }

    console.log('Login attempt for', username)

    if (!username || !password) {
      await BruteForceProtection.recordFailure(clientIP, username)
      return NextResponse.json(
        { error: "Missing username or password" },
        { status: 400 }
      )
    }

    // First, authenticate with username/password
    const user = await authenticateUser(username, password)

    if (!user) {
      console.log('Auth failed for', username)
      await BruteForceProtection.recordFailure(clientIP, username)
      const remainingAttempts = BruteForceProtection.getRemainingAttempts(clientIP, username)

      logRateLimitViolation(req, 'login_failure', `${clientIP}:${username}`, {
        username,
        remainingAttempts,
        message: 'Invalid credentials'
      })

      return NextResponse.json(
        {
          error: "Invalid credentials",
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : undefined
        },
        { status: 401 }
      )
    }

    console.log('Auth success for', username)

    // Set session cookie
    console.log('Setting session cookie')
    await setSessionCookie(user.id, user.role)
    console.log('Session cookie set')

    console.log('Creating simple response...')
    const responseData = { message: "Login successful", userId: user.id }
    console.log('Response data created')

    console.log('Returning success response')
    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
