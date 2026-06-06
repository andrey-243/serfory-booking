import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCalendarEventStatus } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: bookings, error } = await getSupabaseAdmin()
    .from('bookings')
    .select('id, google_event_id, teacher_id')
    .eq('status', 'pending')
    .not('google_event_id', 'is', null)

  if (error || !bookings) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  const teacherIds = [...new Set(bookings.map(b => b.teacher_id))]

  const { data: teachers } = await getSupabaseAdmin()
    .from('teachers')
    .select('id, email, google_refresh_token, google_calendar_id')
    .in('id', teacherIds)

  const teacherMap = Object.fromEntries((teachers || []).map(t => [t.id, t]))

  let confirmed = 0
  let cancelled = 0
  let skipped = 0

  for (const booking of bookings) {
    const teacher = teacherMap[booking.teacher_id]
    if (!teacher?.google_refresh_token || !teacher?.email) { skipped++; continue }

    try {
      const responseStatus = await getCalendarEventStatus(
        teacher.google_refresh_token,
        teacher.google_calendar_id || 'primary',
        booking.google_event_id,
        teacher.email
      )

      if (responseStatus === 'accepted') {
        await getSupabaseAdmin().from('bookings').update({ status: 'confirmed' }).eq('id', booking.id)
        confirmed++
      } else if (responseStatus === 'declined') {
        await getSupabaseAdmin().from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
        cancelled++
      } else {
        skipped++
      }
    } catch {
      skipped++
    }
  }

  return NextResponse.json({ confirmed, cancelled, skipped })
}
