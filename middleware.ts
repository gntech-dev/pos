import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from './lib/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the session token from cookies
  const token = request.cookies.get('session')?.value

  let isAuthenticated = false
  if (token) {
    try {
      const payload = await jwtVerify(token)
      isAuthenticated = !!payload
      if (!isAuthenticated) {
        console.log('Middleware: JWT verification returned null for token:', token.substring(0, 20) + '...')
      }
    } catch (error) {
      console.log('Middleware: JWT verification error:', error)
      // Invalid token, treat as not authenticated
    }
  } else {
    console.log('Middleware: No session token found')
  }

  // If user is authenticated and trying to access login, redirect to dashboard
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!isAuthenticated && !pathname.startsWith('/login') && !pathname.startsWith('/api/login') && !pathname.startsWith('/print') && !pathname.startsWith('/quotations/print') && !pathname.startsWith('/api/backup') && !pathname.startsWith('/api/restore') && !pathname.startsWith('/logos/')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logos/ (logo files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logos/).*)',
  ],
}