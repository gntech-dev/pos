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

    if (!username || !password) {
      await BruteForceProtection.recordFailure(clientIP, username)
      return NextResponse.json(
        { error: "Missing username or password" },
        { status: 400 }
      )
    }

    const user = await authenticateUser(username, password)

    if (!user) {
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

    // Success - reset brute force counter
    await BruteForceProtection.recordSuccess(clientIP, username)

    const response = NextResponse.json(
      { message: "Login successful", user },
      { status: 200 }
    )

    // Set session cookie
    await setSessionCookie(user.id, user.role)

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
