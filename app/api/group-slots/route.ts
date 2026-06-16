import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifySession } from '@/lib/session'
import { createGroupSessionEvent } from '@/lib/google-calendar'

const VALID_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Math', 'Kyrgyz']
const MAX_FUTURE_BATCHES = 5

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Convert a local date+time in the given IANA timezone to a UTC ISO string.
function localToUtc(dateStr: string, timeStr: string, tz: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hour, minute] = timeStr.split(':').map(Number)
    const refUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0)
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
    const parts = formatter.formatToParts(new Date(refUtcMs))
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'
    const tzH = get('hour') === '24' ? 0 : Number(get('hour'))
    const tzMs = Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day')), tzH, Number(get('minute')), 0)
    return new Date(refUtcMs - (tzMs - refUtcMs)).toISOString()
  } catch {
    // Fallback: treat as UTC (unknown timezone)
    return new Date(`${dateStr}T${timeStr}:00Z`).toISOString()
  }
}

// GET /api/group-slots
// ?all=true                     → admin view (all batches, teacher info joined)
// ?teacherId=<id>&subject=<s>  → teacher dashboard (their batches)
// ?subject=<s>                 → student booking (active batches with enrollment count)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const teacherId = searchParams.get('teacherId')
  const subject = searchParams.get('subject')
  const all = searchParams.get('all') === 'true'

  if (!subject && !teacherId && !all) {
    return NextResponse.json({ error: 'subject or teacherId required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  type EnrolledStudent = { status: string; applications: { id: string; name: string; email: string; phone: string; telegram_username: string | null; telegram_chat_id: number | null; contact_pref: string } | null }
  type RawBatch = Record<string, unknown> & {
    group_slot_sessions: { session_date: string; [k: string]: unknown }[]
    group_slot_enrollments: EnrolledStudent[]
    teachers?: { name: string; teaching_languages: string[] | null } | null
  }

  let baseQuery = supabase
    .from('group_slot_batches')
    .select('*, group_slot_sessions(*), group_slot_enrollments(id, status)')
    .order('start_date', { ascending: true })

  if (teacherId) baseQuery = baseQuery.eq('teacher_id', teacherId)
  if (subject) baseQuery = baseQuery.eq('subject', subject)
  if (!teacherId && !all) {
    const today = toDateStr(new Date())
    baseQuery = baseQuery.eq('status', 'active').gte('start_date', today)
  }
  if (teacherId && !all) {
    baseQuery = baseQuery.neq('status', 'prelock')
  }

  if (all) {
    const { data, error } = await supabase
      .from('group_slot_batches')
      .select('*, group_slot_sessions(*), group_slot_enrollments(id, status, applications(id, name, email, phone, telegram_username, telegram_chat_id, contact_pref)), teachers(name, teaching_languages)')
      .order('start_date', { ascending: true })
    if (error) return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
    const batches = ((data || []) as unknown as RawBatch[]).map(b => {
      const activeEnrollments = (b.group_slot_enrollments || []).filter(e => e.status === 'active')
      return {
        ...b,
        group_slot_sessions: (b.group_slot_sessions || []).sort(
          (a, c) => a.session_date.localeCompare(c.session_date)
        ),
        enrollment_count: activeEnrollments.length,
        enrolled_students: activeEnrollments.map(e => e.applications).filter(Boolean),
        group_slot_enrollments: undefined,
      }
    })
    return NextResponse.json({ batches })
  }

  const { data, error } = await baseQuery
  if (error) return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })

  const batches = ((data || []) as unknown as RawBatch[]).map(b => ({
    ...b,
    group_slot_sessions: (b.group_slot_sessions || []).sort(
      (a, c) => a.session_date.localeCompare(c.session_date)
    ),
    enrollment_count: (b.group_slot_enrollments || []).filter(e => e.status === 'active').length,
    group_slot_enrollments: undefined,
  }))

  return NextResponse.json({ batches })
}

