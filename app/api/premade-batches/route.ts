import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifySession } from '@/lib/session'
import { createPremadeSessionEvent } from '@/lib/google-calendar'

const VALID_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Math', 'Kyrgyz', 'Chemistry', 'Physics']

// GET /api/premade-batches?teacherId=<id>  → teacher dashboard
// GET /api/premade-batches?subject=<s>     → student booking (active only)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const teacherId = searchParams.get('teacherId')
  const subject = searchParams.get('subject')

  if (!teacherId && !subject) {
    return NextResponse.json({ error: 'teacherId or subject required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('premade_batches')
    .select('*, premade_sessions(*), premade_enrollments(id, status)')
    .order('created_at', { ascending: false })

  if (teacherId) query = query.eq('teacher_id', teacherId)
  if (subject) query = query.eq('subject', subject).eq('status', 'active')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })

  const batches = (data || []).map(b => ({
    ...b,
    premade_sessions: (b.premade_sessions || []).sort(
      (a: { session_date: string }, b: { session_date: string }) => a.session_date.localeCompare(b.session_date)
    ),
    enrollment_count: (b.premade_enrollments || []).filter((e: { status: string }) => e.status === 'active').length,
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
  const { teacher_id, name, subject, target_levels = [], duration_min = 60, sessions } = body

  if (!teacher_id || !name || !subject || !sessions?.length) {
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
    .insert({ teacher_id, name, subject, target_levels, duration_min, max_students: 6, status: 'active' })
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

  return NextResponse.json({ batch: { ...batch, sessions: createdSessions } }, { status: 201 })
}
