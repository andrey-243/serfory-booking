import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getAvailableSlots, getAvailableSlotsNoCalendar } from '@/lib/google-calendar'

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const teacherId = searchParams.get('teacherId')
  const weekStart = searchParams.get('weekStart')

  if (!teacherId || !weekStart) {
    return NextResponse.json({ error: 'teacherId and weekStart are required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('google_refresh_token, google_calendar_id, timezone')
    .eq('id', teacherId)
    .single()

  if (error || !teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const { data: availabilities } = await supabase
    .from('teacher_availability')
    .select('*')
    .eq('teacher_id', teacherId)

  const weekStartDate = new Date(weekStart)
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 7)
  const weekStartStr = toDateStr(weekStartDate)
  const weekEndStr = toDateStr(weekEndDate)

  // Fetch group sessions (active) in the week window
  const { data: groupSessions } = await supabase
    .from('group_slot_sessions')
    .select('session_date, start_time, session_start_utc, group_slot_batches!inner(teacher_id, status, duration_minutes)')
    .eq('group_slot_batches.teacher_id', teacherId)
    .eq('group_slot_batches.status', 'active')
    .gte('session_date', weekStartStr)
    .lt('session_date', weekEndStr)

  // Fetch premade sessions (active batches) in the week window
  const { data: premadeSessions } = await supabase
    .from('premade_sessions')
    .select('session_date, start_time, session_start_utc, premade_batches!inner(teacher_id, status, duration_min)')
    .eq('premade_batches.teacher_id', teacherId)
    .eq('premade_batches.status', 'active')
    .gte('session_date', weekStartStr)
    .lt('session_date', weekEndStr)

  // Build busy intervals from group + premade sessions
  type SessionRow = { session_date: string; start_time: string; session_start_utc: string | null }
  type GroupRow = SessionRow & { group_slot_batches: { duration_minutes: number } | null }
  type PremadeRow = SessionRow & { premade_batches: { duration_min: number } | null }

  const extraBusy: Array<{ start: number; end: number }> = []

  for (const s of ((groupSessions ?? []) as unknown as GroupRow[])) {
    const batch = s.group_slot_batches
    if (!batch) continue
    const durationMs = (batch.duration_minutes ?? 60) * 60 * 1000
    const startMs = s.session_start_utc
      ? new Date(s.session_start_utc).getTime()
      : (() => { const [h, m] = s.start_time.split(':').map(Number); const d = new Date(s.session_date + 'T00:00:00Z'); d.setUTCHours(h, m, 0, 0); return d.getTime() })()
    extraBusy.push({ start: startMs, end: startMs + durationMs })
  }

  for (const s of ((premadeSessions ?? []) as unknown as PremadeRow[])) {
    const batch = s.premade_batches
    if (!batch) continue
    const durationMs = (batch.duration_min ?? 60) * 60 * 1000
    const startMs = s.session_start_utc
      ? new Date(s.session_start_utc).getTime()
      : (() => { const [h, m] = s.start_time.split(':').map(Number); const d = new Date(s.session_date + 'T00:00:00Z'); d.setUTCHours(h, m, 0, 0); return d.getTime() })()
    extraBusy.push({ start: startMs, end: startMs + durationMs })
  }

  function filterBusy(slots: { start: string; end: string }[]) {
    if (extraBusy.length === 0) return slots
    return slots.filter(slot => {
      const s = new Date(slot.start).getTime()
      const e = new Date(slot.end).getTime()
      return !extraBusy.some(b => s < b.end && e > b.start)
    })
  }

  const tz = teacher.timezone ?? null

  if (!teacher.google_refresh_token) {
    const slots = getAvailableSlotsNoCalendar(weekStartDate, availabilities ?? [], tz)
    return NextResponse.json({ slots: filterBusy(slots) })
  }

  try {
    const slots = await getAvailableSlots(
      teacher.google_refresh_token,
      teacher.google_calendar_id || 'primary',
      weekStartDate,
      availabilities ?? [],
      tz
    )
    return NextResponse.json({ slots: filterBusy(slots) })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
  }
}
