'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { startOfDay, addDays, subDays } from 'date-fns'
import CourseTabFilter, { Course } from '@/components/booking/CourseTabFilter'
import TeacherCard from '@/components/booking/TeacherCard'
import WeekView from '@/components/booking/WeekView'
import BookingForm from '@/components/booking/BookingForm'
import GroupBatchView from '@/components/booking/GroupBatchView'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { LanguageProvider, useLang } from '@/lib/language-context'
import { Teacher } from '@/lib/supabase'
import { CalendarSlot } from '@/lib/google-calendar'

export type ApplicationPrefill = {
  name: string
  email: string
  phone: string
  contact_pref: string
  subject?: string
  learning_lang?: string | null
}

type BookingFormat = 'individual' | 'pair' | 'group' | null

type TeacherSlots = { teacher: Teacher; slots: CalendarSlot[] }

const TEACHING_LANGS = ['Russian', 'Estonian', 'English', 'Kyrgyz'] as const
type TeachingLang = typeof TEACHING_LANGS[number]

export default function BookingPage() {
  return (
    <LanguageProvider>
      <Suspense>
        <BookingPageInner />
      </Suspense>
    </LanguageProvider>
  )
}

function BookingPageInner() {
  const { t, setLang } = useLang()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const session = searchParams.get('session')

  const [prefill, setPrefill] = useState<ApplicationPrefill | null>(null)
  const [bookingFormat, setBookingFormat] = useState<BookingFormat>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course>('Russian')
  const [selectedLang, setSelectedLang] = useState<TeachingLang | ''>('')
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacherSlots, setTeacherSlots] = useState<TeacherSlots[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ teacherId: string; slot: CalendarSlot } | null>(null)
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date()))
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booked, setBooked] = useState(false)
  const [hasPendingInvoice, setHasPendingInvoice] = useState(false)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [lessonsRemaining, setLessonsRemaining] = useState<number | null>(null)
  const [lessonsTotal, setLessonsTotal] = useState<number | null>(null)
  const [sessionInvalid, setSessionInvalid] = useState(false)

  // Session flow: ?session=<booking_token>
  useEffect(() => {
    if (!session) return
    fetch(`/api/booking-session?session=${session}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setSessionInvalid(true); return }
        setInvoiceId(d.invoiceId)
        setLessonsRemaining(d.lessonsRemaining)
        setLessonsTotal(d.lessonsTotal)
        if (d.format) setBookingFormat(d.format)
        if (!d.prefill) return
        setPrefill(d.prefill)
        const VALID_COURSES: Course[] = ['Russian', 'English', 'Estonian', 'Spanish', 'Math']
        if (d.prefill.subject && VALID_COURSES.includes(d.prefill.subject)) {
          setSelectedCourse(d.prefill.subject as Course)
        }
        const VALID_LANGS = ['en', 'et', 'ru']
        if (d.prefill.learning_lang && VALID_LANGS.includes(d.prefill.learning_lang)) {
          setLang(d.prefill.learning_lang)
        }
      })
      .catch(() => setSessionInvalid(true))
  }, [session, setLang])

  // Ref flow (legacy): ?ref=<ref_token>
  useEffect(() => {
    if (!ref) return
    fetch(`/api/applications?ref=${ref}`)
      .then(r => r.json())
      .then(d => {
        if (d.hasPendingInvoice) { setHasPendingInvoice(true); return }
        if (!d.prefill) return
        setPrefill(d.prefill)
        if (d.bookingFormat) setBookingFormat(d.bookingFormat)
        const VALID_COURSES: Course[] = ['Russian', 'English', 'Estonian', 'Spanish', 'Math']
        if (d.prefill.subject && VALID_COURSES.includes(d.prefill.subject)) {
          setSelectedCourse(d.prefill.subject as Course)
        }
        const VALID_LANGS = ['en', 'et', 'ru']
        if (d.prefill.learning_lang && VALID_LANGS.includes(d.prefill.learning_lang)) {
          setLang(d.prefill.learning_lang)
        }
      })
      .catch(() => {})
  }, [ref, setLang])

  function selectLang(lang: TeachingLang | '') {
    setSelectedLang(lang)
    setLangDropdownOpen(false)
    setSelectedTeacher(null)
    setSelectedSlot(null)
  }

  useEffect(() => {
    setLoadingTeachers(true)
    const params = new URLSearchParams({ subject: selectedCourse })
    if (ref) params.set('ref', ref)
    fetch(`/api/teachers?${params}`)
      .then(r => r.json())
      .then(d => {
        setTeachers(d.teachers || [])
        setSelectedTeacher(null)
        setSelectedSlot(null)
      })
      .finally(() => setLoadingTeachers(false))
  }, [selectedCourse])

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

  const isLoading = loadingTeachers || loadingSlots

  // Client-side lang filter
  const teachersAfterLang = selectedLang === ''
    ? teachers
    : teachers.filter(t => t.teaching_languages.includes(selectedLang))

  // Hide teachers with no slots this week (only after loading is done)
  const visibleTeachers = isLoading
    ? []
    : teachersAfterLang.filter(t => teacherSlots.find(ts => ts.teacher.id === t.id && ts.slots.length > 0))

  const visibleTeacherSlots = selectedTeacher
    ? teacherSlots.filter(ts => ts.teacher.id === selectedTeacher.id)
    : teacherSlots.filter(ts =>
        ts.slots.length > 0 &&
        (selectedLang === '' || ts.teacher.teaching_languages.includes(selectedLang))
      )

  if (sessionInvalid) {
    return (
      <main className="min-h-screen bg-[#EEF2FF] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.booking.noLessonsRemaining}</h2>
          <p className="text-gray-500 text-sm">{t.booking.noLessonsRemainingDesc}</p>
        </div>
      </main>
    )
  }

  if (hasPendingInvoice) {
    return (
      <main className="min-h-screen bg-[#EEF2FF] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.booking.pendingPayment}</h2>
          <p className="text-gray-500 text-sm">{t.booking.pendingPaymentDesc}</p>
        </div>
      </main>
    )
  }

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
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-screen-2xl mx-auto">
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

        {/* Filters — hidden when arriving via ref token (subject + lang preset from UTM) */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {!ref && !session && <CourseTabFilter
            selected={selectedCourse}
            onChange={course => { setSelectedCourse(course); setBooked(false) }}
          />}

          {/* Teaching language — hidden when ref token present (preset from UTM) */}
          {!ref && !session && <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors shadow-sm ${
                selectedLang
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              <svg className="w-3.5 h-3.5 opacity-60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>
                {selectedLang ? t.booking.courses[selectedLang as keyof typeof t.booking.courses] : t.booking.taughtIn}
              </span>
              <svg className="w-3 h-3 opacity-50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {langDropdownOpen && (
              <>
                <div className="fixed inset-0 z-0" onClick={() => setLangDropdownOpen(false)} />
                <div className="absolute top-full mt-1.5 left-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10 min-w-[160px]">
                  <button
                    onClick={() => selectLang('')}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                      selectedLang === '' ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {t.booking.allLanguages}
                  </button>
                  {TEACHING_LANGS.map(lang => (
                    <button
                      key={lang}
                      onClick={() => selectLang(lang)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                        selectedLang === lang ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {t.booking.courses[lang]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>}
        </div>

        {/* Main layout */}
        {bookingFormat === 'group' ? (
          <GroupBatchView
            subject={selectedCourse}
            refToken={ref!}
            prefill={prefill ?? undefined}
            onSuccess={() => setBooked(true)}
          />
        ) : (
          <div className="flex gap-5 items-stretch h-[600px]">
            {/* Left panel */}
            <div className={`flex-shrink-0 flex flex-col gap-3 overflow-y-auto transition-all duration-200 ${
              selectedSlot ? 'w-[440px]' : 'w-72'
            }`}>
              {selectedTeacher && selectedSlot ? (
                <>
                  <TeacherCard teacher={selectedTeacher} selected={true} onClick={() => {}} />
                  {lessonsRemaining !== null && (
                    <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600 font-medium text-center">
                      {lessonsRemaining} / {lessonsTotal} lessons remaining
                    </div>
                  )}
                  <BookingForm
                    teacher={selectedTeacher}
                    slot={selectedSlot.slot}
                    subject={selectedCourse}
                    onSuccess={() => {
                      setBooked(true)
                      loadSlots(teachers, weekStart)
                      if (lessonsRemaining !== null) setLessonsRemaining(r => r !== null ? Math.max(0, r - 1) : null)
                    }}
                    onCancel={() => { setSelectedSlot(null); setSelectedTeacher(null) }}
                    prefill={prefill ?? undefined}
                    adjustedPrice={(selectedTeacher as Teacher & { adjusted_price?: number }).adjusted_price}
                    refToken={ref ?? undefined}
                    invoiceId={invoiceId ?? undefined}
                  />
                </>
              ) : isLoading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-[104px] rounded-2xl bg-gray-200/70 animate-pulse" />
                  ))}
                </>
              ) : visibleTeachers.length === 0 ? (
                <p className="text-sm text-gray-400">{t.booking.noProfessors}</p>
              ) : (
                visibleTeachers.map(teacher => (
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
            </div>

            {/* Right panel — calendar */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 overflow-auto">
              {isLoading ? (
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
                  onPrevWeek={() => setWeekStart(w => subDays(w, 7))}
                  onNextWeek={() => setWeekStart(w => addDays(w, 7))}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
