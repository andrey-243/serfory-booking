import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isTelegramEligible, sendLessonCancelledEmail, lessonCancelledTgText } from '@/lib/email'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://booking.serfory.eu'

async function notifyAdminCancelled(teacherName: string, booking: { student_name: string; subject: string; slot_start: string }) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  const bot = process.env.TELEGRAM_BOT_TOKEN
  if (!adminChatId || !bot) return
  const date = new Date(booking.slot_start).toLocaleString('en-GB', {
    timeZone: 'Europe/Tallinn',
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
  await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: adminChatId,
      text: `🗑 Booking auto-cancelled\n\nTeacher deleted the GCal event.\n👤 ${booking.student_name} | ${booking.subject}\n📅 ${date}\n👩‍🏫 ${teacherName}`,
    }),
  }).catch(() => {})
}

async function notifyStudentCancelled(
  booking: { student_name: string; student_email: string; subject: string; slot_start: string; invoice_id: string | null },
  teacherName: string,
) {
  if (!booking.invoice_id) return

  const supabase = getSupabaseAdmin()

  // Fetch invoice to get booking_token and application_id
  const { data: invoice } = await supabase
    .from('invoices')
    .select('booking_token, application_id')
    .eq('id', booking.invoice_id)
    .single()

  if (!invoice?.booking_token) return

  // Fetch application for lang + TG info
  const { data: app } = await supabase
    .from('applications')
    .select('id, communication_lang, learning_lang, country_code, telegram_chat_id')
    .eq('id', invoice.application_id)
    .single()

  if (!app) return

  const lang = (['en', 'et', 'ru'].includes(app.communication_lang ?? '') ? app.communication_lang : 'en') as 'en' | 'et' | 'ru'
  const link = `${BASE_URL}/booking?session=${invoice.booking_token}`
  const date = new Date(booking.slot_start).toLocaleString(
    lang === 'et' ? 'et-EE' : lang === 'ru' ? 'ru-RU' : 'en-GB',
    { timeZone: 'Europe/Tallinn', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
  )

  const bot = process.env.TELEGRAM_BOT_TOKEN
  if (bot && app.telegram_chat_id && isTelegramEligible(app.country_code, app.learning_lang)) {
    await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: app.telegram_chat_id,
        text: lessonCancelledTgText(lang, teacherName, booking.subject, date, link),
      }),
    }).catch(() => {})
  }

  await sendLessonCancelledEmail({
    to: booking.student_email,
    name: booking.student_name,
    teacher: teacherName,
    subject: booking.subject,
    date,
    link,
    lang,
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  const channelId = req.headers.get('x-goog-channel-id')
  const resourceState = req.headers.get('x-goog-resource-state')

  if (!channelId || resourceState === 'sync') {
    return NextResponse.json({ ok: true })
  }

  const { data: teacher } = await getSupabaseAdmin()
    .from('teachers')
    .select('id, name, email, google_refresh_token, google_calendar_id')
    .eq('calendar_channel_id', channelId)
    .single()

  if (!teacher?.google_refresh_token) {
    return NextResponse.json({ ok: true })
  }

  const { data: bookings } = await getSupabaseAdmin()
    .from('bookings')
    .select('id, google_event_id, student_email, student_name, subject, slot_start, student_status, status, invoice_id')
    .eq('teacher_id', teacher.id)
    .not('google_event_id', 'is', null)
    .in('status', ['active'])

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

      // GCal soft-delete: event still exists but marked cancelled (trash, ~30 day window)
      if (res.data.status === 'cancelled') {
        await getSupabaseAdmin().from('bookings').update({ status: 'cancelled', cancelled_by: 'teacher' }).eq('id', booking.id)
        await Promise.all([
          notifyAdminCancelled(teacher.name, booking),
          notifyStudentCancelled(booking, teacher.name),
        ])
        continue
      }

      const attendees = res.data.attendees || []

      const studentAttendee = attendees.find(
        a => a.email?.toLowerCase() === booking.student_email.toLowerCase()
      )
      const studentStatus = studentAttendee?.responseStatus === 'accepted' ? 'confirmed'
        : studentAttendee?.responseStatus === 'declined' ? 'cancelled'
        : 'pending'

      if (studentStatus !== booking.student_status) {
        if (studentStatus === 'cancelled') {
          // Student declined GCal invite → cancel the booking
          await getSupabaseAdmin()
            .from('bookings')
            .update({ student_status: 'cancelled', status: 'cancelled', cancelled_by: 'student' })
            .eq('id', booking.id)
          await Promise.all([
            notifyAdminCancelled(teacher.name, booking),
            notifyStudentCancelled(booking, teacher.name),
          ])
        } else {
          await getSupabaseAdmin()
            .from('bookings')
            .update({ student_status: studentStatus })
            .eq('id', booking.id)
        }
      }
    } catch (err: unknown) {
      // Hard delete: event purged (404) or gone (410)
      const code = Number((err as { code?: number | string })?.code)
        || Number((err as { status?: number })?.status)
      if (code === 404 || code === 410) {
        await getSupabaseAdmin().from('bookings').update({ status: 'cancelled', cancelled_by: 'teacher' }).eq('id', booking.id)
        await Promise.all([
          notifyAdminCancelled(teacher.name, booking),
          notifyStudentCancelled(booking, teacher.name),
        ])
      }
    }
  }

  return NextResponse.json({ ok: true })
}
