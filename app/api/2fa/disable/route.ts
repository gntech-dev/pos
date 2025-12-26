import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_ENTITIES, getClientIP } from '@/lib/audit'

// DELETE /api/2fa/disable - Disable 2FA
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update user to disable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null
      }
    })

    // Log the action
    await logAuditEvent({
      userId: session.user.id,
      action: AUDIT_ACTIONS.USER_2FA_DISABLED,
      entity: AUDIT_ENTITIES.USER,
      entityId: session.user.id,
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