// POST /api/group-slots
// Body: { teacher_id, subject, teaching_language, target_levels, start_date (YYYY-MM-DD), start_time (HH:MM), duration_minutes?, max_students? }
// Auth: teacher session required
export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get('session')?.value ?? '')
  if (!session || session.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { teacher_id, subject, teaching_language, target_levels, start_date, start_time, duration_minutes = 60, max_students = 6, timezone = 'UTC' } = body

  if (!teacher_id || !subject || !start_date || !start_time || !teaching_language || !target_levels?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (session.teacherId !== teacher_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!VALID_SUBJECTS.includes(subject)) {
    return NextResponse.json({ error: 'Invalid subject' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const today = toDateStr(new Date())

  // Auto-complete active batches where all sessions are in the past
  const { data: activeGroupBatches } = await supabase
    .from('group_slot_batches')
    .select('id, group_slot_sessions(session_date)')
    .eq('teacher_id', teacher_id)
    .eq('subject', subject)
    .eq('status', 'active')

  for (const b of activeGroupBatches ?? []) {
    const sessions = (b as { id: string; group_slot_sessions: { session_date: string }[] }).group_slot_sessions ?? []
    if (sessions.length > 0 && sessions.every(s => s.session_date < today)) {
      await supabase.from('group_slot_batches').update({ status: 'completed' }).eq('id', b.id)
    }
  }

  // Count all active batches (after auto-complete) — no start_date filter: batches created in the past but still running count
  const { count } = await supabase
    .from('group_slot_batches')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacher_id)
    .eq('subject', subject)
    .eq('status', 'active')

  if ((count ?? 0) >= MAX_FUTURE_BATCHES) {
    return NextResponse.json({ error: 'Max 5 distinct active groups for this subject' }, { status: 422 })
  }

  // Reject duplicate slot (same teacher × subject × start_date × start_time)
  const { count: dupCount } = await supabase
    .from('group_slot_batches')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacher_id)
    .eq('subject', subject)
    .eq('start_date', start_date)
    .eq('start_time', start_time)
    .eq('status', 'active')

  if ((dupCount ?? 0) > 0) {
    return NextResponse.json({ error: 'A group session already exists for this subject at this date and time' }, { status: 422 })
  }

  // Parse start_date to get day_of_week
  const startDateObj = new Date(`${start_date}T12:00:00Z`)
  const day_of_week = startDateObj.getUTCDay()

  // Create batch
  const { data: batch, error: batchErr } = await supabase
    .from('group_slot_batches')
    .insert({ teacher_id, subject, teaching_language, target_levels, start_date, day_of_week, start_time, duration_minutes, max_students, status: 'active' })
    .select()
    .single()

  if (batchErr || !batch) {
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }

  // Create 4 sessions (+0, +7, +14, +21 days)
  const sessions = [0, 7, 14, 21].map(offset => {
    const d = new Date(startDateObj)
    d.setUTCDate(d.getUTCDate() + offset)
    const session_date = toDateStr(d)
    const session_start_utc = localToUtc(session_date, start_time.slice(0, 5), timezone)
    return { batch_id: batch.id, session_date, start_time, session_start_utc }
  })

  const { data: createdSessions, error: sessErr } = await supabase
    .from('group_slot_sessions')
    .insert(sessions)
    .select()

  if (sessErr) {
    // Rollback batch
    await supabase.from('group_slot_batches').delete().eq('id', batch.id)
    return NextResponse.json({ error: 'Failed to create sessions' }, { status: 500 })
  }

  // Create GCal events for each session (fire-and-forget per session, store gcal_event_id)
  const { data: teacher } = await supabase
    .from('teachers')
    .select('google_refresh_token, google_calendar_id, email, name')
    .eq('id', teacher_id)
    .single()

  if (teacher?.google_refresh_token) {
    for (const s of createdSessions || []) {
      try {
        const sessionStartUtc = s.session_start_utc ?? localToUtc(s.session_date, s.start_time.slice(0, 5), timezone)
        const eventId = await createGroupSessionEvent(
          teacher.google_refresh_token,
          teacher.google_calendar_id || 'primary',
          { subject, teacherName: teacher.name, sessionStartUtc, durationMinutes: duration_minutes, sessionId: s.id }
        )
        if (eventId) {
          await supabase.from('group_slot_sessions').update({ gcal_event_id: eventId }).eq('id', s.id)
        }
      } catch {
        // Non-blocking: session valid in DB even if GCal fails
      }
    }
  }

  // TG admin notif
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId) {
    const teacherName = teacher?.name ?? teacher_id
    const sessionLines = (createdSessions || [])
      .map((s: { session_date: string; start_time: string }, i: number) => {
        const d = new Date(s.session_date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
        return `  ${i + 1}. ${d} ${s.start_time.slice(0, 5)}`
      })
      .join('\n')
    const msg = [
      `👥 <b>New group course created</b>`,
      ``,
      `👩‍🏫 <b>${teacherName}</b>`,
      `📖 ${subject} · ${teaching_language?.toUpperCase() ?? '—'}`,
      `⏱ ${duration_minutes} min · max ${max_students} students`,
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

