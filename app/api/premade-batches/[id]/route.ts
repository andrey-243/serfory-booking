import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifySession } from '@/lib/session'
import { deleteCalendarEvent, patchCalendarEventSummary } from '@/lib/google-calendar'

// PATCH /api/premade-batches/[id]
// Admin: update status
// Teacher (owner): update session names (session_updates: [{ id, name }])
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession(req.cookies.get('session')?.value ?? '')
  if (!session || !['admin', 'teacher'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const supabase = getSupabaseAdmin()

  // Admin: update batch status
  if (session.role === 'admin' && body.status) {
    const { status } = body
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const { error } = await supabase.from('premade_batches').update({ status }).eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Teacher: update session names
  if (session.role === 'teacher' && body.session_updates) {
    const updates = body.session_updates as { id: string; name: string }[]

    // Verify ownership
    const { data: batch } = await supabase
      .from('premade_batches')
      .select('teacher_id, name')
      .eq('id', id)
      .single()
    if (!batch || batch.teacher_id !== session.teacherId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch teacher GCal credentials
    const { data: teacher } = await supabase
      .from('teachers')
      .select('google_refresh_token, google_calendar_id')
      .eq('id', batch.teacher_id)
      .single()

    for (const u of updates) {
      if (!u.name.trim()) continue
      await supabase.from('premade_sessions').update({ name: u.name }).eq('id', u.id)

      // Sync GCal event title if connected
      if (teacher?.google_refresh_token) {
        const { data: s } = await supabase
          .from('premade_sessions')
          .select('gcal_event_id')
          .eq('id', u.id)
          .single()
        if (s?.gcal_event_id) {
          try {
            const summary = `${batch.name}: ${u.name} · Serfory`
            await patchCalendarEventSummary(
              teacher.google_refresh_token,
              teacher.google_calendar_id || 'primary',
              s.gcal_event_id,
              summary
            )
          } catch { /* Non-blocking */ }
        }
      }
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

// DELETE /api/premade-batches/[id] - admin only: cancel batch + delete GCal events
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession(req.cookies.get('session')?.value ?? '')
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getSupabaseAdmin()

  // Fetch sessions with gcal_event_id + teacher refresh token
  const { data: batch } = await supabase
    .from('premade_batches')
    .select('teacher_id, premade_sessions(id, gcal_event_id)')
    .eq('id', id)
    .single()

  if (batch) {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('google_refresh_token, google_calendar_id')
      .eq('id', batch.teacher_id)
      .single()

    if (teacher?.google_refresh_token) {
      for (const s of (batch.premade_sessions || []) as { id: string; gcal_event_id: string | null }[]) {
        if (s.gcal_event_id) {
          try {
            await deleteCalendarEvent(teacher.google_refresh_token, teacher.google_calendar_id || 'primary', s.gcal_event_id)
          } catch {
            // Non-blocking
          }
        }
      }
    }
  }

  const { error } = await supabase.from('premade_batches').update({ status: 'cancelled' }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to cancel batch' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
