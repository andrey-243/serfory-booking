import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifySession } from '@/lib/session'
import { createPremadeSessionEvent } from '@/lib/google-calendar'
import { createZoomMeeting } from '@/lib/zoom'
import { checkTeacherConflicts } from '@/lib/schedule'

const VALID_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Math', 'Kyrgyz', 'Chemistry', 'Physics']

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
    return new Date(`${dateStr}T${timeStr}:00Z`).toISOString()
  }
}

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

  type EnrolledStudent = { status: string; applications: { id: string; name: string; email: string; phone: string; telegram_username: string | null; telegram_chat_id: number | null; contact_pref: string } | null }
  type RawBatch = Record<string, unknown> & {
    premade_sessions: { session_date: string; [k: string]: unknown }[]
    premade_enrollments: EnrolledStudent[]
    teachers?: { name: string; teaching_languages: string[] | null } | null
  }

  if (all) {
    const { data, error } = await supabase
      .from('premade_batches')
      .select('*, premade_sessions(*), premade_enrollments(id, status, applications(id, name, email, phone, telegram_username, telegram_chat_id, contact_pref)), teachers(name, teaching_languages)')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
    const batches = ((data || []) as unknown as RawBatch[]).map(b => {
      const activeEnrollments = (b.premade_enrollments || []).filter(e => e.status === 'active')
      return {
        ...b,
        premade_sessions: (b.premade_sessions || []).sort((a, c) => a.session_date.localeCompare(c.session_date)),
        enrollment_count: activeEnrollments.length,
        enrolled_students: activeEnrollments.map(e => e.applications).filter(Boolean),
        premade_enrollments: undefined,
      }
    })
    return NextResponse.json({ batches })
  }

  let query = supabase
    .from('premade_batches')
    .select('*, premade_sessions(*), premade_enrollments(id, status, applications(id, name, email, phone, telegram_username, contact_pref))')
    .order('created_at', { ascending: false })

  if (teacherId) query = query.eq('teacher_id', teacherId)
  if (subject) query = query.eq('subject', subject).eq('status', 'active')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })

  const batches = ((data || []) as unknown as RawBatch[]).map(b => {
    const activeEnrollments = (b.premade_enrollments || []).filter(e => e.status === 'active')
    return {
      ...b,
      premade_sessions: (b.premade_sessions || []).sort((a, c) => a.session_date.localeCompare(c.session_date)),
      enrollment_count: activeEnrollments.length,
      enrolled_students: activeEnrollments.map(e => e.applications).filter(Boolean),
      premade_enrollments: undefined,
    }
  })

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
  const { teacher_id, name, subject, teaching_language, target_levels = [], duration_min = 60, sessions, timezone = 'UTC' } = body

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
  const sessionNames = sessions.map((s: { name: string }) => s.name.trim().toLowerCase())
  if (new Set(sessionNames).size !== sessionNames.length) {
    return NextResponse.json({ error: 'Session names must be unique within a batch' }, { status: 400 })
  }
  const sessionSlots = sessions.map((s: { session_date: string; start_time: string }) => `${s.session_date}T${s.start_time}`)
  if (new Set(sessionSlots).size !== sessionSlots.length) {
    return NextResponse.json({ error: 'Two sessions cannot have the same date and time' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  // Auto-complete active batches where all sessions are in the past
  const { data: activeBatches } = await supabase
    .from('premade_batches')
    .select('id, premade_sessions(session_date, start_time, session_start_utc)')
    .eq('teacher_id', teacher_id)
    .eq('subject', subject)
    .eq('status', 'active')

  const now = new Date()
  for (const b of activeBatches ?? []) {
    const sessions = (b as { id: string; premade_sessions: { session_date: string; start_time: string; session_start_utc: string | null }[] }).premade_sessions ?? []
    const allPast = sessions.length > 0 && sessions.every(s => {
      const d = s.session_start_utc ? new Date(s.session_start_utc) : new Date(`${s.session_date}T${s.start_time}`)
      return d < now
    })
    if (allPast) {
      await supabase.from('premade_batches').update({ status: 'completed' }).eq('id', b.id)
    }
  }

  // Max 2 active premade batches per teacher per subject (after auto-complete)
  const { count: activePremadeCount } = await supabase
    .from('premade_batches')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacher_id)
    .eq('subject', subject)
    .eq('status', 'active')

  if ((activePremadeCount ?? 0) >= 2) {
    return NextResponse.json({ error: 'Max 2 active premade courses per subject reached' }, { status: 422 })
  }

  // Reject duplicate: same course name (case-insensitive) + same lang + same level
  const { data: sameNameBatches } = await supabase
    .from('premade_batches')
    .select('id, teaching_language, target_levels')
    .eq('teacher_id', teacher_id)
    .eq('subject', subject)
    .eq('status', 'active')
    .ilike('name', name.trim())

  const newLevels = [...(target_levels ?? [])].sort().join(',')
  const isDuplicate = (sameNameBatches ?? []).some(b => {
    if (b.teaching_language !== teaching_language) return false
    return [...((b.target_levels as string[]) ?? [])].sort().join(',') === newLevels
  })

  if (isDuplicate) {
    return NextResponse.json({ error: 'A course with the same name, language and level already exists' }, { status: 422 })
  }

  // Check for schedule conflicts before creating anything
  const tentativeSessions = (sessions as { session_date: string; start_time: string }[]).map(s => ({
    startUtc: localToUtc(s.session_date, s.start_time.slice(0, 5), timezone),
    durationMin: duration_min as number,
  }))
  const scheduleConflicts = await checkTeacherConflicts(supabase, teacher_id, tentativeSessions)
  if (scheduleConflicts.length > 0) {
    return NextResponse.json({ error: 'Schedule conflict', conflicts: scheduleConflicts }, { status: 422 })
  }

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
    session_start_utc: localToUtc(s.session_date, s.start_time.slice(0, 5), timezone),
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
    .select('google_refresh_token, google_calendar_id, name, email')
    .eq('id', teacher_id)
    .single()

  for (const s of createdSessions || []) {
    try {
      const sessionStartUtc = s.session_start_utc ?? localToUtc(s.session_date, s.start_time.slice(0, 5), timezone)

      const zoomLink = await createZoomMeeting(
        `${name}: ${s.name} · Serfory`,
        sessionStartUtc,
        duration_min,
        teacher?.email ?? undefined
      )

      const eventId = teacher?.google_refresh_token
        ? await createPremadeSessionEvent(
            teacher.google_refresh_token,
            teacher.google_calendar_id || 'primary',
            {
              batchName: name,
              sessionName: s.name,
              subject,
              teacherName: teacher.name,
              sessionStartUtc,
              durationMinutes: duration_min,
              zoomLink,
            }
          )
        : null

      const updates: Record<string, string | null> = {}
      if (zoomLink) updates.zoom_link = zoomLink
      if (eventId) updates.gcal_event_id = eventId
      if (Object.keys(updates).length > 0) {
        await supabase.from('premade_sessions').update(updates).eq('id', s.id)
      }
    } catch {
      // Non-blocking
    }
  }

  // TG admin notif (fire-and-forget)
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId) {
    const teacherName = teacher?.name ?? teacher_id
    const sessionLines = (createdSessions || [])
      .map((s: { name: string; session_date: string; start_time: string }, i: number) => {
        const d = new Date(s.session_date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
        return `  ${i + 1}. ${s.name}: ${d} ${s.start_time.slice(0, 5)}`
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
