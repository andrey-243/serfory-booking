import { getSupabaseAdmin } from '@/lib/supabase'

type NewSession = { startUtc: string; durationMin: number }
export type ScheduleConflict = {
  type: 'booking' | 'group' | 'premade'
  startUtc: string
  label: string
}

function toMs(isoUtc: string): number {
  return new Date(isoUtc).getTime()
}

function overlapsMs(aStartMs: number, aEndMs: number, bStartMs: number, bEndMs: number): boolean {
  return aStartMs < bEndMs && aEndMs > bStartMs
}

function endMs(isoUtc: string, durationMin: number): number {
  return toMs(isoUtc) + durationMin * 60000
}

/**
 * Check if any of the new sessions conflict with existing bookings/group sessions/premade sessions
 * for the given teacher. All times are compared in UTC.
 * Sessions with null session_start_utc are skipped (legacy rows without UTC data).
 */
export async function checkTeacherConflicts(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  teacherId: string,
  newSessions: NewSession[]
): Promise<ScheduleConflict[]> {
  if (!newSessions.length) return []

  const newMs = newSessions.map(ns => ({ startMs: toMs(ns.startUtc), endMs: endMs(ns.startUtc, ns.durationMin), src: ns }))
  const rangeStartMs = Math.min(...newMs.map(s => s.startMs))
  const rangeEndMs = Math.max(...newMs.map(s => s.endMs))
  const rangeStartIso = new Date(rangeStartMs).toISOString()
  const rangeEndIso = new Date(rangeEndMs).toISOString()

  const conflicts: ScheduleConflict[] = []

  // 1. Check 1:1 bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('slot_start, slot_end, subject, student_name')
    .eq('teacher_id', teacherId)
    .neq('status', 'cancelled')
    .gte('slot_end', rangeStartIso)
    .lte('slot_start', rangeEndIso)

  for (const b of bookings ?? []) {
    const bStartMs = toMs(b.slot_start as string)
    const bEndMs = toMs(b.slot_end as string)
    for (const ns of newMs) {
      if (overlapsMs(bStartMs, bEndMs, ns.startMs, ns.endMs)) {
        conflicts.push({ type: 'booking', startUtc: b.slot_start as string, label: `1:1 ${b.subject} with ${b.student_name}` })
        break
      }
    }
  }

  // 2. Check existing group slot sessions
  const { data: activeBatches } = await supabase
    .from('group_slot_batches')
    .select('id, subject, duration_minutes')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')

  if ((activeBatches ?? []).length > 0) {
    type BatchInfo = { id: string; subject: string; duration_minutes: number }
    const batchMap = new Map((activeBatches as BatchInfo[]).map(b => [b.id, b]))

    const { data: groupSessions } = await supabase
      .from('group_slot_sessions')
      .select('session_start_utc, batch_id')
      .in('batch_id', (activeBatches as BatchInfo[]).map(b => b.id))

    for (const gs of groupSessions ?? []) {
      if (!gs.session_start_utc) continue
      const batch = batchMap.get(gs.batch_id as string)
      if (!batch) continue
      const gsStartMs = toMs(gs.session_start_utc as string)
      const gsEndMs = endMs(gs.session_start_utc as string, batch.duration_minutes)
      for (const ns of newMs) {
        if (overlapsMs(gsStartMs, gsEndMs, ns.startMs, ns.endMs)) {
          conflicts.push({ type: 'group', startUtc: gs.session_start_utc as string, label: `Group ${batch.subject} session` })
          break
        }
      }
    }
  }

  // 3. Check existing premade sessions
  const { data: activePremade } = await supabase
    .from('premade_batches')
    .select('id, name, duration_min')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')

  if ((activePremade ?? []).length > 0) {
    type PremadeInfo = { id: string; name: string; duration_min: number }
    const premadeMap = new Map((activePremade as PremadeInfo[]).map(b => [b.id, b]))

    const { data: premadeSessions } = await supabase
      .from('premade_sessions')
      .select('session_start_utc, batch_id')
      .in('batch_id', (activePremade as PremadeInfo[]).map(b => b.id))

    for (const ps of premadeSessions ?? []) {
      if (!ps.session_start_utc) continue
      const batch = premadeMap.get(ps.batch_id as string)
      if (!batch) continue
      const psStartMs = toMs(ps.session_start_utc as string)
      const psEndMs = endMs(ps.session_start_utc as string, batch.duration_min)
      for (const ns of newMs) {
        if (overlapsMs(psStartMs, psEndMs, ns.startMs, ns.endMs)) {
          conflicts.push({ type: 'premade', startUtc: ps.session_start_utc as string, label: `Premade: ${batch.name}` })
          break
        }
      }
    }
  }

  return conflicts
}
