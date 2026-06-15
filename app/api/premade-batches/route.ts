import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifySession } from '@/lib/session'
import { createPremadeSessionEvent } from '@/lib/google-calendar'

const VALID_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Math', 'Kyrgyz', 'Chemistry', 'Physics']

// GET /api/premade-batches?all=true        → admin view (all batches, teacher info joined)
// GET /api/premade-batches?teacherId=<id>  → teacher dashboard
// GET /api/premade-batches?subject=<s>     → student booking (active only)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const teacherId = searchParams.get('teacherId')
  const subject = searchParams.get('subject')
  const all = searchParams.get('all') === 'true'

  if (!teacherId && !subject && !all) {
    return NextResponse.json({ error: 'teacherId or subject required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  type RawBatch = Record<string, unknown> & {
    premade_sessions: { session_date: string; [k: string]: unknown }[]
    premade_enrollments: { status: string }[]
    teachers?: { name: string; teaching_languages: string[] | null } | null
  }

  if (all) {
    const { data, error } = await supabase
      .from('premade_batches')
      .select('*, premade_sessions(*), premade_enrollments(id, status), teachers(name, teaching_languages)')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
    const batches = ((data || []) as unknown as RawBatch[]).map(b => ({
      ...b,
      premade_sessions: (b.premade_sessions || []).sort((a, c) => a.session_date.localeCompare(c.session_date)),
      enrollment_count: (b.premade_enrollments || []).filter(e => e.status === 'active').length,
      premade_enrollments: undefined,
    }))
    return NextResponse.json({ batches })
  }

  let query = supabase
    .from('premade_batches')
    .select('*, premade_sessions(*), premade_enrollments(id, status)')
    .order('created_at', { ascending: false })

  if (teacherId) query = query.eq('teacher_id', teacherId)
  if (subject) query = query.eq('subject', subject).eq('status', 'active')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })

  const batches = ((data || []) as unknown as RawBatch[]).map(b => ({
    ...b,
    premade_sessions: (b.premade_sessions || []).sort((a, c) => a.session_date.localeCompare(c.session_date)),
    enrollment_count: (b.premade_enrollments || []).filter(e => e.status === 'active').length,
    premade_enrollments: undefined,
  }))

  return NextResponse.json({ batches })
}

// POST /api/premade-batches
// Body: { teacher_id, name, subject, target_levels, duration_min, sessions: [{ name, session_date, start_time }] }
export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get('session')?.value ?? '')
  if (!session || session.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { teacher_id, name, subject, teaching_language, target_levels = [], duration_min = 60, sessions } = body

  if (!teacher_id || !name || !subject || !teaching_language || !sessions?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (session.teacherId !== teacher_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!VALID_SUBJECTS.includes(subject)) {
    return NextResponse.json({ error: 'Invalid subject' }, { status: 400 })
  }
  for (const s of sessions) {
    if (!s.name || !s.session_date || !s.start_time) {
      return NextResponse.json({ error: 'Each session needs name, session_date and start_time' }, { status: 400 })
    }
  }

  const supabase = getSupabaseAdmin()

  const { data: batch, error: batchErr } = await supabase
    .from('premade_batches')
    .insert({ teacher_id, name, subject, teaching_language, target_levels, duration_min, max_students: 6, status: 'active' })
    .select()
    .single()

  if (batchErr || !batch) {
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }

  const sessionRows = sessions.map((s: { name: string; session_date: string; start_time: string }) => ({
    batch_id: batch.id,
    name: s.name,
    session_date: s.session_date,
    start_time: s.start_time,
  }))

  const { data: createdSessions, error: sessErr } = await supabase
    .from('premade_sessions')
    .insert(sessionRows)
    .select()

  if (sessErr) {
    await supabase.from('premade_batches').delete().eq('id', batch.id)
    return NextResponse.json({ error: 'Failed to create sessions' }, { status: 500 })
  }

  // GCal events (fire-and-forget)
  const { data: teacher } = await supabase
    .from('teachers')
    .select('google_refresh_token, google_calendar_id, name')
    .eq('id', teacher_id)
    .single()

  if (teacher?.google_refresh_token) {
    for (const s of createdSessions || []) {
      try {
        const eventId = await createPremadeSessionEvent(
          teacher.google_refresh_token,
          teacher.google_calendar_id || 'primary',
          {
            batchName: name,
            sessionName: s.name,
            subject,
            teacherName: teacher.name,
            sessionDate: s.session_date,
            startTime: s.start_time,
            durationMinutes: duration_min,
            sessionId: s.id,
          }
        )
        if (eventId) {
          await supabase.from('premade_sessions').update({ gcal_event_id: eventId }).eq('id', s.id)
        }
      } catch {
        // Non-blocking
      }
    }
  }

  // TG admin notif (fire-and-forget)
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId) {
    const teacherName = teacher?.name ?? teacher_id
    const sessionLines = (createdSessions || [])
      .map((s: { name: string; session_date: string; start_time: string }, i: number) => {
        const d = new Date(s.session_date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
        return `  ${i + 1}. ${s.name} — ${d} ${s.start_time.slice(0, 5)}`
      })
      .join('\n')
    const msg = [
      `📚 <b>New premade course created</b>`,
      ``,
      `👩‍🏫 <b>${teacherName}</b>`,
      `📖 ${name} (${subject})`,
      `⏱ ${duration_min} min · max ${batch.max_students} students`,
      ``,
      `<b>Sessions:</b>`,
      sessionLines,
    ].join('\n')
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: adminChatId, text: msg, parse_mode: 'HTML' }),
    }).catch(() => {})
  }

  return NextResponse.json({ batch: { ...batch, sessions: createdSessions } }, { status: 201 })
}
