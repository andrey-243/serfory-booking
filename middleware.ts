import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from './lib/session'

const PROTECTED_ROUTES: Record<string, 'admin' | 'teacher'> = {
  '/admin': 'admin',
  '/teacher': 'teacher',
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const requiredRole = Object.entries(PROTECTED_ROUTES).find(([path]) =>
    pathname.startsWith(path)
  )?.[1]

  if (!requiredRole) return NextResponse.next()

  const token = req.cookies.get('session')?.value
  const session = token ? await verifySession(token) : null

  if (!session || session.role !== requiredRole) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*'],
}
