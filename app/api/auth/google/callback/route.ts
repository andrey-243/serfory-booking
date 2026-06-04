import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-calendar'
import { getSupabaseAdmin } from '@/lib/supabase'
import { signSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=invalid_callback`)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.id_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=no_id_token`)
    }

    const userInfo = await getGoogleUserInfo(tokens.access_token!)
    const email = userInfo.email

    // Vérifie si admin
    const { data: admin } = await getSupabaseAdmin()
      .from('admins')
      .select('email')
      .eq('email', email)
      .single()

    // Vérifie si teacher
    const { data: teacher } = await getSupabaseAdmin()
      .from('teachers')
      .select('id, name')
      .eq('email', email)
      .single()

    if (!admin && !teacher) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=unauthorized`)
    }

    const role = admin ? 'admin' : 'teacher'

    // Stocke le refresh_token pour les teachers
    if (teacher && tokens.refresh_token) {
      await getSupabaseAdmin()
        .from('teachers')
        .update({ google_refresh_token: tokens.refresh_token })
        .eq('email', email)
    }

    const session = await signSession({
      email,
      role,
      teacherId: teacher?.id ?? null,
      name: teacher?.name ?? email,
    })

    const redirectUrl = role === 'admin'
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/teacher`

    const res = NextResponse.redirect(redirectUrl)
    res.cookies.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    })

    return res
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=oauth_failed`)
  }
}
