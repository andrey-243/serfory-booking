'use client'

import { useState } from 'react'

// ── Package page data ─────────────────────────────────────────────────────────

const PKG_LANG_COURSES = ['Russian', 'English', 'Estonian', 'Spanish', 'Kyrgyz']
const PKG_OTHER_COURSES = ['Math', 'Chemistry', 'Physics']
const PKG_SCHOOL = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3–4', 'Grade 5–6', 'Grade 7–8', 'Grade 9', 'Grade 10–12']
const PKG_CEFR = ['A1', 'A2', 'B1', 'B2']
const PKG_LANGS = ['English', 'Estonian', 'Russian', 'Kyrgyz']
const PKG_FORMATS = [
  { label: 'Individual', sub: '1 student' },
  { label: 'Pair',       sub: '2 students' },
  { label: 'Group',      sub: '4–6 students' },
]
const PKG_PACKS = [
  { lessons: 1,  disc: '',     price: 25 },
  { lessons: 4,  disc: '-5%',  price: 24 },
  { lessons: 8,  disc: '-10%', price: 23, popular: true },
  { lessons: 12, disc: '-15%', price: 21 },
]

// ── Teachers mock data ────────────────────────────────────────────────────────

type MockTeacher = {
  id: string
  name: string
  initials: string
  title: string
  subjects: string[]
  langs: string[]
  experience: number
  levels: string
  color: string
}

const TEACHERS: MockTeacher[] = [
  { id: '1', name: 'Elizabeth Kivonen', initials: 'EK', title: 'Language Teacher', subjects: ['Estonian', 'English'], langs: ['RU', 'ET', 'EN'], experience: 8, levels: 'A1 – C1', color: 'from-blue-100 to-blue-200' },
  { id: '2', name: 'Arina Alekseeva', initials: 'AA', title: 'Mathematics Teacher', subjects: ['Math'], langs: ['RU', 'ET'], experience: 5, levels: 'Grade 2–12', color: 'from-purple-100 to-purple-200' },
  { id: '3', name: 'Dominika Fält', initials: 'DF', title: 'Language Teacher', subjects: ['Estonian', 'Russian'], langs: ['RU', 'ET'], experience: 6, levels: 'A1 – B2', color: 'from-green-100 to-green-200' },
  { id: '4', name: 'Mihhail Skvortsov', initials: 'MS', title: 'Language Teacher', subjects: ['English', 'Spanish'], langs: ['RU', 'EN'], experience: 4, levels: 'A1 – B2', color: 'from-rose-100 to-rose-200' },
  { id: '5', name: 'Aisaltan Emil', initials: 'AE', title: 'Language Teacher', subjects: ['English', 'Russian', 'Kyrgyz'], langs: ['RU', 'EN', 'KY'], experience: 3, levels: 'A1 – B2', color: 'from-amber-100 to-amber-200' },
  { id: '6', name: 'Artem Ivanof', initials: 'AI', title: 'Sciences Teacher', subjects: ['Physics', 'Chemistry'], langs: ['EN', 'ET', 'RU'], experience: 7, levels: 'Grade 7–12', color: 'from-teal-100 to-teal-200' },
]

const SUBJECT_COLORS: Record<string, string> = {
  Russian: 'bg-orange-100 text-orange-700',
  English: 'bg-blue-100 text-blue-700',
  Estonian: 'bg-green-100 text-green-700',
  Spanish: 'bg-rose-100 text-rose-700',
  Math: 'bg-purple-100 text-purple-700',
  Kyrgyz: 'bg-violet-100 text-violet-700',
  Physics: 'bg-sky-100 text-sky-700',
  Chemistry: 'bg-teal-100 text-teal-700',
}

const LANG_LABELS: Record<string, string> = {
  RU: 'Russian', ET: 'Estonian', EN: 'English', KY: 'Kyrgyz',
}

const ALL_SUBJECTS = ['Estonian', 'English', 'Russian', 'Spanish', 'Math', 'Kyrgyz', 'Physics', 'Chemistry']

// ── Shared sub-components ─────────────────────────────────────────────────────

function PkgPill({ label, active, small }: { label: string; active?: boolean; small?: boolean }) {
  const size = small ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  return (
    <span className={`${size} rounded-lg font-medium border whitespace-nowrap ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}>
      {label}
    </span>
  )
}

function PkgHeader({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
      <p className="text-gray-400 text-sm mt-1">{desc}</p>
    </div>
  )
}

function PkgFormatCards({ selected }: { selected: string }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {PKG_FORMATS.map(f => (
        <div key={f.label} className={`p-4 rounded-xl border-2 text-left ${f.label === selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <p className="font-semibold text-sm text-gray-900">{f.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{f.sub}</p>
        </div>
      ))}
    </div>
  )
}

