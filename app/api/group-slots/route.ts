import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifySession } from '@/lib/session'
import { createGroupSessionEvent } from '@/lib/google-calendar'

const VALID_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Math', 'Kyrgyz']
const MAX_FUTURE_BATCHES = 3

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// GET /api/group-slots
// ?teacherId=<id>&subject=<s>  → teacher dashboard (their batches)
// ?subject=<s>                 → student booking (active batches with enrollment count)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const teacherId = searchParams.get('teacherId')
  const subject = searchParams.get('subject')

  if (!subject && !teacherId) {
    return NextResponse.json({ error: 'subject or teacherId required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('group_slot_batches')
    .select('*, group_slot_sessions(*), group_slot_enrollments(id, status)')
    .order('start_date', { ascending: true })

  if (teacherId) query = query.eq('teacher_id', teacherId)
  if (subject) query = query.eq('subject', subject)

  // Student view: only active batches with open spots, starting today or later
  if (!teacherId) {
    const today = toDateStr(new Date())
    query = query.eq('status', 'active').gte('start_date', today)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })

  // Attach enrollment counts (active only)
  const batches = (data || []).map(b => ({
    ...b,
    group_slot_sessions: b.group_slot_sessions || [],
    enrollment_count: (b.group_slot_enrollments || []).filter((e: { status: string }) => e.status === 'active').length,
    group_slot_enrollments: undefined,
  }))

  return NextResponse.json({ batches })
}

// POST /api/group-slots
// Body: { teacher_id, subject, start_date (YYYY-MM-DD), start_time (HH:MM), duration_minutes?, max_students? }
// Auth: teacher session required
export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get('session')?.value ?? '')
  if (!session || session.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { teacher_id, subject, start_date, start_time, duration_minutes = 60, max_students = 6 } = body

  if (!teacher_id || !subject || !start_date || !start_time) {
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

  // Check max 3 future batches for this teacher/subject
  const { count } = await supabase
    .from('group_slot_batches')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacher_id)
    .eq('subject', subject)
    .in('status', ['active', 'prelock'])
    .gte('start_date', today)

  if ((count ?? 0) >= MAX_FUTURE_BATCHES) {
    return NextResponse.json({ error: 'Max 3 future batches reached for this subject' }, { status: 422 })
  }

  // Parse start_date to get day_of_week
  const startDateObj = new Date(`${start_date}T12:00:00Z`)
  const day_of_week = startDateObj.getUTCDay()

  // Create batch
  const { data: batch, error: batchErr } = await supabase
    .from('group_slot_batches')
    .insert({ teacher_id, subject, start_date, day_of_week, start_time, duration_minutes, max_students, status: 'active' })
    .select()
    .single()

  if (batchErr || !batch) {
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }

  // Create 4 sessions (+0, +7, +14, +21 days)
  const sessions = [0, 7, 14, 21].map(offset => {
    const d = new Date(startDateObj)
    d.setUTCDate(d.getUTCDate() + offset)
    return { batch_id: batch.id, session_date: toDateStr(d), start_time }
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
        const eventId = await createGroupSessionEvent(
          teacher.google_refresh_token,
          teacher.google_calendar_id || 'primary',
          { subject, teacherName: teacher.name, sessionDate: s.session_date, startTime: s.start_time, durationMinutes: duration_minutes, sessionId: s.id }
        )
        if (eventId) {
          await supabase.from('group_slot_sessions').update({ gcal_event_id: eventId }).eq('id', s.id)
        }
      } catch {
        // Non-blocking: session valid in DB even if GCal fails
      }
    }
  }

  // Auto-prelock M+1 (start_date+28j) and M+2 (start_date+56j) if no batch exists in those windows
  const batchStartObj = new Date(`${start_date}T12:00:00Z`)
  for (const offset of [28, 56]) {
    const windowStartObj = new Date(batchStartObj)
    windowStartObj.setUTCDate(windowStartObj.getUTCDate() + offset)
    const windowStartStr = toDateStr(windowStartObj)
    const windowEndObj = new Date(windowStartObj)
    windowEndObj.setUTCDate(windowEndObj.getUTCDate() + 27)

    const { count: existing } = await supabase
      .from('group_slot_batches')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacher_id)
      .eq('subject', subject)
      .in('status', ['active', 'prelock'])
      .gte('start_date', windowStartStr)
      .lte('start_date', toDateStr(windowEndObj))

    if ((existing ?? 0) === 0) {
      const { data: prelockBatch } = await supabase
        .from('group_slot_batches')
        .insert({
          teacher_id,
          subject,
          start_date: windowStartStr,
          day_of_week,
          start_time,
          duration_minutes,
          max_students,
          status: 'prelock',
        })
        .select()
        .single()

      if (prelockBatch) {
        const prelockSessions = [0, 7, 14, 21].map(off => {
          const d = new Date(windowStartObj)
          d.setUTCDate(d.getUTCDate() + off)
          return { batch_id: prelockBatch.id, session_date: toDateStr(d), start_time }
        })
        await supabase.from('group_slot_sessions').insert(prelockSessions)
      }
    }
  }

  return NextResponse.json({ batch: { ...batch, sessions: createdSessions } }, { status: 201 })
}

