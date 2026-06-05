'use client'

import { useEffect, useState, useCallback } from 'react'
import { startOfWeek, addWeeks, subWeeks } from 'date-fns'
import CourseTabFilter, { Course } from '@/components/booking/CourseTabFilter'
import TeacherCard from '@/components/booking/TeacherCard'
import WeekView from '@/components/booking/WeekView'
import BookingForm from '@/components/booking/BookingForm'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { LanguageProvider, useLang } from '@/lib/language-context'
import { Teacher } from '@/lib/supabase'
import { CalendarSlot } from '@/lib/google-calendar'

type TeacherSlots = { teacher: Teacher; slots: CalendarSlot[] }

export default function BookingPage() {
  return (
    <LanguageProvider>
      <BookingPageInner />
    </LanguageProvider>
  )
}

function BookingPageInner() {
  const { t } = useLang()
  const [selectedCourse, setSelectedCourse] = useState<Course>('Russian')
  const [selectedLang, setSelectedLang] = useState<string>('')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacherSlots, setTeacherSlots] = useState<TeacherSlots[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ teacherId: string; slot: CalendarSlot } | null>(null)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booked, setBooked] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams({ subject: selectedCourse })
    if (selectedLang) params.set('teachingLang', selectedLang)
    fetch(`/api/teachers?${params}`)
      .then(r => r.json())
      .then(d => {
        setTeachers(d.teachers || [])
        setSelectedTeacher(null)
        setSelectedSlot(null)
      })
  }, [selectedCourse, selectedLang])

  const loadSlots = useCallback(async (teacherList: Teacher[], week: Date) => {
    setLoadingSlots(true)
    const results = await Promise.all(
      teacherList.map(async teacher => {
        try {
          const res = await fetch(`/api/slots?teacherId=${teacher.id}&weekStart=${week.toISOString()}`)
          const data = await res.json()
          return { teacher, slots: data.slots || [] }
        } catch {
          return { teacher, slots: [] }
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
    const teacher = teachers.find(t => t.id === teacherId) || null
    setSelectedTeacher(teacher)
    setSelectedSlot({ teacherId, slot })
  }

  // Only show teachers who have at least one slot this week (after slots are loaded)
  const teachersWithSlots = loadingSlots
    ? teachers
    : teachers.filter(t => teacherSlots.find(ts => ts.teacher.id === t.id && ts.slots.length > 0))

  const visibleTeacherSlots = selectedTeacher
    ? teacherSlots.filter(ts => ts.teacher.id === selectedTeacher.id)
    : teacherSlots.filter(ts => ts.slots.length > 0)

  if (booked) {
    return (
      <main className="min-h-screen bg-[#EEF2FF] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.booking.confirmed}</h2>
          <p className="text-gray-500 text-sm mb-6">{t.booking.confirmedDesc}</p>
          <button
            onClick={() => { setBooked(false); setSelectedSlot(null); setSelectedTeacher(null) }}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            {t.booking.bookAnother}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Serfory" className="h-8 w-8 rounded-lg object-cover" />
            <h1 className="text-2xl font-bold text-gray-900">{t.booking.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <a
              href="/login"
              className="p-2 rounded-full hover:bg-white/60 transition-colors text-gray-400 hover:text-gray-600"
              title="Teacher portal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <CourseTabFilter
            selected={selectedCourse}
            onChange={course => { setSelectedCourse(course); setBooked(false) }}
          />
          <div className="relative">
            <select
              value={selectedLang}
              onChange={e => { setSelectedLang(e.target.value); setBooked(false) }}
              className="h-9 appearance-none rounded-full border border-gray-300 bg-white pl-3 pr-8 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            >
              <option value="">{t.booking.allLanguages}</option>
              <option value="Russian">Russian</option>
              <option value="Estonian">Estonian</option>
              <option value="English">English</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Main layout: fixed height so form never overflows below calendar */}
        <div className="flex gap-5 items-stretch h-[600px]">
          {/* Left panel */}
          <div className={`flex-shrink-0 flex flex-col gap-3 overflow-y-auto transition-all duration-200 ${
            selectedSlot ? 'w-72' : 'w-64'
          }`}>
            {selectedTeacher && selectedSlot ? (
              <>
                <TeacherCard
                  teacher={selectedTeacher}
                  selected={true}
                  onClick={() => {}}
                />
                <BookingForm
                  teacher={selectedTeacher}
                  slot={selectedSlot.slot}
                  subject={selectedCourse}
                  onSuccess={() => setBooked(true)}
                  onCancel={() => { setSelectedSlot(null); setSelectedTeacher(null) }}
                />
              </>
            ) : (
              <>
                {teachers.length === 0 ? (
                  <p className="text-sm text-gray-400">{t.booking.noProfessors}</p>
                ) : teachersWithSlots.length === 0 && !loadingSlots ? (
                  <p className="text-sm text-gray-400">{t.booking.noProfessors}</p>
                ) : (
                  teachersWithSlots.map(teacher => (
                    <TeacherCard
                      key={teacher.id}
                      teacher={teacher}
                      selected={selectedTeacher?.id === teacher.id}
                      onClick={() => {
                        setSelectedTeacher(prev => prev?.id === teacher.id ? null : teacher)
                        setSelectedSlot(null)
                      }}
                    />
                  ))
                )}
              </>
            )}
          </div>

          {/* Right panel — calendar */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 overflow-auto">
            {loadingSlots ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                {t.booking.loading}
              </div>
            ) : teachers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                {t.booking.selectCourse}
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
