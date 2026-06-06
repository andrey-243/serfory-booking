import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getGoogleUserInfo, watchCalendar } from '@/lib/google-calendar'
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
    const googlePhotoUrl = userInfo.picture ?? null

    // Vérifie si admin
    const { data: admin } = await getSupabaseAdmin()
      .from('admins')
      .select('email')
      .eq('email', email)
      .single()

    // Vérifie si teacher
    const { data: teacher } = await getSupabaseAdmin()
      .from('teachers')
      .select('id, name, google_refresh_token, google_calendar_id, calendar_channel_id, calendar_channel_expiry')
      .eq('email', email)
      .single()

    if (!admin && !teacher) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=unauthorized`)
    }

    const role = admin ? 'admin' : 'teacher'

    // Stocke le refresh_token + setup webhook watch pour les teachers
    if (teacher) {
      const updates: Record<string, string> = {}
      if (tokens.refresh_token) updates.google_refresh_token = tokens.refresh_token
      if (googlePhotoUrl) updates.google_photo_url = googlePhotoUrl
      if (Object.keys(updates).length > 0) {
        await getSupabaseAdmin()
          .from('teachers')
          .update(updates)
          .eq('email', email)
      }

      // Setup ou renouvellement du canal webhook Google Calendar
      const refreshToken = tokens.refresh_token || teacher.google_refresh_token
      const channelExpiry = teacher.calendar_channel_expiry
        ? new Date(teacher.calendar_channel_expiry).getTime()
        : 0
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      const needsWatch = !teacher.calendar_channel_id || channelExpiry - Date.now() < sevenDaysMs

      if (refreshToken && needsWatch) {
        try {
          const channelId = crypto.randomUUID()
          const { expiration } = await watchCalendar(
            refreshToken,
            teacher.google_calendar_id || 'primary',
            channelId
          )
          await getSupabaseAdmin()
            .from('teachers')
            .update({
              calendar_channel_id: channelId,
              calendar_channel_expiry: new Date(expiration).toISOString(),
            })
            .eq('email', email)
        } catch (err) {
          console.error('[watch_calendar]', err)
        }
      }
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
  } catch (err) {
    console.error('[oauth_callback]', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=oauth_failed`)
  }
}
