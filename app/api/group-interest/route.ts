import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendGroupBatchOpenedEmail, isTelegramEligible } from '@/lib/email'

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
    .select('id, subject, teaching_language, level, application_id')
    .in('subject', subjects)
    .in('teaching_language', teachingLangs)
    .eq('status', 'pending')

  if (!interests?.length) return NextResponse.json({ demands: [] })

  // Auto-reconcile: if this teacher already has an active batch covering an interest,
  // mark it fulfilled and notify the student (handles batches created before the fulfillment logic).
  // Only match batches that have spots left AND have at least one future session.
  const { data: activeBatches } = await supabase
    .from('group_slot_batches')
    .select('id, subject, teaching_language, target_levels, max_students, group_slot_enrollments(id, status), group_slot_sessions(session_start_utc, session_date)')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')

  const { data: teacherRow } = await supabase
    .from('teachers')
    .select('name')
    .eq('id', teacherId)
    .single()
  const teacherName: string = teacherRow?.name ?? ''

  const BOOKING_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://booking.serfory.eu'
  const now = new Date()
  const toFulfill: string[] = []

  for (const interest of interests) {
    type BatchRow = {
      id: string
      subject: string
      teaching_language: string
      target_levels: string[]
      max_students: number
      group_slot_enrollments: { id: string; status: string }[]
      group_slot_sessions: { session_start_utc: string | null; session_date: string }[]
    }
    const coveringBatch = (activeBatches as unknown as BatchRow[] ?? []).find(b => {
      if (b.subject !== interest.subject) return false
      if (b.teaching_language !== interest.teaching_language) return false
      if (!(b.target_levels ?? []).includes(interest.level as string)) return false
      const activeEnrollments = (b.group_slot_enrollments ?? []).filter(e => e.status === 'active').length
      if (activeEnrollments >= b.max_students) return false
      const allSessionsFuture = (b.group_slot_sessions ?? []).length > 0 &&
        (b.group_slot_sessions ?? []).every(s => {
          const d = s.session_start_utc ? new Date(s.session_start_utc) : new Date(`${s.session_date}T00:00:00Z`)
          return d > now
        })
      return allSessionsFuture
    })
    if (!coveringBatch) continue

    toFulfill.push(interest.id as string)
    await supabase.from('group_interests').update({
      status: 'fulfilled',
      fulfilled_batch_id: (coveringBatch as { id: string }).id,
      fulfilled_by_name: teacherName,
    }).eq('id', interest.id)

    // Notify the student that a matching batch exists
    const { data: app } = await supabase
      .from('applications')
      .select('name, email, communication_lang, telegram_chat_id, country_code, learning_lang, ref_token')
      .eq('id', interest.application_id)
      .single()

    if (app?.email) {
      const batchSessions = ((coveringBatch as { group_slot_sessions: { session_start_utc: string | null; session_date: string }[] }).group_slot_sessions ?? [])
        .slice()
        .sort((a, b) => a.session_date.localeCompare(b.session_date))

      const sessionDateStrings = batchSessions.map(s => {
        const d = new Date(s.session_start_utc ?? `${s.session_date}T00:00:00Z`)
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false })
      })

      const commLang = (app as { communication_lang: string | null }).communication_lang
      const emailLang: 'en' | 'et' | 'ru' = ['en', 'et', 'ru'].includes(commLang ?? '') ? commLang as 'en' | 'et' | 'ru' : 'en'
      const packageLink = app.ref_token ? `${BOOKING_URL}/package?token=${app.ref_token}` : BOOKING_URL

      await sendGroupBatchOpenedEmail({
        to: app.email as string,
        name: app.name as string,
        teacherName,
        courseSubject: interest.subject as string,
        level: interest.level as string,
        teachingLang: interest.teaching_language as string,
        sessionDates: sessionDateStrings,
        packageLink,
        lang: emailLang,
      }).catch(() => {})

      if (app.telegram_chat_id && isTelegramEligible(app.country_code, app.learning_lang)) {
        const LANG_LABELS_TG: Record<string, string> = { en: 'English', ru: 'Russian', et: 'Estonian', ky: 'Kyrgyz' }
        const tgMsg = `🎉 A group ${interest.subject as string} course is available!\n\n👩‍🏫 ${teacherName}\n📖 ${interest.level as string} · ${LANG_LABELS_TG[interest.teaching_language as string] ?? interest.teaching_language}\n\nSessions:\n${sessionDateStrings.map((d, i) => `  ${i + 1}. ${d}`).join('\n')}\n\n${packageLink}`
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: app.telegram_chat_id, text: tgMsg }),
        }).catch(() => {})
      }
    }
  }

  const activeInterests = (interests ?? []).filter(i => !toFulfill.includes(i.id as string))

  const groupMap = new Map<string, { subject: string; teaching_language: string; level: string; count: number }>()
  for (const i of activeInterests) {
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
