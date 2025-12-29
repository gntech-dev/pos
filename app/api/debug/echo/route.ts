import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Only allow in development to avoid leaking data in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const raw = await req.text()
    let parsed: unknown = null
    try {
      parsed = JSON.parse(raw)
    } catch {
      // not JSON
    }

    return NextResponse.json({
      ok: true,
      headers: Object.fromEntries(req.headers.entries()),
      raw,
      parsed
    })
  } catch (error) {
    console.error('Debug echo error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
