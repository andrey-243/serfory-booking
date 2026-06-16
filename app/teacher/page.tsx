'use client'

import { useEffect, useState } from 'react'
import { format, parseISO, isThisWeek } from 'date-fns'
import { enUS, ru as ruLocale, et as etLocale } from 'date-fns/locale'
import GroupSlotsTeacher from '@/components/teacher/GroupSlotsTeacher'
import PremadeBatchesTeacher from '@/components/teacher/PremadeBatchesTeacher'
import CourseSettingsTeacher from '@/components/teacher/CourseSettingsTeacher'

type Lang = 'en' | 'ru' | 'et'
type NavSection = 'overview' | 'courses' | 'settings'

const T = {
  en: {
    nav: { overview: 'Overview', courses: 'Courses', settings: 'Settings' },
    gcalDesc: 'Your calendar is connected. Reconnect if you change your Google account.',
    gcalBtn: 'Reconnect Google Calendar',
    availDesc: 'Outside these hours, no bookings are proposed to students.',
    unavailable: 'Unavailable',
    save: 'Save',
    saving: 'Saving…',
    saved: '✓ Saved',
    upcoming: (n: number) => `Upcoming lessons (${n})`,
    empty: 'No upcoming lessons.',
    logout: 'Sign out',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dateFormat: "d MMM 'at' HH:mm",
    locale: enUS,
    nextLesson: 'Next lesson',
    thisWeek: 'This week',
    noNext: 'None scheduled',
  },
  ru: {
    nav: { overview: 'Обзор', courses: 'Курсы', settings: 'Настройки' },
    gcalDesc: 'Ваш календарь подключён. Переподключитесь при смене аккаунта Google.',
    gcalBtn: 'Переподключить Google Календарь',
    availDesc: 'Вне этих промежутков ученики не увидят слоты.',
    unavailable: 'Недоступно',
    save: 'Сохранить',
    saving: 'Сохранение…',
    saved: '✓ Сохранено',
    upcoming: (n: number) => `Ближайшие уроки (${n})`,
    empty: 'Нет запланированных уроков.',
    logout: 'Выйти',
    days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    dateFormat: "d MMM 'в' HH:mm",
    locale: ruLocale,
    nextLesson: 'Следующий урок',
    thisWeek: 'На этой неделе',
    noNext: 'Нет запланированных',
  },
  et: {
    nav: { overview: 'Ülevaade', courses: 'Kursused', settings: 'Seaded' },
    gcalDesc: "Teie kalender on ühendatud. Ühendage uuesti, kui vahetate Google'i kontot.",
    gcalBtn: 'Ühenda Google Kalender uuesti',
    availDesc: 'Nendest väljaspool ei pakuta õpilastele aegu.',
    unavailable: 'Pole saadaval',
    save: 'Salvesta',
    saving: 'Salvestamine…',
    saved: '✓ Salvestatud',
    upcoming: (n: number) => `Tulevased tunnid (${n})`,
    empty: 'Tulevasi tunde pole.',
    logout: 'Logi välja',
    days: ['Pühapäev', 'Esmaspäev', 'Teisipäev', 'Kolmapäev', 'Neljapäev', 'Reede', 'Laupäev'],
    dateFormat: "d MMM 'kell' HH:mm",
    locale: etLocale,
    nextLesson: 'Järgmine tund',
    thisWeek: 'Sel nädalal',
    noNext: 'Pole planeeritud',
  },
}

const SUBJECT_COLORS: Record<string, string> = {
  Russian: 'bg-orange-100 text-orange-700', English: 'bg-blue-100 text-blue-700',
  Estonian: 'bg-green-100 text-green-700',  Spanish: 'bg-rose-100 text-rose-700',
  Math: 'bg-purple-100 text-purple-700',    Kyrgyz: 'bg-violet-100 text-violet-700',
  Physics: 'bg-sky-100 text-sky-700',       Chemistry: 'bg-teal-100 text-teal-700',
}

type Booking = {
  id: string
  subject: string
  slot_start: string
  slot_end: string
  student_name: string
  student_phone: string
  contact_pref: string
  telegram_username: string | null
  status: string
  student_status: string | null
  meet_link: string | null
}

type AvailabilityRow = {
  day_of_week: number
  start_time: string
  end_time: string
  enabled: boolean
}

