import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google-calendar'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const teacherEmail = searchParams.get('state')

  if (!code || !teacherEmail) {
    return NextResponse.json({ error: 'Invalid callback' }, { status: 400 })
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.refresh_token) {
      return NextResponse.json(
        { error: 'No refresh_token received — make sure OAuth prompt is set to consent' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('teachers')
      .update({ google_refresh_token: tokens.refresh_token })
      .eq('email', teacherEmail)

    if (error) {
      return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/teacher?connected=true`)
  } catch {
    return NextResponse.json({ error: 'OAuth exchange failed' }, { status: 500 })
  }
}
