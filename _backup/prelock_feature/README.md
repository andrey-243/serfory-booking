# Prelock Feature — Removed 2026-06-18

## What it was

When a teacher created an active group batch, the system auto-created two "prelock" batches for M+1 (+28 days) and M+2 (+56 days) with the same subject/time/day but without GCal events. These served as slot reservations to block 1:1 and pair bookings on those future dates.

The teacher could then:
- See prelocks in their dashboard (grouped with the active batch)
- Edit the date/time of each prelock
- Activate a prelock ("Save & activate") which would create the 4 GCal events and flip status to `active`

If no batch existed for a given month window, the prelock was auto-created; if one existed (active or prelock), it was skipped.

When the teacher disabled the "group" format for a subject in CourseSettings, all prelocks for that subject were deleted automatically.

## Why it was abandoned

The auto-preset logic added noise to the teacher dashboard and the teacher UX of "set date + activate" was unintuitive. Decided to keep it simple: teacher creates batches manually when ready.

## DB state

The `group_slot_batches.status` CHECK constraint still includes `'prelock'` in the DB. Any existing prelock rows in the DB are now invisible (filtered out by the API) but not deleted. They can be cleaned up with:

```sql
DELETE FROM group_slot_sessions WHERE batch_id IN (
  SELECT id FROM group_slot_batches WHERE status = 'prelock'
);
DELETE FROM group_slot_batches WHERE status = 'prelock';
```

## How to restore

### 1. `app/api/group-slots/route.ts`

**In GET:** Remove the `neq('status', 'prelock')` filter on teacherId queries (lines added after the `if (teacherId && !all)` block).

**In POST:** After creating GCal events for the active batch, re-add the auto-prelock block:

```ts
// Auto-prelock M+1 (start_date+28j) and M+2 (start_date+56j) if no batch exists in those windows
const batchStartObj = new Date(`${start_date}T12:00:00Z`)
for (const offset of [28, 56]) {
  const windowStartObj = new Date(batchStartObj)
  windowStartObj.setUTCDate(windowStartObj.getUTCDate() + offset)
  const windowStartStr = toDateStr(windowStartObj)
  const windowEndObj = new Date(windowStartObj)
  windowEndObj.setUTCDate(windowEndObj.getUTCDate() + 27)

  const { count: existing } = await supabase
    .from('group_slot_batches')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacher_id)
    .eq('subject', subject)
    .in('status', ['active', 'prelock'])
    .gte('start_date', windowStartStr)
    .lte('start_date', toDateStr(windowEndObj))

  if ((existing ?? 0) === 0) {
    const { data: prelockBatch } = await supabase
      .from('group_slot_batches')
      .insert({
        teacher_id, subject, start_date: windowStartStr,
        day_of_week, start_time, duration_minutes, max_students, status: 'prelock',
      })
      .select()
      .single()

    if (prelockBatch) {
      const prelockSessions = [0, 7, 14, 21].map(off => {
        const d = new Date(windowStartObj)
        d.setUTCDate(d.getUTCDate() + off)
        return { batch_id: prelockBatch.id, session_date: toDateStr(d), start_time }
      })
      await supabase.from('group_slot_sessions').insert(prelockSessions)
    }
  }
}
```

**Re-add PATCH handler** for teacher to edit date/time + activate prelock (see git history: commit before the removal commit, file `app/api/group-slots/route.ts`, the entire `export async function PATCH` block).

### 2. `app/api/slots/route.ts`

In the group sessions fetch, change `.eq('group_slot_batches.status', 'active')` back to `.in('group_slot_batches.status', ['active', 'prelock'])` so prelocks also block 1:1/pair slots.

### 3. `app/api/teachers/route.ts`

In the PATCH handler, after fetching `subject_formats`, re-add the prelock deletion block:

```ts
if (subject_formats !== undefined) {
  const { data: current } = await supabase.from('teachers').select('subject_formats').eq('id', id).single()
  const oldFormats = (current?.subject_formats ?? {}) as Record<string, string[]>
  const newFormats = subject_formats as Record<string, string[]>
  const subjectsLostGroup = Object.keys(oldFormats).filter(
    s => oldFormats[s]?.includes('group') && !newFormats[s]?.includes('group')
  )
  if (subjectsLostGroup.length > 0) {
    const { data: prelocks } = await supabase
      .from('group_slot_batches').select('id')
      .eq('teacher_id', id).eq('status', 'prelock').in('subject', subjectsLostGroup)
    if (prelocks && prelocks.length > 0) {
      const prelockIds = prelocks.map(p => p.id)
      await supabase.from('group_slot_sessions').delete().in('batch_id', prelockIds)
      await supabase.from('group_slot_batches').delete().in('id', prelockIds)
    }
  }
}
```

### 4. `components/teacher/GroupSlotsTeacher.tsx`

Re-add to LABELS (all 3 langs): `prelock`, `prelockHint`, `saveAndActivate`, `activating`, `errorActivate`, `editDates`, `cancelEdit`.

Re-add state: `const [prelockEdits, setPrelockEdits] = useState<Record<string, {...}>>({})`.

Re-add functions: `initPrelockEdit(batch)` and `handleActivate(batchId)`.

In the Batch type: add `'prelock'` to the status union.

In the batch row render (inside the groups loop), re-add prelock-specific visual treatment:
- Dashed border + gray background for prelock card
- Amber "Auto-preset" badge + hint text on the row
- Expanded prelock section with date/time pickers + "Save & activate" button (calls `handleActivate`)
- `onClick` on the prelock row should also call `initPrelockEdit(batch)` when opening

### 5. `app/admin/page.tsx`

- Add `prelock: 'Pré-réservé'` back to FR status labels and `prelock: 'Prelock'` to EN
- Add `'prelock'` to default `filterStatuses` Set
- Re-add `'prelock'` to the `(['active', 'completed'] as const)` pill array with amber color `'bg-amber-500 border-amber-500'`
- In the batch status badge: restore the three-way ternary including `batch.status === 'prelock' ? 'bg-amber-50 text-amber-600'`