type GroupBatch = {
  id: string
  subject: string
  teaching_language: string
  target_levels: string[]
  start_time: string
  duration_minutes: number
  max_students: number
  status: string
  enrollment_count: number
  group_slot_sessions: { id: string; session_date: string; start_time: string; session_start_utc: string | null }[]
}

type PremadeBatch = {
  id: string
  name: string
  subject: string
  teaching_language: string
  target_levels: string[]
  duration_min: number
  max_students: number
  status: string
  enrollment_count: number
  premade_sessions: { id: string; name: string; session_date: string; start_time: string; session_start_utc: string | null }[]
}

function getBrowserTz(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function getTzAbbr(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? tz
}

function formatSessionUtc(utcIso: string): { date: string; time: string; tzAbbr: string } {
  const tz = getBrowserTz()
  const d = new Date(utcIso)
  return {
    date: d.toLocaleDateString('en-GB', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }),
    tzAbbr: getTzAbbr(d, tz),
  }
}

function sessionDate(s: { session_date: string; start_time: string; session_start_utc: string | null }): Date {
  return s.session_start_utc
    ? new Date(s.session_start_utc)
    : new Date(`${s.session_date}T${s.start_time}`)
}

type User = { email: string; role: string; teacherId: string | null; name: string }

export default function TeacherPage() {
  const [user, setUser] = useState<User | null>(null)
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([])
  const [teachingLanguages, setTeachingLanguages] = useState<string[]>([])
  const [subjectFormats, setSubjectFormats] = useState<Record<string, string[]>>({})
  const [subjectLevels, setSubjectLevels] = useState<Record<string, string[]>>({})
  const [bookings, setBookings] = useState<Booking[]>([])
  const [groupBatches, setGroupBatches] = useState<GroupBatch[]>([])
  const [premadeBatches, setPremadeBatches] = useState<PremadeBatch[]>([])
  const [lang, setLang] = useState<Lang>('en')
  const [nav, setNav] = useState<NavSection>('overview')
  const [availability, setAvailability] = useState<AvailabilityRow[]>(
    Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, start_time: '08:00', end_time: '20:00', enabled: i >= 1 && i <= 5 }))
  )
  const [savingAvail, setSavingAvail] = useState(false)
  const [savedAvail, setSavedAvail] = useState(false)
  const [overviewOpen, setOverviewOpen] = useState({ oneToOne: true, group: true, premade: true })

  const t = T[lang]

  function reloadTeacherData(teacherId: string) {
    fetch(`/api/teachers?id=${teacherId}`)
      .then(r => r.json())
      .then(d => {
        if (d.teacher) {
          if (d.teacher.subjects) setTeacherSubjects(d.teacher.subjects)
          if (d.teacher.teaching_languages) setTeachingLanguages(d.teacher.teaching_languages)
          if (d.teacher.subject_formats) setSubjectFormats(d.teacher.subject_formats)
          if (d.teacher.subject_levels) setSubjectLevels(d.teacher.subject_levels)
        }
      })
  }

  async function handleUpdateTgUsername(id: string, username: string) {
    const val = username.replace(/^@/, '').trim() || null
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, telegram_username: val }),
    })
    setBookings(prev => prev.map(b => b.id === id ? { ...b, telegram_username: val } : b))
  }

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (d.user) {
        setUser(d.user)
        if (d.user.teacherId) {
          fetch(`/api/bookings?teacherId=${d.user.teacherId}`)
            .then(r => r.json())
            .then(d => setBookings(d.bookings || []))
          fetch(`/api/group-slots?teacherId=${d.user.teacherId}`)
            .then(r => r.json())
            .then(d => setGroupBatches(d.batches || []))
          fetch(`/api/premade-batches?teacherId=${d.user.teacherId}`)
            .then(r => r.json())
            .then(d => setPremadeBatches(d.batches || []))
          fetch(`/api/teachers?id=${d.user.teacherId}`)
            .then(r => r.json())
            .then(d => {
              if (d.teacher) {
                if (d.teacher.subjects) setTeacherSubjects(d.teacher.subjects)
                if (d.teacher.teaching_languages) setTeachingLanguages(d.teacher.teaching_languages)
                if (d.teacher.subject_formats) setSubjectFormats(d.teacher.subject_formats)
                if (d.teacher.subject_levels) setSubjectLevels(d.teacher.subject_levels)
              }
            })
          fetch(`/api/availability?teacherId=${d.user.teacherId}`)
            .then(r => r.json())
            .then(d => {
              if (d.availability?.length > 0) {
                setAvailability(prev => prev.map(row => {
                  const saved = d.availability.find((a: { day_of_week: number }) => a.day_of_week === row.day_of_week)
                  return saved
                    ? { ...row, start_time: saved.start_time.slice(0, 5), end_time: saved.end_time.slice(0, 5), enabled: true }
                    : { ...row, enabled: false }
                }))
              }
            })
        }
      }
    })
  }, [])

  async function saveAvailability() {
    if (!user?.teacherId) return
    setSavingAvail(true)
    const rows = availability
      .filter(r => r.enabled)
      .map(r => ({ day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time }))
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_id: user.teacherId, availability: rows, timezone: getBrowserTz() }),
    })
    setSavingAvail(false)
    setSavedAvail(true)
    setTimeout(() => setSavedAvail(false), 3000)
  }

  const now = new Date()
  const upcoming = bookings.filter(b => new Date(b.slot_start) >= now && b.status !== 'cancelled')

  const upcomingGroupSessions = groupBatches
    .filter(b => b.status === 'active')
    .flatMap(b => b.group_slot_sessions
      .filter(s => sessionDate(s) >= now)
      .map(s => ({ ...s, subject: b.subject, teachingLang: b.teaching_language, targetLevels: b.target_levels, enrollmentCount: b.enrollment_count, maxStudents: b.max_students, batchId: b.id }))
    )
    .sort((a, c) => sessionDate(a).getTime() - sessionDate(c).getTime())

  const upcomingPremadeSessions = premadeBatches
    .filter(b => b.status === 'active')
    .flatMap(b => b.premade_sessions
      .filter(s => sessionDate(s) >= now)
      .map(s => ({ ...s, batchName: b.name, subject: b.subject, teachingLang: b.teaching_language, targetLevels: b.target_levels, enrollmentCount: b.enrollment_count, maxStudents: b.max_students, batchId: b.id }))
    )
    .sort((a, c) => sessionDate(a).getTime() - sessionDate(c).getTime())

  const thisWeek1v1 = upcoming.filter(b => isThisWeek(parseISO(b.slot_start), { weekStartsOn: 1 })).length
  const thisWeekGroup = upcomingGroupSessions.filter(s => isThisWeek(sessionDate(s), { weekStartsOn: 1 })).length
  const thisWeekPremade = upcomingPremadeSessions.filter(s => isThisWeek(sessionDate(s), { weekStartsOn: 1 })).length
  const thisWeekCount = thisWeek1v1 + thisWeekGroup + thisWeekPremade
  const totalUpcoming = upcoming.length + upcomingGroupSessions.length + upcomingPremadeSessions.length
  const nextLesson = upcoming[0] ?? null

  // Build grouped views for Overview (same logic as Courses tab)
  const LANG_LABELS_OV: Record<string, string> = { en: 'EN', ru: 'RU', et: 'ET', ky: 'KY' }
  const LANG_COLORS_OV: Record<string, string> = {
    en: 'bg-blue-100 text-blue-700', ru: 'bg-orange-100 text-orange-700',
    et: 'bg-green-100 text-green-700', ky: 'bg-purple-100 text-purple-700',
  }

  const overviewGroupMap = new Map<string, { subject: string; lang: string; levels: string[]; batches: GroupBatch[] }>()
  for (const b of groupBatches.filter(bt => bt.status === 'active')) {
    const key = `${b.subject}||${b.teaching_language ?? ''}||${[...(b.target_levels || [])].sort().join(',')}`
    if (!overviewGroupMap.has(key)) overviewGroupMap.set(key, { subject: b.subject, lang: b.teaching_language ?? '', levels: b.target_levels || [], batches: [] })
    overviewGroupMap.get(key)!.batches.push(b)
  }
  const overviewGroups = [...overviewGroupMap.values()]

  const overviewPremadeMap = new Map<string, { subject: string; batches: PremadeBatch[] }>()
  for (const b of premadeBatches.filter(bt => bt.status === 'active')) {
    if (!overviewPremadeMap.has(b.subject)) overviewPremadeMap.set(b.subject, { subject: b.subject, batches: [] })
    overviewPremadeMap.get(b.subject)!.batches.push(b)
  }
  const overviewPremadeGroups = [...overviewPremadeMap.values()]

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '?'

  const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t.nav.overview, icon: <IconOverview /> },
    { id: 'courses',  label: t.nav.courses,  icon: <IconGroups /> },
    { id: 'settings', label: t.nav.settings, icon: <IconSettings /> },
  ]

  return (
    <div className="min-h-screen bg-[#EEF2FF] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen sticky top-0">
        {/* Profile */}
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3">
            <span className="font-semibold text-blue-700 text-lg">{initials}</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">{user?.name ?? '…'}</p>
          {teacherSubjects.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {teacherSubjects.map(s => (
                <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${SUBJECT_COLORS[s] ?? 'bg-gray-100 text-gray-600'}`}>{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setNav(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                nav === item.id
                  ? 'bg-blue-50 text-blue-600 font-semibold border-r-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}>
              <span className="shrink-0">{item.icon}</span>
              {item.label}
              {item.id === 'overview' && totalUpcoming > 0 && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${nav === 'overview' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {totalUpcoming}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer: GCal + Sign out */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
              <span className="text-[11px] text-gray-400">Google Calendar</span>
            </div>
            <a href="/api/auth/google"
              className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors">
              <GoogleIcon />
              Reconnect
            </a>
          </div>
          <a href="/api/auth/logout" className="block text-xs text-gray-400 hover:text-gray-600 transition-colors">
            {t.logout}
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h2 className="font-semibold text-gray-900">{NAV_ITEMS.find(n => n.id === nav)?.label}</h2>
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold shadow-sm">
            {(['en', 'ru', 'et'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1.5 uppercase transition-colors ${lang === l ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Section content */}
        <div className="flex-1 p-8">

          {/* Overview */}
          {nav === 'overview' && (
            <div className="space-y-5 max-w-3xl">
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{t.nextLesson}</p>
                  {nextLesson ? (
                    <>
                      <p className="text-sm font-bold text-gray-900">{nextLesson.student_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {nextLesson.subject} · {format(parseISO(nextLesson.slot_start), t.dateFormat, { locale: t.locale })}
                      </p>
                      {nextLesson.meet_link && (
                        <a href={nextLesson.meet_link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-2 py-0.5 hover:bg-blue-50 transition-colors">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                          Google Meet
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">{t.noNext}</p>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{t.thisWeek}</p>
                  <p className="text-2xl font-bold text-blue-600">{thisWeekCount}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {thisWeek1v1 > 0 && <span className="text-[11px] text-gray-500">1:1 <span className="font-semibold text-gray-700">{thisWeek1v1}</span></span>}
                    {thisWeekGroup > 0 && <span className="text-[11px] text-gray-500">Group <span className="font-semibold text-emerald-600">{thisWeekGroup}</span></span>}
                    {thisWeekPremade > 0 && <span className="text-[11px] text-gray-500">Premade <span className="font-semibold text-violet-600">{thisWeekPremade}</span></span>}
                    {thisWeekCount === 0 && <span className="text-xs text-gray-400">{t.upcoming(0).replace('(0)', '').trim()}</span>}
                  </div>
                </div>
              </div>

              {/* 1:1 section */}
              {upcoming.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOverviewOpen(p => ({ ...p, oneToOne: !p.oneToOne }))}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-800 text-sm">1:1 · {t.upcoming(upcoming.length)}</h3>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${overviewOpen.oneToOne ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {overviewOpen.oneToOne && (
                    <div className="px-5 pb-4 border-t border-gray-50">
                      <div className="pt-3">
                        <UpcomingList bookings={upcoming} t={t} onUpdateTg={handleUpdateTgUsername} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Group section */}
              {overviewGroups.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOverviewOpen(p => ({ ...p, group: !p.group }))}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-800 text-sm">Group · {t.upcoming(upcomingGroupSessions.length)}</h3>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${overviewOpen.group ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {overviewOpen.group && (
                    <div className="border-t border-gray-50 px-5 py-4 flex flex-col gap-5">
                      {overviewGroups.map(group => (
                        <div key={`${group.subject}||${group.lang}||${group.levels.sort().join(',')}`} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${SUBJECT_COLORS[group.subject] ?? 'bg-gray-100 text-gray-600'}`}>{group.subject}</span>
                            {group.lang && <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${LANG_COLORS_OV[group.lang] ?? 'bg-gray-100 text-gray-500'}`}>{LANG_LABELS_OV[group.lang] ?? group.lang}</span>}
                            {group.levels.length > 0 && <span className="text-xs font-medium text-gray-500">{group.levels.join(', ')}</span>}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {group.batches.map(batch => {
                              const sorted = [...batch.group_slot_sessions].sort((a, b) => sessionDate(a).getTime() - sessionDate(b).getTime())
                              const nextSession = sorted.find(s => sessionDate(s) >= now)
                              const displaySession = nextSession ?? sorted[sorted.length - 1]
                              const isPast = !nextSession
                              return (
                                <div key={batch.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Active</span>
                                    {displaySession && (() => {
                                      if (displaySession.session_start_utc) {
                                        const { date, time, tzAbbr } = formatSessionUtc(displaySession.session_start_utc)
                                        return (
                                          <span className={`text-xs ${isPast ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                            {date} {time} <span className="text-gray-400">{tzAbbr}</span>
                                          </span>
                                        )
                                      }
                                      return (
                                        <span className={`text-xs ${isPast ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                          {format(new Date(`${displaySession.session_date}T${displaySession.start_time}`), t.dateFormat, { locale: t.locale })}
                                        </span>
                                      )
                                    })()}
                                  </div>
                                  <span className="text-xs text-gray-500 font-medium">{batch.enrollment_count}/{batch.max_students}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Premade section */}
              {overviewPremadeGroups.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOverviewOpen(p => ({ ...p, premade: !p.premade }))}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-800 text-sm">Premade · {overviewPremadeGroups.reduce((n, g) => n + g.batches.length, 0)} active</h3>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${overviewOpen.premade ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {overviewOpen.premade && (
                    <div className="border-t border-gray-50 px-5 py-4 flex flex-col gap-5">
                      {overviewPremadeGroups.map(group => (
                        <div key={group.subject} className="flex flex-col gap-2">
                          <span className={`self-start text-[11px] px-1.5 py-0.5 rounded font-medium ${SUBJECT_COLORS[group.subject] ?? 'bg-gray-100 text-gray-600'}`}>{group.subject}</span>
                          <div className="flex flex-col gap-1.5">
                            {group.batches.map(batch => {
                              const sorted = [...batch.premade_sessions].sort((a, b) => sessionDate(a).getTime() - sessionDate(b).getTime())
                              const nextSession = sorted.find(s => sessionDate(s) >= now)
                              const displaySession = nextSession ?? sorted[sorted.length - 1]
                              const isPast = !nextSession
                              return (
                                <div key={batch.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-medium text-gray-800 truncate">{batch.name}</span>
                                    {displaySession && (() => {
                                      if (displaySession.session_start_utc) {
                                        const { date, time, tzAbbr } = formatSessionUtc(displaySession.session_start_utc)
                                        return (
                                          <span className={`text-xs shrink-0 ${isPast ? 'text-gray-400 line-through' : 'text-gray-400'}`}>
                                            {displaySession.name} · {date} {time} <span className="text-gray-400">{tzAbbr}</span>
                                          </span>
                                        )
                                      }
                                      return (
                                        <span className={`text-xs shrink-0 ${isPast ? 'text-gray-400 line-through' : 'text-gray-400'}`}>
                                          {displaySession.name} · {format(new Date(`${displaySession.session_date}T${displaySession.start_time}`), t.dateFormat, { locale: t.locale })}
                                        </span>
                                      )
                                    })()}
                                  </div>
                                  <span className="text-xs text-gray-500 font-medium shrink-0 ml-2">{batch.enrollment_count}/{batch.max_students}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {totalUpcoming === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm text-gray-400">{t.empty}</p>
                </div>
              )}
            </div>
          )}

          {/* Courses — Groups + Premade 50/50 */}
          {nav === 'courses' && user?.teacherId && (
            <div className="grid grid-cols-2 gap-5 items-start">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <GroupSlotsTeacher
                  teacherId={user.teacherId}
                  subjects={teacherSubjects}
                  subjectFormats={subjectFormats}
                  subjectLevels={subjectLevels}
                  teachingLanguages={teachingLanguages}
                  lang={lang}
                />
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <PremadeBatchesTeacher
                  teacherId={user.teacherId}
                  subjects={teacherSubjects}
                  subjectFormats={subjectFormats}
                  lang={lang}
                  teachingLanguages={teachingLanguages}
                />
              </div>
            </div>
          )}

          {/* Settings — Schedule + CourseSettings 50/50 */}
          {nav === 'settings' && user?.teacherId && (
            <div className="grid grid-cols-2 gap-5 items-start">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">{t.availDesc}</p>
                <div className="space-y-2">
                  {availability.map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <button type="button"
                        onClick={() => setAvailability(prev => prev.map((r, j) => j === i ? { ...r, enabled: !r.enabled } : r))}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ${row.enabled ? 'bg-blue-500' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${row.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="w-24 text-sm text-gray-700">{t.days[row.day_of_week]}</span>
                      {row.enabled ? (
                        <div className="flex items-center gap-2">
                          <input type="time" value={row.start_time}
                            onChange={e => e.target.value && setAvailability(prev => prev.map((r, j) => j === i ? { ...r, start_time: e.target.value } : r))}
                            onBlur={e => { if (!e.target.value) setAvailability(prev => prev.map((r, j) => j === i ? { ...r, start_time: '08:00' } : r)) }}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                          <span className="text-gray-400 text-sm">–</span>
                          <input type="time" value={row.end_time}
                            onChange={e => e.target.value && setAvailability(prev => prev.map((r, j) => j === i ? { ...r, end_time: e.target.value } : r))}
                            onBlur={e => { if (!e.target.value) setAvailability(prev => prev.map((r, j) => j === i ? { ...r, end_time: '20:00' } : r)) }}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">{t.unavailable}</span>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={saveAvailability} disabled={savingAvail || !user?.teacherId}
                  className="mt-5 px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors">
                  {savingAvail ? t.saving : savedAvail ? t.saved : t.save}
                </button>
              </div>
              {teacherSubjects.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <CourseSettingsTeacher
                    teacherId={user.teacherId}
                    subjects={teacherSubjects}
                    initialTeachingLanguages={teachingLanguages}
                    initialSubjectFormats={subjectFormats}
                    initialSubjectLevels={subjectLevels}
                    lang={lang}
                    onSaved={() => reloadTeacherData(user.teacherId!)}
                  />
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Upcoming lessons list ─────────────────────────────────────────────────────

type UpcomingListProps = {
  bookings: Booking[]
  t: typeof T['en']
  onUpdateTg: (id: string, username: string) => void
}

function UpcomingList({ bookings, t, onUpdateTg }: UpcomingListProps) {
  if (bookings.length === 0) return <p className="text-sm text-gray-400">{t.empty}</p>
  return (
    <ul className="divide-y divide-gray-100">
      {bookings.map(b => (
        <li key={b.id} className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{b.student_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {b.subject} · {format(parseISO(b.slot_start), t.dateFormat, { locale: t.locale })} <span className="text-gray-300">{getTzAbbr(new Date(b.slot_start), getBrowserTz())}</span>
            </p>
            {b.contact_pref === 'telegram' && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <a href={b.telegram_username ? `https://t.me/${b.telegram_username}` : `https://t.me/+${b.student_phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-white bg-sky-500 hover:bg-sky-600 px-2 py-0.5 rounded-full font-medium transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.613c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.903.608z"/></svg>
                  TG
                </a>
                <input
                  className="w-28 text-xs px-1.5 py-0.5 border border-gray-200 rounded text-gray-500 placeholder-gray-300 focus:outline-none focus:border-sky-400"
                  defaultValue={b.telegram_username ? `@${b.telegram_username}` : ''}
                  placeholder="@username"
                  onBlur={e => { if (e.target.value !== (b.telegram_username ? `@${b.telegram_username}` : '')) onUpdateTg(b.id, e.target.value) }}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                />
              </div>
            )}
          </div>
          <div className="flex items-center shrink-0">
            {b.student_status === 'confirmed' ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-600">✓</span>
            ) : b.student_status === 'cancelled' ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-500">✗</span>
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function IconOverview() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}

function IconGroups() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
}

function IconSettings() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
}
