import { NextResponse } from 'next/server'

export async function GET() {
  const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login`)
  res.cookies.set('session', '', { maxAge: 0, path: '/' })
  return res
}
