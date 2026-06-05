import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createCalendarEvent } from '@/lib/google-calendar'

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
    parent_pref,
  } = body

  if (!teacher_id || !subject || !slot_start || !slot_end || !student_name || !student_email || !student_phone || !contact_pref) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: teacher } = await getSupabaseAdmin()
    .from('teachers')
    .select('name, google_refresh_token, google_calendar_id')
    .eq('id', teacher_id)
    .single()

  let google_event_id: string | null = null

  if (teacher?.google_refresh_token) {
    try {
      const description = [
        `Étudiant : ${student_name}`,
        `Email : ${student_email}`,
        `Tél : ${student_phone}`,
        `Contact : ${contact_pref}`,
        is_minor ? `Mineur — Parent : ${parent_name} (${parent_contact})` : null,
      ].filter(Boolean).join('\n')

      google_event_id = await createCalendarEvent(
        teacher.google_refresh_token,
        teacher.google_calendar_id || 'primary',
        {
          summary: `Cours ${subject} — ${student_name}`,
          start: slot_start,
          end: slot_end,
          description,
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
