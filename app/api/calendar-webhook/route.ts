import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const channelId = req.headers.get('x-goog-channel-id')
  const resourceState = req.headers.get('x-goog-resource-state')

  if (!channelId || resourceState === 'sync') {
    return NextResponse.json({ ok: true })
  }

  const { data: teacher } = await getSupabaseAdmin()
    .from('teachers')
    .select('id, email, google_refresh_token, google_calendar_id')
    .eq('calendar_channel_id', channelId)
    .single()

  if (!teacher?.google_refresh_token) {
    return NextResponse.json({ ok: true })
  }

  const { data: bookings } = await getSupabaseAdmin()
    .from('bookings')
    .select('id, google_event_id, student_email, student_response, status')
    .eq('teacher_id', teacher.id)
    .not('google_event_id', 'is', null)
    .in('status', ['pending', 'confirmed'])

  if (!bookings?.length) return NextResponse.json({ ok: true })

  const { google } = await import('googleapis')
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
  )
  client.setCredentials({ refresh_token: teacher.google_refresh_token })
  const calendar = google.calendar({ version: 'v3', auth: client })

  for (const booking of bookings) {
    try {
      const res = await calendar.events.get({
        calendarId: teacher.google_calendar_id || 'primary',
        eventId: booking.google_event_id,
      })

      const attendees = res.data.attendees || []

      // Sync statut booking depuis réponse du prof
      if (booking.status === 'pending') {
        const teacherAttendee = attendees.find(
          a => a.email?.toLowerCase() === teacher.email.toLowerCase()
        )
        if (teacherAttendee?.responseStatus === 'accepted') {
          await getSupabaseAdmin().from('bookings').update({ status: 'confirmed' }).eq('id', booking.id)
        } else if (teacherAttendee?.responseStatus === 'declined') {
          await getSupabaseAdmin().from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
        }
      }

      // Sync réponse student (informatif)
      const studentAttendee = attendees.find(
        a => a.email?.toLowerCase() === booking.student_email.toLowerCase()
      )
      const studentResponse = studentAttendee?.responseStatus === 'accepted' ? 'accepted'
        : studentAttendee?.responseStatus === 'declined' ? 'declined'
        : null

      if (studentResponse !== booking.student_response) {
        await getSupabaseAdmin()
          .from('bookings')
          .update({ student_response: studentResponse })
          .eq('id', booking.id)
      }
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code
      if (code === 404 || code === 410) {
        await getSupabaseAdmin().from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
