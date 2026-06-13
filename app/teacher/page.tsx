'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { enUS, ru as ruLocale, et as etLocale } from 'date-fns/locale'
import GroupSlotsTeacher from '@/components/teacher/GroupSlotsTeacher'
import PremadeBatchesTeacher from '@/components/teacher/PremadeBatchesTeacher'

type Lang = 'en' | 'ru' | 'et'

const T = {
  en: {
    title: 'Teacher Dashboard',
    gcalTitle: 'Google Calendar',
    gcalDesc: 'Your calendar is connected. Existing events are taken into account for available slots. Reconnect if you change your Google account.',
    gcalBtn: 'Reconnect Google Calendar',
    availTitle: 'My availability',
    availDesc: 'Set your available time slots. Outside these slots, no bookings will be proposed to students.',
    unavailable: 'Unavailable',
    save: 'Save',
    saving: 'Saving…',
    saved: '✓ Saved',
    upcoming: (n: number) => `Upcoming lessons (${n})`,
    empty: 'No upcoming lessons.',
    logout: 'Sign out',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    status: { confirmed: 'Confirmed', cancelled: 'Cancelled', pending: 'Pending' },
    dateFormat: "d MMM 'at' HH:mm",
    locale: enUS,
  },
  ru: {
    title: 'Кабинет преподавателя',
    gcalTitle: 'Google Календарь',
    gcalDesc: 'Ваш календарь подключён. Существующие события учитываются при формировании доступных слотов. Переподключитесь при смене аккаунта Google.',
    gcalBtn: 'Переподключить Google Календарь',
    availTitle: 'Моё расписание',
    availDesc: 'Укажите доступное время. Вне этих промежутков ученики не увидят слоты.',
    unavailable: 'Недоступно',
    save: 'Сохранить',
    saving: 'Сохранение…',
    saved: '✓ Сохранено',
    upcoming: (n: number) => `Ближайшие уроки (${n})`,
    empty: 'Нет запланированных уроков.',
    logout: 'Выйти',
    days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    status: { confirmed: 'Подтверждён', cancelled: 'Отменён', pending: 'Ожидание' },
    dateFormat: "d MMM 'в' HH:mm",
    locale: ruLocale,
  },
  et: {
    title: 'Õpetaja töölaud',
    gcalTitle: 'Google Kalender',
    gcalDesc: "Teie kalender on ühendatud. Olemasolevaid sündmusi arvestatakse vabade aegade määramisel. Ühendage uuesti, kui vahetate Google'i kontot.",
    gcalBtn: 'Ühenda Google Kalender uuesti',
    availTitle: 'Minu kättesaadavus',
    availDesc: 'Määrake saadaolevad ajad. Nendest väljaspool ei pakuta õpilastele aegu.',
    unavailable: 'Pole saadaval',
    save: 'Salvesta',
    saving: 'Salvestamine…',
    saved: '✓ Salvestatud',
    upcoming: (n: number) => `Tulevased tunnid (${n})`,
    empty: 'Tulevasi tunde pole.',
    logout: 'Logi välja',
    days: ['Pühapäev', 'Esmaspäev', 'Teisipäev', 'Kolmapäev', 'Neljapäev', 'Reede', 'Laupäev'],
    status: { confirmed: 'Kinnitatud', cancelled: 'Tühistatud', pending: 'Ootel' },
    dateFormat: "d MMM 'kell' HH:mm",
    locale: etLocale,
  },
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
  student_response: string | null
}

type AvailabilityRow = {
  day_of_week: number
  start_time: string
  end_time: string
  enabled: boolean
}

type User = { email: string; role: string; teacherId: string | null; name: string }

