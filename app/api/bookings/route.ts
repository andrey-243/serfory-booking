import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

const TIER_MULTIPLIERS: Record<string, number> = { eu: 1.30, us: 1.35, baltics: 1.00, cis: 0.60 }

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
    ref_token,
    invoice_id,
    telegram_username,
  } = body

  if (!teacher_id || !subject || !slot_start || !slot_end || !student_name || !student_email || !student_phone || !contact_pref) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: teacher } = await getSupabaseAdmin()
    .from('teachers')
    .select('name, email, google_refresh_token, google_calendar_id, price_per_hour')
    .eq('id', teacher_id)
    .single()

  let amount: number | null = null
  let tgUsername: string | null = telegram_username || null
  if (ref_token) {
    const { data: app } = await getSupabaseAdmin()
      .from('applications')
      .select('price_tier, telegram_username')
      .eq('ref_token', ref_token)
      .eq('status', 'accepted')
      .single()
    if (app?.price_tier && teacher?.price_per_hour) {
      const multiplier = TIER_MULTIPLIERS[app.price_tier] ?? 1.00
      amount = Math.round(teacher.price_per_hour * 1.22 * multiplier * 100) / 100
    }
    if (app?.telegram_username && !tgUsername) tgUsername = app.telegram_username
  }

  // Guard: check remaining lessons BEFORE creating the booking
  if (invoice_id) {
    const { data: inv } = await getSupabaseAdmin()
      .from('invoices')
      .select('lessons_count')
      .eq('id', invoice_id)
      .single()

    if (inv) {
      const { count } = await getSupabaseAdmin()
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('invoice_id', invoice_id)
        .neq('status', 'cancelled')

      if ((count ?? 0) >= inv.lessons_count) {
        return NextResponse.json({ error: 'No lessons remaining on this package' }, { status: 403 })
      }
    }
  }

  let google_event_id: string | null = null
  let meet_link: string | null = null

  if (teacher?.google_refresh_token) {
    try {
      const description = [
        `📚 ${subject} lesson · Serfory`,
        ``,
        `👤 ${student_name}`,
        `📱 ${student_phone} · ${student_email}`,
        ``,
        `👩‍🏫 ${teacher.name}`,
      ].join('\n')

      const result = await createCalendarEvent(
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
      )
      google_event_id = result?.id ?? null
      meet_link = result?.meetLink ?? null
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
      is_minor: false,
      parent_name: null,
      parent_contact: null,
      parent_email: null,
      parent_pref: null,
      telegram_username: tgUsername,
      google_event_id,
      meet_link,
      amount,
      ...(invoice_id ? { invoice_id } : {}),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }

  return NextResponse.json({ booking: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id, status, telegram_username } = await req.json()

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Field-only update (no status change)
  if (status === undefined) {
    const updates: Record<string, unknown> = {}
    if (telegram_username !== undefined) updates.telegram_username = telegram_username || null
    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })
    const { error } = await getSupabaseAdmin().from('bookings').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
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
