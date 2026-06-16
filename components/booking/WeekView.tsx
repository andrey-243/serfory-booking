'use client'

import { format, addDays, isSameDay, parseISO, isAfter, isBefore, startOfDay } from 'date-fns'
import { enUS, et, ru } from 'date-fns/locale'
import { Teacher } from '@/lib/supabase'
import { CalendarSlot } from '@/lib/google-calendar'
import { useLang } from '@/lib/language-context'

const dateFnsLocales = { en: enUS, et, ru }

const TEACHER_COLORS = [
  { normal: 'bg-blue-100 text-blue-700 hover:bg-blue-200', selected: 'bg-blue-500 text-white' },
  { normal: 'bg-violet-100 text-violet-700 hover:bg-violet-200', selected: 'bg-violet-500 text-white' },
  { normal: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200', selected: 'bg-emerald-500 text-white' },
  { normal: 'bg-amber-100 text-amber-700 hover:bg-amber-200', selected: 'bg-amber-500 text-white' },
  { normal: 'bg-rose-100 text-rose-700 hover:bg-rose-200', selected: 'bg-rose-500 text-white' },
]

type TeacherSlots = {
  teacher: Teacher
  slots: CalendarSlot[]
}

type Props = {
  teacherSlots: TeacherSlots[]
  selectedSlot: { teacherId: string; slot: CalendarSlot } | null
  onSelectSlot: (teacherId: string, slot: CalendarSlot) => void
  weekStart: Date
  onPrevWeek: () => void
  onNextWeek: () => void
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8)

function stableColorIndex(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h) % TEACHER_COLORS.length
}

function slotToGridRow(start: string) {
  const s = parseISO(start)
  const startMin = s.getHours() * 60 + s.getMinutes()
  const rowStart = Math.round((startMin - 8 * 60) / 30) + 2
  return { rowStart, rowSpan: 2 }
}

type SlotEntry = { teacher: Teacher; slot: CalendarSlot }

export default function WeekView({ teacherSlots, selectedSlot, onSelectSlot, weekStart, onPrevWeek, onNextWeek }: Props) {
  const { t, lang } = useLang()
  const locale = dateFnsLocales[lang]
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const todayStart = startOfDay(new Date())
  const now = new Date()
  const canGoPrev = isAfter(weekStart, todayStart)

  // Assign a stable color per teacher based on their ID hash
  const teacherColorMap: Record<string, number> = {}
  teacherSlots.forEach(ts => {
    teacherColorMap[ts.teacher.id] = stableColorIndex(ts.teacher.id)
  })

  // Group slots by (dayIndex, slotStart) → list of {teacher, slot}
  // Skip past slots (before now)
  const grouped = new Map<string, SlotEntry[]>()
  teacherSlots.forEach(ts => {
    ts.slots.forEach(slot => {
      if (isBefore(parseISO(slot.start), now)) return
      const dayIdx = days.findIndex(d => isSameDay(d, parseISO(slot.start)))
      if (dayIdx === -1) return
      const key = `${dayIdx}|${slot.start}`
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push({ teacher: ts.teacher, slot })
    })
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrevWeek}
          disabled={!canGoPrev}
          className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {t.week.prev}
        </button>
        <span className="text-sm font-medium text-gray-700">
          {format(weekStart, 'd MMM', { locale })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale })}
        </span>
        <button
          onClick={onNextWeek}
          className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
        >
          {t.week.next}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `48px repeat(7, minmax(80px, 1fr))`,
            gridTemplateRows: `32px repeat(${HOURS.length * 2}, 36px)`,
            minWidth: `${48 + 7 * 80}px`,
          }}
        >
          {/* Header */}
          <div />
          {days.map((day, i) => {
            const isPast = isBefore(day, todayStart)
            const isToday = isSameDay(day, now)
            return (
              <div
                key={i}
                className={`text-center text-xs font-medium border-b border-gray-100 flex flex-col items-center justify-center ${isPast ? 'opacity-30' : 'text-gray-500'}`}
              >
                <span className={`uppercase ${isToday ? 'text-blue-500 font-bold' : ''}`}>{format(day, 'EEE', { locale })}</span>
                <span className={`text-[10px] ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>{format(day, 'd MMM', { locale })}</span>
              </div>
            )
          })}

          {/* Hour labels */}
          {HOURS.flatMap(h => [0, 30].map(m => {
            const rowIndex = (h - 8) * 2 + (m === 30 ? 1 : 0) + 2
            return (
              <div
                key={`lbl-${h}:${m}`}
                style={{ gridRow: rowIndex, gridColumn: 1 }}
                className="text-[10px] text-gray-400 flex items-start justify-end pr-2 pt-0.5"
              >
                {m === 0 ? `${h}h` : ''}
              </div>
            )
          }))}

          {/* Background grid lines */}
          {HOURS.flatMap(h => [0, 30].map(m => {
            const rowIndex = (h - 8) * 2 + (m === 30 ? 1 : 0) + 2
            return (
              <div
                key={`bg-${h}:${m}`}
                style={{ gridRow: rowIndex, gridColumn: '2 / span 7' }}
                className={`border-t ${m === 0 ? 'border-gray-200' : 'border-gray-100'}`}
              />
            )
          }))}

          {/* Slot cells */}
          {Array.from(grouped.entries()).map(([key, entries]) => {
            const dayIdx = parseInt(key.split('|')[0])
            const { rowStart, rowSpan } = slotToGridRow(entries[0].slot.start)

            return (
              <div
                key={key}
                style={{ gridRow: `${rowStart} / span ${rowSpan}`, gridColumn: dayIdx + 2 }}
                className="px-0.5 py-0.5 flex gap-0.5"
              >
                {entries.map(({ teacher, slot }) => {
                  const colorIdx = teacherColorMap[teacher.id] ?? 0
                  const colors = TEACHER_COLORS[colorIdx]
                  const isSelected =
                    selectedSlot?.teacherId === teacher.id &&
                    selectedSlot.slot.start === slot.start
                  const label = entries.length === 1
                    ? format(parseISO(slot.start), 'HH:mm')
                    : teacher.name.split(' ')[0]

                  return (
                    <button
                      key={teacher.id}
                      onClick={() => onSelectSlot(teacher.id, slot)}
                      className={`flex-1 rounded text-[9px] font-semibold transition-colors truncate px-0.5 min-w-0 ${
                        isSelected ? colors.selected : colors.normal
                      }`}
                      title={`${teacher.name} – ${format(parseISO(slot.start), 'HH:mm')}–${format(parseISO(slot.end), 'HH:mm')}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
