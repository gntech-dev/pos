import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const session = await getSessionFromCookie()

    return NextResponse.json({
      hasSession: !!session,
      session: session ? { userId: session.userId, role: session.role } : null,
      cookies: req.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
    })
  } catch (error) {
    console.error('Session debug error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