function PkgPackCards() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {PKG_PACKS.map(p => (
        <div key={p.lessons} className={`relative p-4 rounded-xl border-2 ${p.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          {p.popular && <span className="absolute -top-2 left-3 text-[10px] font-bold bg-blue-500 text-white px-2 py-px rounded-full">Popular</span>}
          <p className="font-semibold text-sm text-gray-900">{p.lessons === 1 ? '1 lesson' : `${p.lessons} lessons`}</p>
          {p.disc && <p className="text-xs text-green-600 font-medium">{p.disc}</p>}
          <p className="text-xl font-bold text-gray-900 mt-1">{p.price}€</p>
          <p className="text-xs text-gray-400">/lesson</p>
        </div>
      ))}
    </div>
  )
}

function SubjectPill({ subject, small }: { subject: string; small?: boolean }) {
  return (
    <span className={`${SUBJECT_COLORS[subject] ?? 'bg-gray-100 text-gray-600'} ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-md font-medium`}>
      {subject}
    </span>
  )
}

function TeacherAvatar({ t, size = 'md' }: { t: MockTeacher; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = { sm: 'w-9 h-9 text-sm', md: 'w-14 h-14 text-xl', lg: 'w-20 h-20 text-2xl', xl: 'w-28 h-28 text-3xl' }
  return (
    <div className={`${sizes[size]} rounded-full flex-shrink-0 bg-gradient-to-br ${t.color} flex items-center justify-center ring-2 ring-white`}>
      <span className="font-semibold text-gray-700">{t.initials}</span>
    </div>
  )
}

// ── Teacher dashboard mock data ───────────────────────────────────────────────

const DB_AVAIL = [
  { day: 'Monday',    enabled: true,  start: '09:00', end: '18:00' },
  { day: 'Tuesday',   enabled: true,  start: '09:00', end: '18:00' },
  { day: 'Wednesday', enabled: true,  start: '09:00', end: '16:00' },
  { day: 'Thursday',  enabled: true,  start: '09:00', end: '18:00' },
  { day: 'Friday',    enabled: true,  start: '09:00', end: '14:00' },
  { day: 'Saturday',  enabled: true,  start: '10:00', end: '13:00' },
  { day: 'Sunday',    enabled: false, start: '08:00', end: '20:00' },
]

const DB_UPCOMING = [
  { id: '1', student: 'Masha Petrova',   subject: 'English',  date: 'Mon 23 Jun', time: '10:00', status: 'active', tg: '@masha_p' },
  { id: '2', student: 'Andrei Sokolov',  subject: 'Estonian', date: 'Tue 24 Jun', time: '14:00', status: 'active',  tg: null },
  { id: '3', student: 'Liisa Tamm',      subject: 'Estonian', date: 'Wed 25 Jun', time: '11:00', status: 'active', tg: '@liisa_t' },
  { id: '4', student: 'Viktor Nõmm',     subject: 'English',  date: 'Thu 26 Jun', time: '16:00', status: 'active', tg: null },
]

const DB_GROUPS = [
  { id: '1', subject: 'Estonian', lang: 'ru', level: 'A2', sessions: ['Mon 23 Jun', 'Mon 30 Jun', 'Mon 7 Jul', 'Mon 14 Jul'], time: '15:00', enrolled: 4, max: 6, status: 'active' },
  { id: '2', subject: 'English',  lang: 'ru', level: 'B1', sessions: ['Fri 27 Jun', 'Fri 4 Jul', 'Fri 11 Jul', 'Fri 18 Jul'], time: '11:00', enrolled: 2, max: 6, status: 'active' },
]

const DB_PREMADE = [
  { id: '1', name: 'Estonian for Beginners', subject: 'Estonian', lang: 'ru', level: 'A1', sessions: ['Mon 23 Jun 10:00', 'Wed 25 Jun 10:00', 'Mon 30 Jun 10:00', 'Wed 2 Jul 10:00', 'Mon 7 Jul 10:00', 'Wed 9 Jul 10:00'], enrolled: 5, max: 6, status: 'active' },
]

const SUBJECT_PILL_COLORS: Record<string, string> = {
  Russian: 'bg-orange-100 text-orange-700', English: 'bg-blue-100 text-blue-700',
  Estonian: 'bg-green-100 text-green-700',  Spanish: 'bg-rose-100 text-rose-700',
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    completed: 'bg-sky-100 text-sky-700',
    cancelled: 'bg-red-100 text-red-600',
  }
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
}

function DSubjectPill({ subject }: { subject: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${SUBJECT_PILL_COLORS[subject] ?? 'bg-gray-100 text-gray-600'}`}>{subject}</span>
}

function DLangPill({ lang }: { lang: string }) {
  const colors: Record<string, string> = { ru: 'bg-orange-100 text-orange-700', et: 'bg-green-100 text-green-700', en: 'bg-blue-100 text-blue-700', ky: 'bg-violet-100 text-violet-700' }
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${colors[lang] ?? 'bg-gray-100 text-gray-500'}`}>{lang.toUpperCase()}</span>
}

function DGoogleCalCard({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? '' : 'bg-white rounded-xl border border-gray-200 p-5'}>
      {!compact && <h3 className="font-semibold text-gray-800 mb-1 text-sm">Google Calendar</h3>}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
        <span className="text-xs text-gray-500">Calendar connected</span>
      </div>
      <a href="#" className="inline-flex items-center gap-1.5 mt-2 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
        <svg width="12" height="12" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
        Reconnect
      </a>
    </div>
  )
}

function DAvailGrid({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-2">
      {DB_AVAIL.map(row => (
        <div key={row.day} className="flex items-center gap-3">
          <div className={`relative inline-flex h-5 w-9 rounded-full flex-shrink-0 ${row.enabled ? 'bg-blue-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform mt-0.5 ${row.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className={`${compact ? 'w-20' : 'w-24'} text-sm text-gray-700 shrink-0`}>{compact ? row.day.slice(0, 3) : row.day}</span>
          {row.enabled
            ? <span className="text-xs text-gray-500">{row.start} – {row.end}</span>
            : <span className="text-xs text-gray-300">Unavailable</span>}
        </div>
      ))}
      <button className="mt-3 px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">Save</button>
    </div>
  )
}

