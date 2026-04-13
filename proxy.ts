import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = 'chekkit_session'
const ADMIN_COOKIE = 'chekkit_admin'

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-prod'
)
const adminSecret = new TextEncoder().encode(
  process.env.ADMIN_SECRET ?? 'fallback-admin-secret-change-in-prod'
)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /spin and /result — require valid session
  if (pathname.startsWith('/spin') || pathname.startsWith('/result')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    try {
      await jwtVerify(token, secret)
    } catch {
      const response = NextResponse.redirect(new URL('/', request.url))
      response.cookies.delete(SESSION_COOKIE)
      return response
    }
  }

  // Protect /admin/dashboard — require admin session
  if (pathname.startsWith('/admin/dashboard')) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    try {
      await jwtVerify(token, adminSecret)
    } catch {
      const response = NextResponse.redirect(new URL('/admin', request.url))
      response.cookies.delete(ADMIN_COOKIE)
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/spin', '/result', '/admin/dashboard/:path*'],
}
