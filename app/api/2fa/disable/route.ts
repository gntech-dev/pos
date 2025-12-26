import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_ENTITIES, getClientIP } from '@/lib/audit'

// DELETE /api/2fa/disable - Disable 2FA
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update user to disable 2FA
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null
      }
    })

    // Log the action
    await logAuditEvent({
      userId: session.userId,
      action: AUDIT_ACTIONS.USER_2FA_DISABLED,
      entity: AUDIT_ENTITIES.USER,
      entityId: session.userId,
      oldValue: { twoFactorEnabled: true },
      newValue: { twoFactorEnabled: false },
      ipAddress: getClientIP(req),
    })

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully'
    })

  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}