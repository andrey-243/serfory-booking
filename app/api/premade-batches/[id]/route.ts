import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifySession } from '@/lib/session'
import { deleteCalendarEvent } from '@/lib/google-calendar'

// PATCH /api/premade-batches/[id]  — admin only: update status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession(req.cookies.get('session')?.value ?? '')
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { status } = body

  if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('premade_batches').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE /api/premade-batches/[id]  — admin only: cancel batch + delete GCal events
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
