import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const teacherEmail = searchParams.get('email')

  if (!teacherEmail) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const url = getAuthUrl(teacherEmail)
  return NextResponse.redirect(url)
}
