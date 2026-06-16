import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { addAttendeeToEvent } from '@/lib/google-calendar'

// POST /api/premade-batches/enroll
// Body: { batch_id, application_id, invoice_id }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { batch_id, application_id, invoice_id } = body

  if (!batch_id || !application_id || !invoice_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Check batch exists and has open spots
  const { data: batch } = await supabase
    .from('premade_batches')
    .select('id, name, subject, max_students, status, teacher_id, premade_sessions(id, gcal_event_id), premade_enrollments(id, status)')
    .eq('id', batch_id)
    .single()

  if (!batch || batch.status !== 'active') {
    return NextResponse.json({ error: 'Batch not available' }, { status: 422 })
  }

  const activeEnrollments = (batch.premade_enrollments || []).filter((e: { status: string }) => e.status === 'active').length
  if (activeEnrollments >= batch.max_students) {
    return NextResponse.json({ error: 'Batch is full' }, { status: 422 })
  }

  // Check invoice not already used for a premade enrollment
  const { count: invoiceUsed } = await supabase
    .from('premade_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('invoice_id', invoice_id)
    .eq('status', 'active')

  if ((invoiceUsed ?? 0) > 0) {
    return NextResponse.json({ error: 'Already enrolled via this invoice' }, { status: 422 })
  }

  // Check not already enrolled in this batch
  const { data: existing } = await supabase
    .from('premade_enrollments')
    .select('id')
    .eq('batch_id', batch_id)
    .eq('application_id', application_id)
    .eq('status', 'active')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already enrolled' }, { status: 409 })
  }

  // Create enrollment
  const { data: enrollment, error: enrollErr } = await supabase
    .from('premade_enrollments')
    .insert({ batch_id, application_id, invoice_id: invoice_id || null, gcal_synced: false })
    .select()
    .single()

  if (enrollErr || !enrollment) {
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
  }

  // Add student as GCal attendee on all sessions (fire-and-forget)
  const { data: application } = await supabase
    .from('applications')
    .select('name, email')
    .eq('id', application_id)
    .single()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('google_refresh_token, google_calendar_id')
    .eq('id', batch.teacher_id)
    .single()

  if (application?.email && teacher?.google_refresh_token) {
    let allSynced = true
    let lastError: string | null = null

    for (const s of (batch.premade_sessions || []) as { id: string; gcal_event_id: string | null }[]) {
      if (!s.gcal_event_id) { allSynced = false; continue }
      try {
        await addAttendeeToEvent(teacher.google_refresh_token, teacher.google_calendar_id || 'primary', s.gcal_event_id, application.email)
      } catch (e) {
        allSynced = false
        lastError = e instanceof Error ? e.message : 'GCal error'
      }
    }

    if (allSynced) {
      await supabase.from('premade_enrollments').update({ gcal_synced: true }).eq('id', enrollment.id)
    } else if (lastError) {
      await supabase.from('premade_enrollments').update({ gcal_last_error: lastError, gcal_sync_attempts: 1 }).eq('id', enrollment.id)
    }
  }

  // Invalidate booking_token - premade enrollment uses all lessons at once
  await supabase.from('invoices').update({ booking_token: null }).eq('id', invoice_id)

  // TG admin notif
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId && application?.name) {
    const batchMeta = batch as { name?: string; subject?: string }
    const msg = `📖 <b>Premade enrollment</b>\n\n👤 <b>${application.name}</b>\n📚 ${batchMeta.subject ?? ''} · ${batchMeta.name ?? ''}\n\n<a href="https://booking.serfory.eu/admin">Open admin →</a>`
    fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(adminChatId), text: msg, parse_mode: 'HTML', disable_web_page_preview: true }),
    }).catch(() => {})
  }

  return NextResponse.json({ enrollment }, { status: 201 })
}
