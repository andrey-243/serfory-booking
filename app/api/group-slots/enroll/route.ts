import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { addAttendeeToEvent } from '@/lib/google-calendar'

// POST /api/group-slots/enroll
// Body: { batch_id, ref_token }
// Validates: batch active, capacity not full, invoice paid, no duplicate enrollment
export async function POST(req: NextRequest) {
  const { batch_id, ref_token } = await req.json()

  if (!batch_id || !ref_token) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Resolve application from ref_token
  const { data: app, error: appErr } = await supabase
    .from('applications')
    .select('id, name, email, status')
    .eq('ref_token', ref_token)
    .eq('status', 'accepted')
    .single()

  if (appErr || !app) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  // Find latest paid invoice for this application with format = 'group'
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('id, format, status')
    .eq('application_id', app.id)
    .eq('format', 'group')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (invErr || !invoice) {
    return NextResponse.json({ error: 'No paid group invoice found' }, { status: 403 })
  }

  // Fetch batch
  const { data: batch, error: batchErr } = await supabase
    .from('group_slot_batches')
    .select('id, subject, status, max_students')
    .eq('id', batch_id)
    .single()

  if (batchErr || !batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  }
  if (batch.status !== 'active') {
    return NextResponse.json({ error: 'Batch not open for enrollment' }, { status: 422 })
  }

  // Check capacity
  const { count: enrolledCount } = await supabase
    .from('group_slot_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('batch_id', batch_id)
    .eq('status', 'active')

  if ((enrolledCount ?? 0) >= batch.max_students) {
    return NextResponse.json({ error: 'Batch is full' }, { status: 422 })
  }

  // Check invoice not already used for another enrollment (prevents re-enrollment after "book another")
  const { count: invoiceUsed } = await supabase
    .from('group_slot_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('invoice_id', invoice.id)
    .eq('status', 'active')

  if ((invoiceUsed ?? 0) > 0) {
    return NextResponse.json({ error: 'Already enrolled via this invoice' }, { status: 422 })
  }

  // Check duplicate enrollment in this specific batch
  const { count: existing } = await supabase
    .from('group_slot_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('batch_id', batch_id)
    .eq('application_id', app.id)
    .eq('status', 'active')

  if ((existing ?? 0) > 0) {
    return NextResponse.json({ error: 'Already enrolled in this batch' }, { status: 422 })
  }

  // Create enrollment (gcal_synced = false until GCal patches succeed)
  const { data: enrollment, error: enrollErr } = await supabase
    .from('group_slot_enrollments')
    .insert({
      batch_id,
      application_id: app.id,
      invoice_id: invoice.id,
      status: 'active',
      gcal_synced: false,
    })
    .select()
    .single()

  if (enrollErr || !enrollment) {
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
  }

  // Fetch sessions + teacher token for GCal patching
  const { data: sessions } = await supabase
    .from('group_slot_sessions')
    .select('id, gcal_event_id')
    .eq('batch_id', batch_id)
    .order('session_date', { ascending: true })

  const { data: batchWithTeacher } = await supabase
    .from('group_slot_batches')
    .select('teacher_id, teachers(google_refresh_token, google_calendar_id)')
    .eq('id', batch_id)
    .single()

  const teacherRaw = batchWithTeacher?.teachers as unknown
  const teacher = (Array.isArray(teacherRaw) ? teacherRaw[0] : teacherRaw) as { google_refresh_token: string | null; google_calendar_id: string | null } | null
  let gcalSynced = false
  let gcalLastError: string | null = null

  if (teacher?.google_refresh_token && sessions?.length) {
    const sessionsWithEvent = sessions.filter(s => s.gcal_event_id)
    if (sessionsWithEvent.length === 0) {
      gcalLastError = 'No GCal event IDs on sessions'
    } else {
      const results = await Promise.allSettled(
        sessionsWithEvent.map(s => addAttendeeToEvent(
          teacher.google_refresh_token!,
          teacher.google_calendar_id || 'primary',
          s.gcal_event_id!,
          app.email
        ))
      )
      const failed = results.find(r => r.status === 'rejected')
      if (!failed) {
        gcalSynced = true
      } else {
        gcalLastError = (failed as PromiseRejectedResult).reason?.message ?? 'GCal sync failed'
      }
    }
  } else if (!teacher?.google_refresh_token) {
    // No token yet - will be retried by cron
    gcalLastError = 'Teacher has no GCal token'
  } else {
    // No sessions with gcal_event_id (shouldn't happen on active batch)
    gcalSynced = true
  }

  await supabase
    .from('group_slot_enrollments')
    .update({
      gcal_synced: gcalSynced,
      gcal_sync_attempts: gcalSynced ? 0 : 1,
      gcal_last_error: gcalLastError,
    })
    .eq('id', enrollment.id)

  // Invalidate booking_token - group enrollment uses all 4 lessons at once
  await supabase.from('invoices').update({ booking_token: null }).eq('id', invoice.id)

  // TG admin notif
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId) {
    const msg = `👥 <b>Group enrollment</b>\n\n👤 <b>${app.name}</b>\n📚 ${batch.subject}\n\n<a href="https://booking.serfory.eu/admin">Open admin →</a>`
    fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(adminChatId), text: msg, parse_mode: 'HTML', disable_web_page_preview: true }),
    }).catch(() => {})
  }

  return NextResponse.json({ enrollment: { id: enrollment.id, gcal_synced: gcalSynced } }, { status: 201 })
}
