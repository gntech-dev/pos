import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth-utils"
import { setSessionCookie } from "@/lib/session"
import { endpointLimiters, createRateLimitResponse, BruteForceProtection, logRateLimitViolation } from "@/lib/rate-limit"
import { prisma } from "@/lib/prisma"

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
    const { username, password, twoFactorToken, backupCode } = body

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

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      console.log('User has 2FA enabled:', user.username, 'token provided:', !!twoFactorToken, 'backup provided:', !!backupCode)
      
      // 2FA is required but no token provided - request 2FA
      if (!twoFactorToken && !backupCode) {
        console.log('Requesting 2FA for user:', user.username)
        return NextResponse.json(
          {
            requires2FA: true,
            message: "2FA verification required"
          },
          { status: 200 }
        )
      }

      // Verify 2FA token
      const { verify2FAToken, verifyBackupCode } = await import('@/lib/2fa')
      let is2FAValid = false

      if (twoFactorToken) {
        is2FAValid = verify2FAToken(user.twoFactorSecret, twoFactorToken)
      } else if (backupCode && user.backupCodes) {
        const storedCodes = JSON.parse(user.backupCodes)
        is2FAValid = verifyBackupCode(storedCodes, backupCode)

        if (is2FAValid) {
          // Remove used backup code
          const { removeUsedBackupCode } = await import('@/lib/2fa')
          const updatedCodes = removeUsedBackupCode(storedCodes, backupCode)
          await prisma.user.update({
            where: { id: user.id },
            data: { backupCodes: JSON.stringify(updatedCodes) }
          })
        }
      }

      if (!is2FAValid) {
        console.log('2FA verification failed for', username)
        await BruteForceProtection.recordFailure(clientIP, username)

        return NextResponse.json(
          { error: "Invalid 2FA token or backup code" },
          { status: 401 }
        )
      }
    }

    // Success - reset brute force counter
    await BruteForceProtection.recordSuccess(clientIP, username)

    console.log('Auth success for', username)

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
