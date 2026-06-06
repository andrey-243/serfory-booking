import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createCalendarEvent, deleteCalendarEvent, acceptCalendarEvent } from '@/lib/google-calendar'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    teacher_id,
    subject,
    slot_start,
    slot_end,
    student_name,
    student_email,
    student_phone,
    contact_pref,
    is_minor,
    parent_name,
    parent_contact,
    parent_email,
    parent_pref,
  } = body

  if (!teacher_id || !subject || !slot_start || !slot_end || !student_name || !student_email || !student_phone || !contact_pref) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: teacher } = await getSupabaseAdmin()
    .from('teachers')
    .select('name, email, google_refresh_token, google_calendar_id')
    .eq('id', teacher_id)
    .single()

  let google_event_id: string | null = null

  if (teacher?.google_refresh_token) {
    try {
      const description = `${subject} lesson · Serfory\nhttps://serfory.eu`

      google_event_id = await createCalendarEvent(
        teacher.google_refresh_token,
        teacher.google_calendar_id || 'primary',
        {
          summary: `${subject} — ${student_name}`,
          start: slot_start,
          end: slot_end,
          description,
          teacherEmail: teacher.email,
          studentEmail: student_email,
        }
      ) ?? null
    } catch {}
  }

  const { data, error } = await getSupabaseAdmin()
    .from('bookings')
    .insert({
      teacher_id,
      subject,
      slot_start,
      slot_end,
      student_name,
      student_email,
      student_phone,
      contact_pref,
      is_minor: is_minor ?? false,
      parent_name: is_minor ? parent_name : null,
      parent_contact: is_minor ? parent_contact : null,
      parent_email: is_minor ? (parent_email || null) : null,
      parent_pref: is_minor ? (parent_pref || null) : null,
      google_event_id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }

  return NextResponse.json({ booking: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id, status, fromTeacher } = await req.json()

  if (!id || !['pending', 'confirmed', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: booking } = await getSupabaseAdmin()
    .from('bookings')
    .select('google_event_id, teacher_id')
    .eq('id', id)
    .single()

  const { error } = await getSupabaseAdmin()
    .from('bookings')
    .update({ status })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }

  if (booking?.google_event_id) {
    try {
      const { data: teacher } = await getSupabaseAdmin()
        .from('teachers')
        .select('email, google_refresh_token, google_calendar_id')
        .eq('id', booking.teacher_id)
        .single()

      if (teacher?.google_refresh_token) {
        if (status === 'cancelled') {
          await deleteCalendarEvent(
            teacher.google_refresh_token,
            teacher.google_calendar_id || 'primary',
            booking.google_event_id
          )
        } else if (status === 'confirmed' && fromTeacher) {
          // Teacher confirme depuis son dashboard → marque son attendee comme accepted
          await acceptCalendarEvent(
            teacher.google_refresh_token,
            teacher.google_calendar_id || 'primary',
            booking.google_event_id,
            teacher.email
          )
        }
      }
    } catch {}
  }

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const teacherId = searchParams.get('teacherId')

  // BUG FIXÉ : query doit être réassigné sinon .eq() est appelé mais ignoré
  // (Supabase query builder est immutable — chaque méthode retourne une nouvelle instance)
  let query = getSupabaseAdmin()
    .from('bookings')
    .select('*, teachers(name)')
    .order('slot_start', { ascending: true })

  if (teacherId) {
    query = query.eq('teacher_id', teacherId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  return NextResponse.json({ bookings: data })
}
