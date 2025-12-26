import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { generate2FASecret, generateQRCodeDataURL, generateBackupCodes, hashBackupCodes } from '@/lib/2fa'
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_ENTITIES, getClientIP } from '@/lib/audit'

// GET /api/2fa/setup - Get 2FA setup information
export async function GET(_req: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { twoFactorEnabled: true, twoFactorSecret: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({
        enabled: true,
        message: '2FA is already enabled'
      })
    }

    // Generate new secret
    const { secret, otpauthUrl } = generate2FASecret()
    const qrCodeDataURL = await generateQRCodeDataURL(otpauthUrl)

    return NextResponse.json({
      enabled: false,
      secret,
      qrCodeDataURL,
      otpauthUrl
    })

  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/2fa/enable - Enable 2FA
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { secret, token } = await req.json()

    if (!secret || !token) {
      return NextResponse.json({ error: 'Secret and token are required' }, { status: 400 })
    }

    // Verify the token
    const { verify2FAToken } = await import('@/lib/2fa')
    const isValid = verify2FAToken(secret, token)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes()
    const hashedBackupCodes = hashBackupCodes(backupCodes)

    // Update user
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes: hashedBackupCodes
      }
    })

    // Log the action
    await logAuditEvent({
      userId: session.userId,
      action: AUDIT_ACTIONS.USER_2FA_ENABLED,
      entity: AUDIT_ENTITIES.USER,
      entityId: session.userId,
      newValue: { twoFactorEnabled: true },
      ipAddress: getClientIP(req),
    })

    return NextResponse.json({
      success: true,
      backupCodes, // Return plain codes to user (only shown once)
      message: '2FA enabled successfully. Save your backup codes!'
    })

  } catch (error) {
    console.error('2FA enable error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}