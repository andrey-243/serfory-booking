import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { addAttendeeToEvent } from '@/lib/google-calendar'

const MAX_ATTEMPTS = 3

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  // Find unsynced enrollments under max attempts, created within last 48h
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const { data: enrollments } = await supabase
    .from('group_slot_enrollments')
    .select(`
      id,
      gcal_sync_attempts,
      application_id,
      batch_id,
      applications(email),
      group_slot_batches(
        teacher_id,
        teachers(google_refresh_token, google_calendar_id, name)
      )
    `)
    .eq('gcal_synced', false)
    .eq('status', 'active')
    .lt('gcal_sync_attempts', MAX_ATTEMPTS)
    .gte('created_at', cutoff)

  if (!enrollments?.length) return NextResponse.json({ synced: 0, notified: 0 })

  let synced = 0
  let notified = 0

  for (const enrollment of enrollments) {
    const appRaw = enrollment.applications as unknown
    const app = (Array.isArray(appRaw) ? appRaw[0] : appRaw) as { email: string } | null
    const batchRaw = enrollment.group_slot_batches as unknown
    const batch = (Array.isArray(batchRaw) ? batchRaw[0] : batchRaw) as {
      teacher_id: string
      teachers: { google_refresh_token: string | null; google_calendar_id: string | null; name: string } | null
    } | null
    const teacherRaw = batch?.teachers as unknown
    const teacher = (Array.isArray(teacherRaw) ? teacherRaw[0] : teacherRaw) as { google_refresh_token: string | null; google_calendar_id: string | null; name: string } | null

    if (!app?.email || !teacher?.google_refresh_token) continue

    const { data: sessions } = await supabase
      .from('group_slot_sessions')
      .select('id, gcal_event_id')
      .eq('batch_id', enrollment.batch_id)
      .not('gcal_event_id', 'is', null)

    let gcalSynced = false
    let gcalLastError: string | null = null

    const results = await Promise.allSettled(
      (sessions || []).map(s => addAttendeeToEvent(
        teacher.google_refresh_token!,
        teacher.google_calendar_id || 'primary',
        s.gcal_event_id!,
        app.email
      ))
    )

    const failed = results.find(r => r.status === 'rejected')
    if (!failed) {
      gcalSynced = true
      synced++
    } else {
      gcalLastError = (failed as PromiseRejectedResult).reason?.message ?? 'GCal sync failed'
    }

    const newAttempts = enrollment.gcal_sync_attempts + 1

    await supabase
      .from('group_slot_enrollments')
      .update({
        gcal_synced: gcalSynced,
        gcal_sync_attempts: newAttempts,
        gcal_last_error: gcalLastError,
      })
      .eq('id', enrollment.id)

    // Notify admin if max attempts reached and still failing
    if (!gcalSynced && newAttempts >= MAX_ATTEMPTS) {
      const bot = process.env.TELEGRAM_BOT_TOKEN
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
      if (bot && adminChatId) {
        const msg = [
          `⚠️ <b>GCal sync failed</b> (${MAX_ATTEMPTS} attempts)`,
          ``,
          `👤 ${app.email}`,
          `📚 Batch: <code>${enrollment.batch_id}</code>`,
          `❌ ${gcalLastError}`,
        ].join('\n')
        await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: Number(adminChatId), text: msg, parse_mode: 'HTML' }),
        }).catch(() => {})
        notified++
      }
    }
  }

  return NextResponse.json({ synced, notified })
}
