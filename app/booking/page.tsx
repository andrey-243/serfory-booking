'use client'

import { useEffect, useState, useCallback } from 'react'
import { startOfWeek, addWeeks, subWeeks } from 'date-fns'
import CourseTabFilter, { Course } from '@/components/booking/CourseTabFilter'
import TeacherCard from '@/components/booking/TeacherCard'
import WeekView from '@/components/booking/WeekView'
import BookingForm from '@/components/booking/BookingForm'
import { Teacher } from '@/lib/supabase'
import { CalendarSlot } from '@/lib/google-calendar'

type TeacherSlots = { teacher: Teacher; slots: CalendarSlot[] }

export default function BookingPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course>('Russian')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacherSlots, setTeacherSlots] = useState<TeacherSlots[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ teacherId: string; slot: CalendarSlot } | null>(null)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booked, setBooked] = useState(false)

  useEffect(() => {
    fetch(`/api/teachers?subject=${selectedCourse}`)
      .then(r => r.json())
      .then(d => {
        setTeachers(d.teachers || [])
        setSelectedTeacher(null)
        setSelectedSlot(null)
      })
  }, [selectedCourse])

  const loadSlots = useCallback(async (teacherList: Teacher[], week: Date) => {
    setLoadingSlots(true)
    const results = await Promise.all(
      teacherList.map(async t => {
        try {
          const res = await fetch(`/api/slots?teacherId=${t.id}&weekStart=${week.toISOString()}`)
          const data = await res.json()
          return { teacher: t, slots: data.slots || [] }
        } catch {
          return { teacher: t, slots: [] }
        }
      })
    )
    setTeacherSlots(results)
    setLoadingSlots(false)
  }, [])

  useEffect(() => {
    if (teachers.length > 0) loadSlots(teachers, weekStart)
    else setTeacherSlots([])
  }, [teachers, weekStart, loadSlots])

  function handleSelectSlot(teacherId: string, slot: CalendarSlot) {
    const t = teachers.find(t => t.id === teacherId) || null
    setSelectedTeacher(t)
    setSelectedSlot({ teacherId, slot })
  }

  const visibleTeacherSlots = selectedTeacher
    ? teacherSlots.filter(ts => ts.teacher.id === selectedTeacher.id)
    : teacherSlots

  if (booked) {
    return (
      <main className="min-h-screen bg-[#EEF2FF] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Réservation confirmée !</h2>
          <p className="text-gray-500 text-sm mb-6">
            Votre demande a été enregistrée. Le professeur vous contactera prochainement.
          </p>
          <button
            onClick={() => { setBooked(false); setSelectedSlot(null); setSelectedTeacher(null) }}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            Réserver un autre cours
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Réserver un cours</h1>

        <div className="mb-6">
          <CourseTabFilter selected={selectedCourse} onChange={course => { setSelectedCourse(course); setBooked(false) }} />
        </div>

        <div className="flex gap-5">
          {/* Colonne gauche 20% */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-3">
            {teachers.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun professeur disponible pour ce cours.</p>
            ) : (
              teachers.map(t => (
                <TeacherCard
                  key={t.id}
                  teacher={t}
                  selected={selectedTeacher?.id === t.id}
                  onClick={() => {
                    setSelectedTeacher(prev => prev?.id === t.id ? null : t)
                    setSelectedSlot(null)
                  }}
                />
              ))
            )}

            {selectedTeacher && selectedSlot && (
              <div className="mt-4">
                <BookingForm
                  teacher={selectedTeacher}
                  slot={selectedSlot.slot}
                  subject={selectedCourse}
                  onSuccess={() => setBooked(true)}
                  onCancel={() => { setSelectedSlot(null) }}
                />
              </div>
            )}
          </div>

          {/* Colonne droite 80% */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 min-h-[500px]">
            {loadingSlots ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Chargement des créneaux…
              </div>
            ) : teachers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Sélectionnez un cours pour voir les créneaux disponibles.
              </div>
            ) : (
              <WeekView
                teacherSlots={visibleTeacherSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlot}
                weekStart={weekStart}
                onPrevWeek={() => setWeekStart(w => subWeeks(w, 1))}
                onNextWeek={() => setWeekStart(w => addWeeks(w, 1))}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
