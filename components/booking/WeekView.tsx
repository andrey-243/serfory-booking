'use client'

import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Teacher } from '@/lib/supabase'
import { CalendarSlot } from '@/lib/google-calendar'

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

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8h → 20h

function slotToGridRow(start: string, end: string) {
  const s = parseISO(start)
  const e = parseISO(end)
  const startMin = s.getHours() * 60 + s.getMinutes()
  const endMin = e.getHours() * 60 + e.getMinutes()
  const rowStart = Math.round((startMin - 8 * 60) / 30) + 2
  const rowSpan = Math.round((endMin - startMin) / 30)
  return { rowStart, rowSpan: Math.max(rowSpan, 1) }
}

export default function WeekView({ teacherSlots, selectedSlot, onSelectSlot, weekStart, onPrevWeek, onNextWeek }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrevWeek}
          className="px-3 py-1 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
        >
          ← Sem. préc.
        </button>
        <span className="text-sm font-medium text-gray-700">
          {format(weekStart, 'd MMM', { locale: fr })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}
        </span>
        <button
          onClick={onNextWeek}
          className="px-3 py-1 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
        >
          Sem. suiv. →
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `48px repeat(${days.length * teacherSlots.length || 7}, minmax(80px, 1fr))`,
            gridTemplateRows: `32px repeat(${HOURS.length * 2}, 24px)`,
            minWidth: `${48 + Math.max(days.length * teacherSlots.length, 7) * 80}px`,
          }}
        >
          {/* Header jours */}
          <div />
          {days.map(day =>
            teacherSlots.length > 0
              ? teacherSlots.map(ts => (
                  <div
                    key={`${day.toISOString()}-${ts.teacher.id}`}
                    className="text-center text-xs font-medium text-gray-500 border-b border-gray-100 flex flex-col items-center justify-center"
                  >
                    <span className="uppercase">{format(day, 'EEE', { locale: fr })}</span>
                    <span className="text-gray-400 text-[10px]">{ts.teacher.name.split(' ')[0]}</span>
                  </div>
                ))
              : (
                  <div
                    key={day.toISOString()}
                    className="text-center text-xs font-medium text-gray-500 border-b border-gray-100 flex items-center justify-center"
                  >
                    {format(day, 'EEE d', { locale: fr })}
                  </div>
                )
          )}

          {/* Lignes heures */}
          {HOURS.flatMap(h => [0, 30].map(m => {
            const label = m === 0 ? `${h}h` : ''
            const rowIndex = (h - 8) * 2 + (m === 30 ? 1 : 0) + 2
            return (
              <div
                key={`${h}:${m}`}
                style={{ gridRow: rowIndex, gridColumn: 1 }}
                className="text-[10px] text-gray-400 flex items-start justify-end pr-2 pt-0.5"
              >
                {label}
              </div>
            )
          }))}

          {/* Lignes fond */}
          {HOURS.flatMap(h => [0, 30].map(m => {
            const rowIndex = (h - 8) * 2 + (m === 30 ? 1 : 0) + 2
            const colCount = teacherSlots.length > 0 ? days.length * teacherSlots.length : 7
            return (
              <div
                key={`bg-${h}:${m}`}
                style={{ gridRow: rowIndex, gridColumn: `2 / span ${colCount}` }}
                className={`border-t ${m === 0 ? 'border-gray-200' : 'border-gray-100'}`}
              />
            )
          }))}

          {/* Créneaux */}
          {teacherSlots.flatMap((ts, tsIdx) =>
            ts.slots.map((slot, sIdx) => {
              const slotDate = parseISO(slot.start)
              const dayIdx = days.findIndex(d => isSameDay(d, slotDate))
              if (dayIdx === -1) return null

              const colIndex = dayIdx * teacherSlots.length + tsIdx + 2
              const { rowStart, rowSpan } = slotToGridRow(slot.start, slot.end)
              const isSelected =
                selectedSlot?.teacherId === ts.teacher.id &&
                selectedSlot.slot.start === slot.start

              return (
                <button
                  key={`${ts.teacher.id}-${sIdx}`}
                  style={{ gridRow: `${rowStart} / span ${rowSpan}`, gridColumn: colIndex }}
                  onClick={() => onSelectSlot(ts.teacher.id, slot)}
                  className={`mx-0.5 my-0.5 rounded text-[10px] font-medium transition-colors truncate px-1 ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  title={`${format(parseISO(slot.start), 'HH:mm')} – ${format(parseISO(slot.end), 'HH:mm')}`}
                >
                  {format(parseISO(slot.start), 'HH:mm')}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