export default function TeacherPage() {
  const [user, setUser] = useState<User | null>(null)
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [lang, setLang] = useState<Lang>('en')
  const [availability, setAvailability] = useState<AvailabilityRow[]>(
    Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, start_time: '08:00', end_time: '20:00', enabled: i >= 1 && i <= 5 }))
  )
  const [savingAvail, setSavingAvail] = useState(false)
  const [savedAvail, setSavedAvail] = useState(false)

  const t = T[lang]

  async function handleStatusChange(id: string, status: string) {
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
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
          fetch(`/api/teachers?id=${d.user.teacherId}`)
            .then(r => r.json())
            .then(d => { if (d.teacher?.subjects) setTeacherSubjects(d.teacher.subjects) })
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

  const upcoming = bookings.filter(b => new Date(b.slot_start) >= new Date())

  async function saveAvailability() {
    if (!user?.teacherId) return
    setSavingAvail(true)
    const rows = availability
      .filter(r => r.enabled)
      .map(r => ({ day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time }))

    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_id: user.teacherId, availability: rows }),
    })
    setSavingAvail(false)
    setSavedAvail(true)
    setTimeout(() => setSavedAvail(false), 3000)
  }

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            {user && <p className="text-sm text-gray-500 mt-0.5">{user.name}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold shadow-sm">
              {(['en', 'ru', 'et'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1.5 uppercase transition-colors ${lang === l ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <a href="/api/auth/logout" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              {t.logout}
            </a>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-1">{t.gcalTitle}</h2>
          <p className="text-sm text-gray-500 mb-3">{t.gcalDesc}</p>
          <a
            href="/api/auth/google"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <GoogleIcon />
            {t.gcalBtn}
          </a>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-1">{t.availTitle}</h2>
          <p className="text-sm text-gray-500 mb-4">{t.availDesc}</p>

          <div className="space-y-2">
            {availability.map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAvailability(prev => prev.map((r, j) => j === i ? { ...r, enabled: !r.enabled } : r))}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ${row.enabled ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${row.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="w-28 text-sm text-gray-700">{t.days[row.day_of_week]}</span>
                {row.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={row.start_time}
                      onChange={e => e.target.value && setAvailability(prev => prev.map((r, j) => j === i ? { ...r, start_time: e.target.value } : r))}
                      onBlur={e => { if (!e.target.value) setAvailability(prev => prev.map((r, j) => j === i ? { ...r, start_time: '08:00' } : r)) }}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-gray-400 text-sm">–</span>
                    <input
                      type="time"
                      value={row.end_time}
                      onChange={e => e.target.value && setAvailability(prev => prev.map((r, j) => j === i ? { ...r, end_time: e.target.value } : r))}
                      onBlur={e => { if (!e.target.value) setAvailability(prev => prev.map((r, j) => j === i ? { ...r, end_time: '20:00' } : r)) }}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">{t.unavailable}</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={saveAvailability}
            disabled={savingAvail || !user?.teacherId}
            className="mt-4 px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {savingAvail ? t.saving : savedAvail ? t.saved : t.save}
          </button>
        </div>

        {/* Group sessions */}
        {user?.teacherId && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <GroupSlotsTeacher
              teacherId={user.teacherId}
              subjects={teacherSubjects}
              lang={lang}
            />
          </div>
        )}

        {/* Premade courses */}
        {user?.teacherId && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <PremadeBatchesTeacher
              teacherId={user.teacherId}
              subjects={teacherSubjects}
              lang={lang}
            />
          </div>
        )}

        {/* Upcoming lessons */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">{t.upcoming(upcoming.length)}</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400">{t.empty}</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map(b => (
                <li key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.student_name}</p>
                    <p className="text-xs text-gray-500">
                      {b.subject} — {format(parseISO(b.slot_start), t.dateFormat, { locale: t.locale })}
                    </p>
                    {b.contact_pref === 'telegram' && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <a
                          href={b.telegram_username ? `https://t.me/${b.telegram_username}` : `https://t.me/+${b.student_phone.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-white bg-sky-500 hover:bg-sky-600 px-2 py-0.5 rounded-full font-medium transition-colors">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.613c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.903.608z"/></svg>
                          TG
                        </a>
                        <input
                          className="w-28 text-xs px-1.5 py-0.5 border border-gray-200 rounded text-gray-500 placeholder-gray-300 focus:outline-none focus:border-sky-400"
                          defaultValue={b.telegram_username ? `@${b.telegram_username}` : ''}
                          placeholder="@username"
                          onBlur={e => { if (e.target.value !== (b.telegram_username ? `@${b.telegram_username}` : '')) handleUpdateTgUsername(b.id, e.target.value) }}
                          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <TeacherMiniIcon />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {t.status[b.status as keyof typeof t.status] ?? b.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StudentMiniIcon />
                      {b.student_response ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          b.student_response === 'accepted' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {b.student_response === 'accepted' ? '✓' : '✗'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                    {b.status !== 'cancelled' && (
                      <div className="flex gap-1">
                        {b.status === 'pending' && (
                          <button onClick={() => handleStatusChange(b.id, 'confirmed')}
                            title="Confirm"
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors">
                            <CheckIcon />
                          </button>
                        )}
                        <button onClick={() => handleStatusChange(b.id, 'cancelled')}
                          title="Cancel"
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors">
                          <CrossIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function TeacherMiniIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
    </svg>
  )
}

function StudentMiniIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
