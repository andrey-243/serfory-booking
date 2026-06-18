import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/group-interest?teacherId=<id>
// Returns pending group interest requests grouped by (subject, teaching_language, level)
// filtered to the teacher's own subjects + teaching languages.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const teacherId = searchParams.get('teacherId')
  if (!teacherId) return NextResponse.json({ error: 'teacherId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('subjects, teaching_languages')
    .eq('id', teacherId)
    .single()

  if (!teacher) return NextResponse.json({ demands: [] })

  const subjects: string[] = teacher.subjects ?? []
  const teachingLangs: string[] = teacher.teaching_languages ?? []
  if (!subjects.length || !teachingLangs.length) return NextResponse.json({ demands: [] })

  const { data: interests } = await supabase
    .from('group_interests')
    .select('id, subject, teaching_language, level')
    .in('subject', subjects)
    .in('teaching_language', teachingLangs)
    .eq('status', 'pending')

  const groupMap = new Map<string, { subject: string; teaching_language: string; level: string; count: number }>()
  for (const i of interests ?? []) {
    const key = `${i.subject}||${i.teaching_language}||${i.level}`
    if (!groupMap.has(key)) {
      groupMap.set(key, { subject: i.subject, teaching_language: i.teaching_language, level: i.level, count: 0 })
    }
    groupMap.get(key)!.count++
  }

  return NextResponse.json({ demands: [...groupMap.values()] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, subject, teaching_language, level } = body

  if (!token || !subject || !teaching_language || !level) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: app } = await supabase
    .from('applications')
    .select('id, name, email, telegram_username, telegram_chat_id, country_code, learning_lang')
    .eq('ref_token', token)
    .single()

  if (!app) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  await supabase.from('group_interests').insert({
    application_id: app.id,
    subject,
    teaching_language,
    level,
  })

  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId) {
    const contact = app.telegram_username ? `@${app.telegram_username}` : app.email
    const msg = [
      `👥 <b>Group interest request</b>`,
      ``,
      `👤 <b>${app.name}</b>`,
      `📖 ${subject} · ${teaching_language.toUpperCase()} · ${level}`,
      `📬 ${contact}`,
    ].join('\n')
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: adminChatId, text: msg, parse_mode: 'HTML' }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