function DUpcomingList({ limit }: { limit?: number }) {
  const items = limit ? DB_UPCOMING.slice(0, limit) : DB_UPCOMING
  return (
    <ul className="space-y-0 divide-y divide-gray-100">
      {items.map(b => (
        <li key={b.id} className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{b.student}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              <DSubjectPill subject={b.subject} /> <span className="ml-1">{b.date} · {b.time}</span>
            </p>
            {b.tg && <p className="text-[11px] text-sky-600 mt-0.5">{b.tg}</p>}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={b.status} />
            {b.status !== 'cancelled' && (
              <div className="flex gap-1">
                <button className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 text-red-400 border border-red-200 text-xs font-bold">✕</button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function DGroupList() {
  return (
    <div className="space-y-3">
      {DB_GROUPS.map(g => (
        <div key={g.id} className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <DSubjectPill subject={g.subject} />
              <DLangPill lang={g.lang} />
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{g.level}</span>
            </div>
            <StatusBadge status={g.status} />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {g.sessions.map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{s} · {g.time}</span>
            ))}
          </div>
          <p className="text-[11px] text-gray-400">{g.enrolled}/{g.max} enrolled</p>
        </div>
      ))}
      <button className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
        + New group
      </button>
    </div>
  )
}

function DPremadeList() {
  return (
    <div className="space-y-3">
      {DB_PREMADE.map(p => (
        <div key={p.id} className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{p.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <DSubjectPill subject={p.subject} />
                <DLangPill lang={p.lang} />
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{p.level}</span>
              </div>
            </div>
            <StatusBadge status={p.status} />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {p.sessions.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">{i + 1}. {s}</span>
            ))}
          </div>
          <p className="text-[11px] text-gray-400">{p.enrolled}/{p.max} enrolled</p>
        </div>
      ))}
      <button className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-purple-300 hover:text-purple-500 transition-colors">
        + New course
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Category = 'package' | 'teachers' | 'dashboard'
type PkgVariant = 'P1' | 'P2' | 'P3' | 'P4'
type TchVariant = 'T1' | 'T2' | 'T3' | 'T4'
type DshVariant = 'D1' | 'D2' | 'D3' | 'D4'

export default function DemoPage() {
  const [category, setCategory] = useState<Category>('dashboard')
  const [pkgVariant, setPkgVariant] = useState<PkgVariant>('P4')
  const [tchVariant, setTchVariant] = useState<TchVariant>('T1')
  const [dshVariant, setDshVariant] = useState<DshVariant>('D1')

  const PKG_VARIANTS: { id: PkgVariant; label: string; desc: string }[] = [
    { id: 'P1', label: 'P1', desc: 'Toolbar' },
    { id: 'P2', label: 'P2', desc: 'Sidebar' },
    { id: 'P3', label: 'P3', desc: 'Banner' },
    { id: 'P4', label: 'P4', desc: 'Summary sidebar' },
  ]

  const TCH_VARIANTS: { id: TchVariant; label: string; desc: string }[] = [
    { id: 'T1', label: 'T1', desc: 'Cards grid' },
    { id: 'T2', label: 'T2', desc: 'Profile panel' },
    { id: 'T3', label: 'T3', desc: 'Subject filter' },
    { id: 'T4', label: 'T4', desc: 'Magazine' },
  ]

  const DSH_VARIANTS: { id: DshVariant; label: string; desc: string }[] = [
    { id: 'D1', label: 'D1', desc: '2-column + stats' },
    { id: 'D2', label: 'D2', desc: 'Left sidebar nav' },
    { id: 'D3', label: 'D3', desc: 'Horizontal tabs' },
    { id: 'D4', label: 'D4', desc: 'Compact grid' },
  ]

  const CATEGORIES: { id: Category; label: string }[] = [
    { id: 'package',   label: 'Package page' },
    { id: 'teachers',  label: 'Teachers page' },
    { id: 'dashboard', label: 'Teacher dashboard' },
  ]

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Design proposals</h1>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${category === c.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {category === 'package' && (
          <>
            <div className="flex gap-2 mb-8 flex-wrap">
              {PKG_VARIANTS.map(v => (
                <button key={v.id} onClick={() => setPkgVariant(v.id)}
                  className={`px-4 py-2 rounded-xl border text-left transition-all ${pkgVariant === v.id ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
                  <p className="text-sm font-bold">{v.label}</p>
                  <p className={`text-xs mt-0.5 ${pkgVariant === v.id ? 'text-blue-100' : 'text-gray-400'}`}>{v.desc}</p>
                </button>
              ))}
            </div>
            {pkgVariant === 'P1' && <PackageP1 />}
            {pkgVariant === 'P2' && <PackageP2 />}
            {pkgVariant === 'P3' && <PackageP3 />}
            {pkgVariant === 'P4' && <PackageP4 />}
          </>
        )}

        {category === 'teachers' && (
          <>
            <div className="flex gap-2 mb-8 flex-wrap">
              {TCH_VARIANTS.map(v => (
                <button key={v.id} onClick={() => setTchVariant(v.id)}
                  className={`px-4 py-2 rounded-xl border text-left transition-all ${tchVariant === v.id ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
                  <p className="text-sm font-bold">{v.label}</p>
                  <p className={`text-xs mt-0.5 ${tchVariant === v.id ? 'text-blue-100' : 'text-gray-400'}`}>{v.desc}</p>
                </button>
              ))}
            </div>
            {tchVariant === 'T1' && <TeachersT1 />}
            {tchVariant === 'T2' && <TeachersT2 />}
            {tchVariant === 'T3' && <TeachersT3 />}
            {tchVariant === 'T4' && <TeachersT4 />}
          </>
        )}

        {category === 'dashboard' && (
          <>
            <div className="flex gap-2 mb-8 flex-wrap">
              {DSH_VARIANTS.map(v => (
                <button key={v.id} onClick={() => setDshVariant(v.id)}
                  className={`px-4 py-2 rounded-xl border text-left transition-all ${dshVariant === v.id ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
                  <p className="text-sm font-bold">{v.label}</p>
                  <p className={`text-xs mt-0.5 ${dshVariant === v.id ? 'text-blue-100' : 'text-gray-400'}`}>{v.desc}</p>
                </button>
              ))}
            </div>
            {dshVariant === 'D1' && <DashboardD1 />}
            {dshVariant === 'D2' && <DashboardD2 />}
            {dshVariant === 'D3' && <DashboardD3 />}
            {dshVariant === 'D4' && <DashboardD4 />}
          </>
        )}
      </div>
    </main>
  )
}

// ── D1 - 2-column layout + stat row ──────────────────────────────────────────
// Wider than current (max-w-3xl vs max-w-2xl). Top: 4 stat cards.
// Row 2: left col (GCal + Availability), right col (Upcoming lessons).
// Row 3: full-width sections for Groups + Premade side by side.

function DashboardD1() {
  return (
    <div className="bg-[#EEF2FF] rounded-2xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Elizabeth Kivonen</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold shadow-sm">
            {['EN', 'RU', 'ET'].map((l, i) => (
              <button key={l} className={`px-3 py-1.5 transition-colors ${i === 0 ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-600'}`}>{l}</button>
            ))}
          </div>
          <button className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Next lesson', value: 'Mon 10:00', sub: 'Masha Petrova · English', color: 'text-blue-600' },
          { label: 'This week', value: '4 lessons', sub: 'Confirmed', color: 'text-green-600' },
          { label: 'Pending', value: '1', sub: 'Needs confirmation', color: 'text-yellow-600' },
          { label: 'Active groups', value: '2', sub: '6 students enrolled', color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 2-col main row */}
      <div className="grid grid-cols-[1fr_1.4fr] gap-5 mb-5">
        {/* Left: GCal + Availability */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Google Calendar</h3>
            <DGoogleCalCard compact />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">My availability</h3>
            <DAvailGrid compact />
          </div>
        </div>
        {/* Right: Upcoming lessons */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Upcoming lessons ({DB_UPCOMING.length})</h3>
          </div>
          <DUpcomingList />
        </div>
      </div>

      {/* Bottom: Groups + Premade side by side */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Group sessions</h3>
          <DGroupList />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Premade courses</h3>
          <DPremadeList />
        </div>
      </div>
    </div>
  )
}

// ── D2 - Left sidebar navigation ─────────────────────────────────────────────
// Fixed left sidebar: avatar + name + nav items.
// Main area shows selected section. Feels like a real SaaS app.

function DashboardD2() {
  const [nav, setNav] = useState<'overview' | 'schedule' | 'groups' | 'premade' | 'settings'>('overview')

  const NAV = [
    { id: 'overview',  icon: '⊡', label: 'Overview' },
    { id: 'schedule',  icon: '⊙', label: 'Schedule' },
    { id: 'groups',    icon: '⊞', label: 'Group sessions' },
    { id: 'premade',   icon: '⊟', label: 'Premade courses' },
    { id: 'settings',  icon: '⊛', label: 'Course settings' },
  ] as const

  return (
    <div className="bg-[#EEF2FF] rounded-2xl overflow-hidden" style={{ minHeight: 700 }}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col">
          {/* Profile */}
          <div className="px-5 py-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3">
              <span className="font-semibold text-blue-700 text-lg">EK</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">Elizabeth Kivonen</p>
            <div className="flex gap-1 mt-1.5">
              <DSubjectPill subject="Estonian" />
              <DSubjectPill subject="English" />
            </div>
          </div>
          {/* Nav */}
          <nav className="flex-1 py-3">
            {NAV.map(item => (
              <button key={item.id} onClick={() => setNav(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${nav === item.id ? 'bg-blue-50 text-blue-600 font-semibold border-r-2 border-blue-500' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-2">
            <DGoogleCalCard compact />
            <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Sign out</button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white">
            <h2 className="font-semibold text-gray-900">{NAV.find(n => n.id === nav)?.label}</h2>
            <div className="flex bg-gray-100 rounded-lg overflow-hidden text-xs font-semibold">
              {['EN', 'RU', 'ET'].map((l, i) => (
                <button key={l} className={`px-3 py-1.5 transition-colors ${i === 0 ? 'bg-gray-800 text-white rounded-lg' : 'text-gray-500 hover:text-gray-700'}`}>{l}</button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {nav === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Next lesson', value: 'Mon 10:00', sub: 'Masha · English', color: 'text-blue-600' },
                    { label: 'This week',   value: '4 lessons', sub: 'All confirmed',   color: 'text-green-600' },
                    { label: 'Pending',     value: '1',         sub: 'Needs action',    color: 'text-yellow-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-4 text-sm">Upcoming lessons ({DB_UPCOMING.length})</h3>
                  <DUpcomingList />
                </div>
              </div>
            )}
            {nav === 'schedule' && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4 text-sm">My availability</h3>
                <DAvailGrid />
              </div>
            )}
            {nav === 'groups' && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4 text-sm">Group sessions</h3>
                <DGroupList />
              </div>
            )}
            {nav === 'premade' && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4 text-sm">Premade courses</h3>
                <DPremadeList />
              </div>
            )}
            {nav === 'settings' && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4 text-sm">Course settings</h3>
                <p className="text-sm text-gray-400">Formats, levels, and teaching languages per subject.</p>
                <div className="mt-4 space-y-4">
                  {[{ subj: 'Estonian', formats: ['Individual', 'Pair', 'Group', 'Premade'], levels: 'All levels' }, { subj: 'English', formats: ['Individual', 'Pair', 'Group', 'Premade'], levels: 'A1 – C1' }].map(s => (
                    <div key={s.subj} className="p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 mb-3"><DSubjectPill subject={s.subj} /><span className="text-xs text-gray-400">{s.levels}</span></div>
                      <div className="flex gap-2 flex-wrap">
                        {s.formats.map(f => <span key={f} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-medium">{f}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── D3 - Horizontal tabs ──────────────────────────────────────────────────────
// Current width (max-w-2xl feel but slightly wider). Clean horizontal tabs
// replace stacked cards. Each tab is focused on a single area.
// Minimal header, content changes per tab.

function DashboardD3() {
  const [tab, setTab] = useState<'upcoming' | 'schedule' | 'groups' | 'premade' | 'settings'>('upcoming')

  const TABS = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'groups',   label: 'Groups' },
    { id: 'premade',  label: 'Premade' },
    { id: 'settings', label: 'Settings' },
  ] as const

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <span className="font-semibold text-blue-700">EK</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Elizabeth Kivonen</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              <span className="text-[11px] text-gray-400">Calendar connected</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold shadow-sm">
            {['EN', 'RU', 'ET'].map((l, i) => (
              <button key={l} className={`px-3 py-1.5 ${i === 0 ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-600'}`}>{l}</button>
            ))}
          </div>
          <button className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 shadow-sm">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
            {t.label}
            {t.id === 'upcoming' && <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'} font-semibold`}>4</span>}
            {t.id === 'groups'   && <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'} font-semibold`}>2</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {tab === 'upcoming' && (
          <>
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Upcoming lessons</h3>
            <DUpcomingList />
          </>
        )}
        {tab === 'schedule' && (
          <>
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">My availability</h3>
            <p className="text-xs text-gray-400 mb-4">Outside these hours, no bookings are proposed to students.</p>
            <DAvailGrid />
          </>
        )}
        {tab === 'groups' && (
          <>
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Group sessions</h3>
            <DGroupList />
          </>
        )}
        {tab === 'premade' && (
          <>
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Premade courses</h3>
            <DPremadeList />
          </>
        )}
        {tab === 'settings' && (
          <>
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Course settings</h3>
            <div className="space-y-4">
              {[{ subj: 'Estonian', formats: ['Individual', 'Pair', 'Group', 'Premade'], levels: 'All levels' }, { subj: 'English', formats: ['Individual', 'Pair', 'Group', 'Premade'], levels: 'A1 – C1' }].map(s => (
                <div key={s.subj} className="p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3"><DSubjectPill subject={s.subj} /><span className="text-xs text-gray-400">{s.levels}</span></div>
                  <div className="flex gap-2 flex-wrap">
                    {s.formats.map(f => <span key={f} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-medium">{f}</span>)}
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Teaching languages</p>
                <div className="flex gap-2"><DLangPill lang="ru" /><DLangPill lang="et" /><DLangPill lang="en" /></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── D4 - Compact grid, max-w-2xl, dense ──────────────────────────────────────
// Same narrow width as current but better visual grouping.
// Top: inline header with stats pills. GCal status = 1 line in header.
// Availability = compact visual grid (colored dots per hour slot).
// Upcoming = full card with quick-action buttons more prominent.
// Groups + Premade = collapsed accordions by default.

function DashboardD4() {
  const [openGroup, setOpenGroup] = useState(false)
  const [openPremade, setOpenPremade] = useState(false)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0">
            <span className="font-semibold text-blue-700 text-sm">EK</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Elizabeth Kivonen</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[11px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>GCal</span>
              <span className="text-gray-200">|</span>
              <span className="text-[11px] font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">1 pending</span>
              <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">4 upcoming</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg overflow-hidden text-xs font-semibold">
            {['EN', 'RU', 'ET'].map((l, i) => (
              <button key={l} className={`px-2.5 py-1.5 ${i === 0 ? 'bg-gray-800 text-white rounded-lg' : 'text-gray-500 hover:text-gray-700'}`}>{l}</button>
            ))}
          </div>
          <button className="text-xs text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </div>

      {/* Upcoming lessons + Availability side by side */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Upcoming lessons</h3>
          <DUpcomingList limit={3} />
          {DB_UPCOMING.length > 3 && (
            <button className="mt-2 text-xs text-blue-500 hover:text-blue-700 font-medium">+{DB_UPCOMING.length - 3} more</button>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Availability</h3>
          <div className="space-y-1.5">
            {DB_AVAIL.map(row => (
              <div key={row.day} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${row.enabled ? 'bg-blue-400' : 'bg-gray-200'}`}></span>
                <span className="w-6 text-[11px] text-gray-500 shrink-0 font-medium">{row.day.slice(0, 2)}</span>
                {row.enabled
                  ? <span className="text-[11px] text-gray-600">{row.start} – {row.end}</span>
                  : <span className="text-[11px] text-gray-300">-</span>}
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
        </div>
      </div>

      {/* Group sessions - accordion */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button onClick={() => setOpenGroup(!openGroup)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm">Group sessions</span>
            <span className="text-[10px] bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">{DB_GROUPS.length} active</span>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${openGroup ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openGroup && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="pt-4"><DGroupList /></div>
          </div>
        )}
      </div>

      {/* Premade courses - accordion */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button onClick={() => setOpenPremade(!openPremade)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm">Premade courses</span>
            <span className="text-[10px] bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">{DB_PREMADE.length} active</span>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${openPremade ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openPremade && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="pt-4"><DPremadeList /></div>
          </div>
        )}
      </div>

      {/* Course settings - compact inline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm">Course settings</h3>
        <div className="space-y-3">
          {[{ subj: 'Estonian', formats: ['Individual', 'Pair', 'Group', 'Premade'], levels: 'All levels' }, { subj: 'English', formats: ['Individual', 'Pair', 'Group', 'Premade'], levels: 'A1 – C1' }].map(s => (
            <div key={s.subj} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              <DSubjectPill subject={s.subj} />
              <span className="text-[11px] text-gray-400 shrink-0">{s.levels}</span>
              <div className="flex gap-1 ml-auto flex-wrap justify-end">
                {s.formats.map(f => <span key={f} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">{f}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── T1 - Cards Grid ───────────────────────────────────────────────────────────
// Clean 3-column grid. Each card: avatar + name + title + subject pills + langs + experience.
// Hover: lift shadow. Click: blue ring selection + "Book now" CTA revealed.

function TeachersT1() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="bg-[#EEF2FF] rounded-2xl p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Our teachers</h2>
        <p className="text-gray-400 mt-1 text-sm">Choose a teacher and book your first lesson.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {TEACHERS.map(t => {
          const isSelected = selected === t.id
          return (
            <button key={t.id} onClick={() => setSelected(isSelected ? null : t.id)}
              className={`text-left p-5 rounded-2xl border-2 transition-all bg-white ${isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent shadow-sm hover:shadow-md hover:border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <TeacherAvatar t={t} size="md" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{t.name}</p>
                  <p className="text-[11px] text-blue-500 font-medium mt-0.5">{t.title}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {t.subjects.map(s => <SubjectPill key={s} subject={s} />)}
              </div>
              <div className="space-y-1.5 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-[11px] text-gray-500">{t.levels}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[11px] text-gray-500">{t.experience} years experience</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {t.langs.map(l => (
                    <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{l}</span>
                  ))}
                </div>
              </div>
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <button className="w-full py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl">
                    Book a lesson
                  </button>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── T2 - Left list + Right profile panel ──────────────────────────────────────
// Compact left list (avatar + name + subjects). Right panel shows full profile
// with large avatar, bio section, subject cards, teaching langs.

function TeachersT2() {
  const [selected, setSelected] = useState<MockTeacher>(TEACHERS[0])

  return (
    <div className="bg-[#EEF2FF] rounded-2xl p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Our teachers</h2>
        <p className="text-gray-400 mt-1 text-sm">Choose a teacher and book your first lesson.</p>
      </div>
      <div className="flex gap-5 items-start">
        {/* Left list */}
        <div className="w-64 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {TEACHERS.map((t, i) => {
            const isSelected = selected.id === t.id
            return (
              <button key={t.id}
                onClick={() => setSelected(t)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : 'border-l-2 border-transparent hover:bg-gray-50'} ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <TeacherAvatar t={t} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{t.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.subjects.slice(0, 2).map(s => <SubjectPill key={s} subject={s} small />)}
                    {t.subjects.length > 2 && <span className="text-[10px] text-gray-400">+{t.subjects.length - 2}</span>}
                  </div>
                </div>
                {isSelected && (
                  <svg className="w-4 h-4 text-blue-500 shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {/* Right profile panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            {/* Header */}
            <div className="flex items-start gap-5 mb-6 pb-6 border-b border-gray-100">
              <TeacherAvatar t={selected} size="xl" />
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-gray-900">{selected.name}</h3>
                <p className="text-blue-500 font-medium text-sm mt-0.5">{selected.title}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selected.subjects.map(s => <SubjectPill key={s} subject={s} />)}
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {selected.experience} years experience
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {selected.levels}
                  </span>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Teaches in</p>
                <div className="flex flex-wrap gap-2">
                  {selected.langs.map(l => (
                    <span key={l} className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-bold">{l}</span>
                      {LANG_LABELS[l]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Formats available</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Individual', 'Pair', 'Group'].map(f => (
                    <span key={f} className="text-xs px-2 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 font-medium">{f}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability hint */}
            <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-green-50 border border-green-100">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <p className="text-xs text-green-700 font-medium">Available this week. Slots visible on the booking page.</p>
            </div>

            <button className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors">
              Book a lesson with {selected.name.split(' ')[0]}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── T3 - Subject filter + filtered cards ──────────────────────────────────────
// Subject pill tabs at top (like booking page). Below: teacher cards filtered
// by selected subject, with an additional "All" tab. Compact horizontal cards.

function TeachersT3() {
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = selectedSubject === 'All'
    ? TEACHERS
    : TEACHERS.filter(t => t.subjects.includes(selectedSubject))

  const subjects = ['All', ...ALL_SUBJECTS.filter(s => TEACHERS.some(t => t.subjects.includes(s)))]

  return (
    <div className="bg-[#EEF2FF] rounded-2xl p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Our teachers</h2>
        <p className="text-gray-400 mt-1 text-sm">Filter by subject to find the right teacher for you.</p>
      </div>

      {/* Subject filter bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {subjects.map(s => {
          const isActive = selectedSubject === s
          return (
            <button key={s} onClick={() => setSelectedSubject(s)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${isActive
                ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                : s === 'All'
                  ? 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  : `${SUBJECT_COLORS[s]} border-transparent`
              }`}>
              {s}
              {s !== 'All' && (
                <span className={`ml-1.5 text-[10px] ${isActive ? 'text-blue-200' : 'text-current opacity-60'}`}>
                  {TEACHERS.filter(t => t.subjects.includes(s)).length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Teacher cards - horizontal layout */}
      <div className="space-y-3">
        {filtered.map(t => {
          const isSelected = selected === t.id
          return (
            <button key={t.id} onClick={() => setSelected(isSelected ? null : t.id)}
              className={`w-full text-left bg-white rounded-2xl border-2 transition-all shadow-sm ${isSelected ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-gray-200 hover:shadow-md'}`}>
              <div className="flex items-center gap-5 px-5 py-4">
                <TeacherAvatar t={t} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-blue-500 font-medium">{t.title}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {t.subjects.map(s => <SubjectPill key={s} subject={s} />)}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-4 text-sm text-gray-400">
                  <span className="hidden md:block">{t.levels}</span>
                  <div className="flex gap-1">
                    {t.langs.map(l => (
                      <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{l}</span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{t.experience}y exp</span>
                  <svg className={`w-4 h-4 text-gray-300 transition-transform ${isSelected ? 'rotate-90 text-blue-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {isSelected && (
                <div className="px-5 pb-5 border-t border-blue-100 mt-0 pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Teaches in</p>
                      <div className="flex flex-wrap gap-2">
                        {t.langs.map(l => (
                          <span key={l} className="text-xs text-gray-700 font-medium flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-bold">{l}</span>
                            {LANG_LABELS[l]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="px-6 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors">
                      Book a lesson
                    </button>
                  </div>
                </div>
              )}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No teachers found for this subject.</div>
        )}
      </div>
    </div>
  )
}

// ── T4 - Magazine layout ──────────────────────────────────────────────────────
// First teacher = hero card (full-width horizontal, large avatar, bio-style).
// Rest = 2-column grid of compact cards below.
// Editorial feel, "Meet our team" style.

function TeachersT4() {
  const [selected, setSelected] = useState<string | null>(null)
  const hero = TEACHERS[0]
  const rest = TEACHERS.slice(1)

  return (
    <div className="bg-[#EEF2FF] rounded-2xl p-8">
      <div className="mb-8">
        <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">Serfory Learning</p>
        <h2 className="text-3xl font-bold text-gray-900">Meet our teachers</h2>
        <p className="text-gray-400 mt-1 text-sm">Expert teachers, small groups, personal attention.</p>
      </div>

      {/* Hero card */}
      <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all mb-4 overflow-hidden cursor-pointer ${selected === hero.id ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-gray-200 hover:shadow-md'}`}
        onClick={() => setSelected(selected === hero.id ? null : hero.id)}>
        <div className="flex items-stretch">
          {/* Left colored band */}
          <div className={`w-2 shrink-0 bg-gradient-to-b ${hero.color}`} />
          <div className="flex items-center gap-8 p-7 flex-1">
            <TeacherAvatar t={hero} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{hero.name}</h3>
                  <p className="text-blue-500 font-medium text-sm mt-0.5">{hero.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {hero.experience} yrs
                  </span>
                  <span className="w-px h-3 bg-gray-200" />
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {hero.levels}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {hero.subjects.map(s => <SubjectPill key={s} subject={s} />)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {hero.langs.map(l => (
                    <span key={l} className="text-[10px] px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold">{l}</span>
                  ))}
                </div>
                <button className={`px-5 py-2 text-sm font-semibold rounded-xl transition-colors ${selected === hero.id ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white'}`}>
                  Book a lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest - 2-column grid */}
      <div className="grid grid-cols-2 gap-4">
        {rest.map(t => {
          const isSelected = selected === t.id
          return (
            <button key={t.id} onClick={() => setSelected(isSelected ? null : t.id)}
              className={`text-left bg-white rounded-2xl border-2 transition-all shadow-sm overflow-hidden ${isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-gray-200 hover:shadow-md'}`}>
              <div className="flex items-stretch">
                <div className={`w-1.5 shrink-0 bg-gradient-to-b ${t.color}`} />
                <div className="p-5 flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <TeacherAvatar t={t} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{t.name}</p>
                      <p className="text-[11px] text-blue-500 font-medium mt-0.5">{t.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {t.subjects.map(s => <SubjectPill key={s} subject={s} />)}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex gap-1">
                      {t.langs.map(l => (
                        <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{l}</span>
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400">{t.levels}</span>
                  </div>
                  {isSelected && (
                    <div className="mt-4 pt-3 border-t border-blue-100">
                      <button className="w-full py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl">
                        Book a lesson
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── P1 - Toolbar compact ──────────────────────────────────────────────────────

function PackageP1() {
  return (
    <div className="min-h-screen bg-[#EEF2FF] p-8 rounded-2xl">
      <div className="max-w-3xl mx-auto">
        <PkgHeader name="Hi Andrey, choose your package" desc="Select a format and number of lessons. You'll receive an invoice by email." />
        <div className="mb-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-start gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Course</p>
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">{PKG_LANG_COURSES.map((s, i) => <PkgPill key={s} label={s} active={i === 1} small />)}</div>
                <div className="flex flex-wrap gap-1.5">{PKG_OTHER_COURSES.map(s => <PkgPill key={s} label={s} small />)}</div>
              </div>
            </div>
            <div className="shrink-0">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Teaching language</p>
              <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700">
                <option>English</option><option>Estonian</option><option>Russian</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Grade</p>
              <div className="flex flex-wrap gap-1.5">{PKG_SCHOOL.map(g => <PkgPill key={g} label={g} small />)}</div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Level</p>
              <div className="flex gap-1.5">{PKG_CEFR.map((k, i) => <PkgPill key={k} label={k} active={i === 1} small />)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
          <div>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Format</p>
            <PkgFormatCards selected="Individual" />
          </div>
          <div className="border-t border-gray-100 pt-5">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Package</p>
            <PkgPackCards />
          </div>
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Total <span className="font-bold text-gray-900">200€</span></p>
            <button className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm">Confirm and receive invoice</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── P2 - Sidebar ──────────────────────────────────────────────────────────────

function PackageP2() {
  return (
    <div className="min-h-screen bg-[#EEF2FF] p-8 rounded-2xl">
      <div className="max-w-4xl mx-auto">
        <PkgHeader name="Hi Andrey, choose your package" desc="Select a format and number of lessons. You'll receive an invoice by email." />
        <div className="flex gap-5 items-stretch">
          <div className="w-56 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Course</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-1">Languages</p>
                  <div className="flex flex-wrap gap-1">{PKG_LANG_COURSES.map((s, i) => <PkgPill key={s} label={s} active={i === 1} small />)}</div>
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-1">Sciences</p>
                  <div className="flex flex-wrap gap-1">{PKG_OTHER_COURSES.map(s => <PkgPill key={s} label={s} small />)}</div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Teaching language</p>
              <select className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">
                <option>English</option>{PKG_LANGS.slice(1).map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Grade</p>
              <div className="grid grid-cols-2 gap-1">{PKG_SCHOOL.map(g => <PkgPill key={g} label={g} small />)}</div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Level</p>
              <div className="flex gap-1">{PKG_CEFR.map((k, i) => <PkgPill key={k} label={k} active={i === 1} small />)}</div>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col flex-1 justify-between">
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Format</p>
                <PkgFormatCards selected="Individual" />
              </div>
              <div className="border-t border-gray-100 pt-5">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Package</p>
                <PkgPackCards />
              </div>
              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">Total <span className="font-bold text-gray-900">200€</span></p>
                <button className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm">Confirm and receive invoice</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── P3 - Compact banner ───────────────────────────────────────────────────────

function PackageP3() {
  return (
    <div className="min-h-screen bg-[#EEF2FF] py-10 px-8 rounded-2xl">
      <div className="max-w-4xl mx-auto">
        <PkgHeader name="Hi Andrey, choose your package" desc="Select a format and number of lessons. You'll receive an invoice by email." />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 space-y-4">
          <div className="flex items-start gap-8">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Course</p>
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">{PKG_LANG_COURSES.map((s, i) => <PkgPill key={s} label={s} active={i === 1} />)}</div>
                <div className="flex flex-wrap gap-1.5">{PKG_OTHER_COURSES.map(s => <PkgPill key={s} label={s} />)}</div>
              </div>
            </div>
            <div className="shrink-0">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Teaching language</p>
              <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
                <option>English</option>{PKG_LANGS.slice(1).map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-x-8 gap-y-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Grade</p>
              <div className="flex flex-wrap gap-1.5">{PKG_SCHOOL.map(g => <PkgPill key={g} label={g} small />)}</div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Level</p>
              <div className="flex gap-1.5">{PKG_CEFR.map((k, i) => <PkgPill key={k} label={k} active={i === 1} small />)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Format</p>
          <PkgFormatCards selected="Individual" />
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Package</p>
            <PkgPackCards />
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Total <span className="font-bold text-gray-900 text-base">200€</span></p>
            <button className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm">Confirm and receive invoice</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── P4 - Summary sidebar ──────────────────────────────────────────────────────

function PackageP4() {
  return (
    <div className="min-h-screen bg-[#EEF2FF] py-10 px-8 rounded-2xl">
      <PkgHeader name="Hi Andrey, choose your package" desc="Select a format and number of lessons. You'll receive an invoice by email." />
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="grid grid-cols-[7fr_3fr] gap-6 items-start">
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Course</p>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">{PKG_LANG_COURSES.map((s, i) => <PkgPill key={s} label={s} active={i === 1} />)}</div>
                  <div className="flex flex-wrap gap-1.5">{PKG_OTHER_COURSES.map(s => <PkgPill key={s} label={s} />)}</div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Teaching language</p>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
                  <option>English</option>{PKG_LANGS.slice(1).map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-x-8 gap-y-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Grade</p>
                <div className="flex flex-wrap gap-1.5">{PKG_SCHOOL.map(g => <PkgPill key={g} label={g} small />)}</div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Level</p>
                <div className="flex gap-1.5">{PKG_CEFR.map((k, i) => <PkgPill key={k} label={k} active={i === 1} small />)}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Format</p>
            <PkgFormatCards selected="Individual" />
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mt-6 mb-3">Package</p>
            <PkgPackCards />
          </div>
        </div>
        <div className="w-72 shrink-0 sticky top-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your order</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Course</span>
                <span className="font-medium text-gray-800">English</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Level</span>
                <span className="font-medium text-gray-800">A2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Format</span>
                <span className="font-medium text-gray-800">Individual</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Package</span>
                <span className="font-medium text-gray-800">8 lessons</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
              <span className="text-xs text-gray-500">Total</span>
              <span className="text-xl font-bold text-gray-900">200€</span>
            </div>
            <button className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm">
              Confirm and receive invoice
            </button>
            <p className="text-[10px] text-center text-gray-400">Invoice sent to your email</p>
            <div className="border-t border-gray-100 pt-3 flex items-start gap-1.5">
              <svg className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
              <p className="text-[10px] text-gray-400 leading-snug">This link is personal. Please don&apos;t share it with others.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