// PATCH /api/group-slots
// Body: { id, start_date?, start_time?, activate? }
// Allows teacher to edit date/time of a prelock batch and optionally activate it (creates GCal events)
export async function PATCH(req: NextRequest) {
  const session = await verifySession(req.cookies.get('session')?.value ?? '')
  if (!session || session.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, start_date, start_time, activate } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  const { data: batch, error: fetchErr } = await supabase
    .from('group_slot_batches')
    .select('*, group_slot_sessions(*)')
    .eq('id', id)
    .single()

  if (fetchErr || !batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  if (batch.teacher_id !== session.teacherId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (batch.status !== 'prelock') return NextResponse.json({ error: 'Only prelock batches can be edited' }, { status: 422 })

  const newStartDate = start_date ?? batch.start_date
  const newStartTime = start_time ?? batch.start_time

  // Recompute sessions if start_date or start_time changed
  const dateChanged = newStartDate !== batch.start_date || newStartTime !== batch.start_time
  if (dateChanged) {
    const startDateObj = new Date(`${newStartDate}T12:00:00Z`)
    const day_of_week = startDateObj.getUTCDay()

    await supabase.from('group_slot_batches')
      .update({ start_date: newStartDate, start_time: newStartTime, day_of_week })
      .eq('id', id)

    // Rebuild 4 sessions
    await supabase.from('group_slot_sessions').delete().eq('batch_id', id)
    const newSessions = [0, 7, 14, 21].map(offset => {
      const d = new Date(startDateObj)
      d.setUTCDate(d.getUTCDate() + offset)
      return { batch_id: id, session_date: toDateStr(d), start_time: newStartTime }
    })
    await supabase.from('group_slot_sessions').insert(newSessions)
  }

  if (!activate) return NextResponse.json({ ok: true })

  // Activate: status → active, create GCal events
  await supabase.from('group_slot_batches').update({ status: 'active' }).eq('id', id)

  const { data: sessions } = await supabase
    .from('group_slot_sessions')
    .select('*')
    .eq('batch_id', id)

  const { data: teacher } = await supabase
    .from('teachers')
    .select('google_refresh_token, google_calendar_id, name')
    .eq('id', batch.teacher_id)
    .single()

  if (teacher?.google_refresh_token && sessions) {
    for (const s of sessions) {
      try {
        const eventId = await createGroupSessionEvent(
          teacher.google_refresh_token,
          teacher.google_calendar_id || 'primary',
          {
            subject: batch.subject,
            teacherName: teacher.name,
            sessionDate: s.session_date,
            startTime: s.start_time,
            durationMinutes: batch.duration_minutes,
            sessionId: s.id,
          }
        )
        if (eventId) await supabase.from('group_slot_sessions').update({ gcal_event_id: eventId }).eq('id', s.id)
      } catch {
        // Non-blocking
      }
    }
  }

  return NextResponse.json({ ok: true })
}
