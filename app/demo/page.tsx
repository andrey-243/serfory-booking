'use client'

import { useState } from 'react'

type ParentStatus = 'to_contact' | 'contacted' | 'answered'
type Variant = 'B2' | 'D2' | 'B2A' | 'D2A'
type InvoiceApproach = 'A'
type InvGran = 'months' | 'weeks' | 'sessions'

type Booking = {
  id: string
  date: string
  subject: string
  teacher: string
  teacherInitials: string
  teacherColor: string
  teacherBg: string
  student: string
  amount: number
  status: 'confirmed' | 'pending' | 'cancelled'
}

type Student = {
  name: string
  email: string
  phone: string
  avatar: string
  prefs: ('telegram' | 'email')[]
  is_minor: boolean
  parent_name?: string
  parent_phone?: string
  parent_email?: string
  parent_prefs?: ('telegram')[]
  courses: { subject: string; teacher: string; teacherInitials: string; teacherColor: string; teacherBg: string; count: number }[]
}

const STUDENTS: Student[] = [
  {
    name: 'Sophie Dubois', email: 'sophie@gmail.com', phone: '+33612345678', avatar: 'SD', prefs: ['telegram'], is_minor: false,
    courses: [
      { subject: 'English', teacher: 'Elizabeth Kivonen', teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', count: 3 },
      { subject: 'English', teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700', teacherBg: 'bg-sky-100', count: 2 },
    ],
  },
  {
    name: 'Lucas Martin', email: 'lucas@gmail.com', phone: '+33698765432', avatar: 'LM', prefs: ['telegram'], is_minor: false,
    courses: [
      { subject: 'Estonian', teacher: 'Elizabeth Kivonen', teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', count: 2 },
      { subject: 'English', teacher: 'Elizabeth Kivonen', teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', count: 3 },
    ],
  },
  {
    name: 'Emma Leroy', email: 'emma@gmail.com', phone: '+33677889900', avatar: 'EL', prefs: ['email'], is_minor: true,
    parent_name: 'Marie Leroy', parent_phone: '+33644556677', parent_email: 'marie.leroy@gmail.com', parent_prefs: ['telegram'],
    courses: [
      { subject: 'Russian',  teacher: 'Dominika Fält', teacherInitials: 'DF', teacherColor: 'text-pink-700', teacherBg: 'bg-pink-100', count: 1 },
      { subject: 'Estonian', teacher: 'Dominika Fält', teacherInitials: 'DF', teacherColor: 'text-pink-700', teacherBg: 'bg-pink-100', count: 2 },
    ],
  },
  {
    name: 'Tom Bernard', email: 'tom@gmail.com', phone: '+33655443322', avatar: 'TB', prefs: ['telegram'], is_minor: false,
    courses: [
      { subject: 'Spanish', teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700', teacherBg: 'bg-sky-100', count: 2 },
      { subject: 'English', teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700', teacherBg: 'bg-sky-100', count: 1 },
    ],
  },
]

const BOOKINGS: Booking[] = [
  { id: 'm1',  date: '2026-05-05T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Sophie Dubois',  amount: 35, status: 'confirmed' },
  { id: 'm2',  date: '2026-05-07T14:00:00', subject: 'Estonian', teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'confirmed' },
  { id: 'm3',  date: '2026-05-09T11:00:00', subject: 'Russian',  teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 30, status: 'confirmed' },
  { id: 'm4',  date: '2026-05-12T10:00:00', subject: 'English',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Sophie Dubois',  amount: 35, status: 'confirmed' },
  { id: 'm5',  date: '2026-05-14T16:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'confirmed' },
  { id: 'm6',  date: '2026-05-19T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'confirmed' },
  { id: 'm7',  date: '2026-05-21T14:00:00', subject: 'Estonian', teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 35, status: 'confirmed' },
  { id: 'm8',  date: '2026-05-26T16:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'confirmed' },
  { id: 'j1',  date: '2026-06-02T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Sophie Dubois',  amount: 35, status: 'confirmed' },
  { id: 'j2',  date: '2026-06-04T14:00:00', subject: 'Estonian', teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'confirmed' },
  { id: 'j3',  date: '2026-06-04T15:00:00', subject: 'Russian',  teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 30, status: 'confirmed' },
  { id: 'j4',  date: '2026-06-06T10:00:00', subject: 'English',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Sophie Dubois',  amount: 35, status: 'pending'   },
  { id: 'j5',  date: '2026-06-09T16:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'confirmed' },
  { id: 'j6',  date: '2026-06-11T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'pending'   },
  { id: 'j7',  date: '2026-06-13T15:00:00', subject: 'Estonian', teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 35, status: 'pending'   },
  { id: 'j8',  date: '2026-06-16T14:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Sophie Dubois',  amount: 35, status: 'pending'   },
  { id: 'j9',  date: '2026-06-18T16:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'pending'   },
  { id: 'j10', date: '2026-06-23T11:00:00', subject: 'English',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Lucas Martin',   amount: 35, status: 'pending'   },
  { id: 'jl1', date: '2026-07-03T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Sophie Dubois',  amount: 35, status: 'pending' },
  { id: 'jl2', date: '2026-07-07T14:00:00', subject: 'Estonian', teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'pending' },
  { id: 'jl3', date: '2026-07-09T15:00:00', subject: 'Russian',  teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 30, status: 'pending' },
  { id: 'jl4', date: '2026-07-14T16:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'pending' },
  { id: 'jl5', date: '2026-07-16T10:00:00', subject: 'English',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Sophie Dubois',  amount: 35, status: 'pending' },
  { id: 'jl6', date: '2026-07-21T11:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'pending' },
  { id: 'au1', date: '2026-08-04T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Sophie Dubois',  amount: 35, status: 'pending' },
  { id: 'au2', date: '2026-08-06T14:00:00', subject: 'Estonian', teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'pending' },
  { id: 'au3', date: '2026-08-11T15:00:00', subject: 'Russian',  teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 30, status: 'pending' },
  { id: 'au4', date: '2026-08-13T16:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'pending' },
  { id: 'au5', date: '2026-08-18T10:00:00', subject: 'English',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Sophie Dubois',  amount: 35, status: 'pending' },
  { id: 'au6', date: '2026-08-20T11:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'pending' },
  { id: 'se1', date: '2026-09-01T10:00:00', subject: 'Russian',  teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 30, status: 'pending' },
  { id: 'se2', date: '2026-09-08T14:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'pending' },
  { id: 'oc1', date: '2026-10-05T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Sophie Dubois',  amount: 35, status: 'pending' },
  { id: 'oc2', date: '2026-10-12T14:00:00', subject: 'Estonian', teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'pending' },
  { id: 'no1', date: '2026-11-03T10:00:00', subject: 'Russian',  teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 30, status: 'pending' },
  { id: 'no2', date: '2026-11-10T16:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'pending' },
  { id: 'de1', date: '2026-12-01T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Sophie Dubois',  amount: 35, status: 'pending' },
  { id: 'de2', date: '2026-12-08T14:00:00', subject: 'Estonian', teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'pending' },
  { id: 'ja1', date: '2027-01-05T10:00:00', subject: 'Russian',  teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 30, status: 'pending' },
  { id: 'ja2', date: '2027-01-12T16:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Sophie Dubois',  amount: 35, status: 'pending' },
  { id: 'em_oc', date: '2026-10-07T10:00:00', subject: 'Estonian', teacher: 'Dominika Fält', teacherInitials: 'DF', teacherColor: 'text-pink-700', teacherBg: 'bg-pink-100', student: 'Emma Leroy', amount: 35, status: 'pending' },
  { id: 'em_de', date: '2026-12-03T10:00:00', subject: 'Russian',  teacher: 'Dominika Fält', teacherInitials: 'DF', teacherColor: 'text-pink-700', teacherBg: 'bg-pink-100', student: 'Emma Leroy', amount: 30, status: 'pending' },
  { id: 'em_fe', date: '2027-02-04T10:00:00', subject: 'Estonian', teacher: 'Dominika Fält', teacherInitials: 'DF', teacherColor: 'text-pink-700', teacherBg: 'bg-pink-100', student: 'Emma Leroy', amount: 35, status: 'pending' },
  { id: 'em_ma', date: '2027-03-05T10:00:00', subject: 'Russian',  teacher: 'Dominika Fält', teacherInitials: 'DF', teacherColor: 'text-pink-700', teacherBg: 'bg-pink-100', student: 'Emma Leroy', amount: 30, status: 'pending' },
  { id: 'em_ap', date: '2027-04-02T10:00:00', subject: 'Estonian', teacher: 'Dominika Fält', teacherInitials: 'DF', teacherColor: 'text-pink-700', teacherBg: 'bg-pink-100', student: 'Emma Leroy', amount: 35, status: 'pending' },
  { id: 'em_my', date: '2027-05-07T10:00:00', subject: 'Russian',  teacher: 'Dominika Fält', teacherInitials: 'DF', teacherColor: 'text-pink-700', teacherBg: 'bg-pink-100', student: 'Emma Leroy', amount: 30, status: 'pending' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const CYCLE: Record<ParentStatus, ParentStatus> = { to_contact: 'contacted', contacted: 'answered', answered: 'to_contact' }
const AVATAR_COLORS = ['bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700', 'bg-pink-100 text-pink-700', 'bg-emerald-100 text-emerald-700']
function avatarColor(name: string) { let h = 0; for (const c of name) h = (h + c.charCodeAt(0)) % AVATAR_COLORS.length; return AVATAR_COLORS[h] }
function parentDotColor(s: ParentStatus) { return s === 'answered' ? 'bg-green-400' : s === 'contacted' ? 'bg-amber-400' : 'bg-orange-400' }
function parentBtnClass(s: ParentStatus) { return s === 'answered' ? 'bg-green-100 text-green-700 border-green-200' : s === 'contacted' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-orange-50 text-orange-500 border-orange-200' }
function parentBtnLabel(s: ParentStatus) { return s === 'answered' ? '✓ Answered' : s === 'contacted' ? 'Contacted' : 'Mark contacted' }
function tgLink(phone: string) { return `https://t.me/+${phone.replace(/\D/g, '')}` }
function mlShort(key: string) { const [y, m] = key.split('-'); return new Date(+y, +m - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) }
function fd(iso: string) { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }

const SUBJECT_ABBR: Record<string, string> = {
  Russian: 'RU', English: 'EN', Estonian: 'ET', Spanish: 'ES', Math: 'MA',
}
function bookingStatus(b: Booking): string {
  if (b.status === 'cancelled') return 'cancelled'
  if (b.status === 'confirmed' && new Date(b.date) < new Date()) return 'provided'
  if (b.status === 'confirmed') return 'confirmed'
  return 'pending'
}
function statusColor(s: string): string {
  if (s === 'confirmed') return 'text-green-600'
  if (s === 'provided')  return 'text-blue-600'
  if (s === 'cancelled') return 'text-red-400'
  return 'text-amber-500'
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  Russian:  { bg: 'bg-pink-100',   text: 'text-pink-700'   },
  English:  { bg: 'bg-violet-100', text: 'text-violet-700' },
  Estonian: { bg: 'bg-teal-100',   text: 'text-teal-700'   },
  Spanish:  { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  Math:     { bg: 'bg-blue-100',   text: 'text-blue-700'   },
}
function subjectColor(subject: string) { return SUBJECT_COLORS[subject] ?? { bg: 'bg-gray-100', text: 'text-gray-700' } }

function weekStart(iso: string): string {
  const d = new Date(iso)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d.toISOString().slice(0, 10)
}
function weekRange(key: string): string {
  const mon = new Date(key)
  const sun = new Date(mon)
  sun.setDate(sun.getDate() + 6)
  const f = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${f(mon)} – ${f(sun)}`
}

// ── Contact buttons ───────────────────────────────────────────────────────────

function TgBtn({ phone, active }: { phone: string; active: boolean }) {
  return (
    <a href={tgLink(phone)} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${active ? 'bg-sky-500 text-white hover:bg-sky-600' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}>
      <TgIcon /> Telegram
    </a>
  )
}
function EmBtn({ email, active }: { email: string; active: boolean }) {
  return (
    <a href={`mailto:${email}`}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${active ? 'bg-violet-500 text-white hover:bg-violet-600' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}>
      <EmailIcon /> Email
    </a>
  )
}

// ── Circle toggle ─────────────────────────────────────────────────────────────

function CircleToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-4 h-4 rounded-full border-2 transition-all shrink-0 ${active ? 'bg-green-400 border-green-400' : 'bg-white border-gray-300 hover:border-green-300'}`}
    />
  )
}

// ── Multi-select dropdown ─────────────────────────────────────────────────────

function MultiSelectDropdown({ label, options, selected, onChange }: {
  label: string
  options: { value: string; label: string }[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [open, setOpen] = useState(false)
  const allSel = selected.size === options.length

  function toggle(v: string) { const n = new Set(selected); n.has(v) ? n.delete(v) : n.add(v); onChange(n) }
  function toggleAll() { onChange(allSel ? new Set() : new Set(options.map(o => o.value))) }

  const summary = allSel ? 'All' : selected.size === 0 ? 'None' : `${selected.size} of ${options.length}`

  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-[5]" onClick={() => setOpen(false)} />}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-xs px-3 py-1.5 rounded-lg border bg-white border-gray-200 hover:border-blue-200 text-gray-700 font-medium transition-colors">
        <span>{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-px rounded font-medium ${allSel ? 'text-gray-400' : 'bg-blue-100 text-blue-600'}`}>{summary}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
          <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer select-none text-[11px] text-gray-500">
            <input type="checkbox" checked={allSel} onChange={toggleAll} className="accent-blue-500 rounded" />
            All
          </label>
          <div className="border-t border-gray-100" />
          {options.map(o => (
            <label key={o.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer select-none text-[11px] text-gray-700">
              <input type="checkbox" checked={selected.has(o.value)} onChange={() => toggle(o.value)} className="accent-blue-500 rounded" />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Invoice builder ───────────────────────────────────────────────────────────

function InvoiceBuilder({
  studentName, allBookings, initialMonth, paidIds,
}: {
  studentName: string; allBookings: Booking[]; initialMonth: string | null; paidIds: Set<string>
}) {
  const [gran, setGran] = useState<InvGran>('months')
  const [invPaidIds,        setInvPaidIds]        = useState<Set<string>>(new Set())
  const [invInvoiceSentIds, setInvInvoiceSentIds] = useState<Set<string>>(new Set())

  const months      = [...new Set(allBookings.map(b => b.date.slice(0, 7)))].sort()
  const weeks       = [...new Set(allBookings.map(b => weekStart(b.date)))].sort()
  const allTeachers = [...new Set(allBookings.map(b => b.teacher))].sort()
  const allCourses  = [...new Set(allBookings.map(b => b.subject))].sort()

  const [selMonths,  setSelMonths]  = useState<Set<string>>(new Set(initialMonth ? [initialMonth] : months))
  const [selWeeks,   setSelWeeks]   = useState<Set<string>>(new Set(weeks))
  const [selIds,     setSelIds]     = useState<Set<string>>(new Set(allBookings.map(b => b.id)))
  const [statusSet,  setStatusSet]  = useState<Set<string>>(new Set(['confirmed', 'pending', 'cancelled']))
  const [paySet,     setPaySet]     = useState<Set<string>>(new Set(['received', 'not_received']))
  const [teacherSet, setTeacherSet] = useState<Set<string>>(new Set(allTeachers))
  const [courseSet,  setCourseSet]  = useState<Set<string>>(new Set(allCourses))

  function toggleM(k: string) { const n = new Set(selMonths); n.has(k) ? n.delete(k) : n.add(k); setSelMonths(n) }
  function toggleW(k: string) { const n = new Set(selWeeks);  n.has(k) ? n.delete(k) : n.add(k); setSelWeeks(n)  }
  function toggleS(k: string) { const n = new Set(selIds);    n.has(k) ? n.delete(k) : n.add(k); setSelIds(n)    }
  function allMon() { setSelMonths(selMonths.size === months.length ? new Set() : new Set(months)) }
  function allWk()  { setSelWeeks (selWeeks.size  === weeks.length  ? new Set() : new Set(weeks))  }
  function allSes() { setSelIds   (selIds.size     === allBookings.length ? new Set() : new Set(allBookings.map(b => b.id))) }

  function changeGran(g: InvGran) {
    setGran(g)
    if (g === 'months') setSelMonths(new Set(months))
    if (g === 'weeks')  setSelWeeks(new Set(weeks))
    if (g === 'sessions') setSelIds(new Set(allBookings.map(b => b.id)))
  }

  const filtered = allBookings.filter(b => {
    if (gran === 'months'   && !selMonths.has(b.date.slice(0, 7))) return false
    if (gran === 'weeks'    && !selWeeks.has(weekStart(b.date)))   return false
    if (gran === 'sessions' && !selIds.has(b.id))                  return false
    if (!statusSet.has(b.status))                                  return false
    const isPaid = paidIds.has(b.id)
    if ( isPaid && !paySet.has('received'))                        return false
    if (!isPaid && !paySet.has('not_received'))                    return false
    if (!teacherSet.has(b.teacher))                                return false
    if (!courseSet.has(b.subject))                                 return false
    return true
  }).sort((a, b) => a.date.localeCompare(b.date))

  const total = filtered.reduce((s, b) => s + b.amount, 0)
  const dates = filtered.map(b => b.date).sort()
  const period = dates.length === 0 ? '—'
    : dates[0].slice(0,7) === dates[dates.length-1].slice(0,7)
      ? mlShort(dates[0].slice(0,7))
      : `${mlShort(dates[0].slice(0,7))} – ${mlShort(dates[dates.length-1].slice(0,7))}`

  return (
    <div className="flex gap-5 min-h-[420px]">

      {/* ── Filters ── */}
      <div className="w-64 shrink-0 flex flex-col gap-3">

        <MultiSelectDropdown
          label="Status"
          options={[{value:'confirmed',label:'Confirmed'},{value:'pending',label:'Pending'},{value:'cancelled',label:'Cancelled'}]}
          selected={statusSet} onChange={setStatusSet}
        />
        <MultiSelectDropdown
          label="Payment"
          options={[{value:'received',label:'Received'},{value:'not_received',label:'Not received'}]}
          selected={paySet} onChange={setPaySet}
        />
        <MultiSelectDropdown
          label="Teacher"
          options={allTeachers.map(t => ({ value: t, label: t.split(' ')[0] }))}
          selected={teacherSet} onChange={setTeacherSet}
        />
        <MultiSelectDropdown
          label="Course"
          options={allCourses.map(c => ({ value: c, label: c }))}
          selected={courseSet} onChange={setCourseSet}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-2">Include</p>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-3 text-[11px]">
            {(['months','weeks','sessions'] as InvGran[]).map(g => (
              <button key={g} onClick={() => changeGran(g)}
                className={`flex-1 py-1.5 font-medium border-r last:border-r-0 border-gray-200 capitalize transition-colors ${gran === g ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {g === 'sessions' ? 'Sessions' : g === 'weeks' ? 'Weeks' : 'Months'}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1 min-h-0">
            {gran === 'months' && (
              <>
                <label className="flex items-center gap-2 text-[11px] text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={selMonths.size === months.length} onChange={allMon} className="accent-blue-500 rounded" />
                  All months
                </label>
                {months.map(mk => (
                  <label key={mk} className="flex items-center gap-2 text-[11px] text-gray-700 cursor-pointer select-none hover:text-gray-900">
                    <input type="checkbox" checked={selMonths.has(mk)} onChange={() => toggleM(mk)} className="accent-blue-500 rounded" />
                    {mlShort(mk)}
                  </label>
                ))}
              </>
            )}
            {gran === 'weeks' && (
              <>
                <label className="flex items-center gap-2 text-[11px] text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={selWeeks.size === weeks.length} onChange={allWk} className="accent-blue-500 rounded" />
                  All weeks
                </label>
                {weeks.map(wk => (
                  <label key={wk} className="flex items-center gap-2 text-[11px] text-gray-700 cursor-pointer select-none hover:text-gray-900">
                    <input type="checkbox" checked={selWeeks.has(wk)} onChange={() => toggleW(wk)} className="accent-blue-500 rounded" />
                    {weekRange(wk)}
                  </label>
                ))}
              </>
            )}
            {gran === 'sessions' && (
              <>
                <label className="flex items-center gap-2 text-[11px] text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={selIds.size === allBookings.length} onChange={allSes} className="accent-blue-500 rounded" />
                  All sessions
                </label>
                {allBookings.sort((a,b) => a.date.localeCompare(b.date)).map(b => (
                  <label key={b.id} className="flex items-center gap-2 text-[11px] text-gray-700 cursor-pointer select-none hover:text-gray-900">
                    <input type="checkbox" checked={selIds.has(b.id)} onChange={() => toggleS(b.id)} className="accent-blue-500 rounded" />
                    {fd(b.date)} · <span className={`font-medium ${subjectColor(b.subject).text}`}>{b.subject}</span>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Preview ── */}
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-3">
          <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-100">
            <div>
              <p className="text-lg font-bold text-gray-900">Invoice</p>
              <p className="text-xs text-gray-400 mt-0.5">Serfory Learning</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Student</p>
              <p className="text-sm font-semibold text-gray-900">{studentName}</p>
              <p className="text-xs text-gray-400 mt-1.5">Period: <span className="font-medium text-gray-700">{period}</span></p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No sessions match the filters</p>
          ) : (
            <>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase">
                    <th className="text-left pb-2 font-medium w-16">Date</th>
                    <th className="text-left pb-2 font-medium w-10">Course</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                    <th className="text-center pb-2 font-medium w-14">Invoice</th>
                    <th className="text-center pb-2 font-medium w-14">Payment</th>
                    <th className="text-right pb-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => {
                    const bStatus = bookingStatus(b)
                    return (
                      <tr key={b.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 text-gray-600 whitespace-nowrap">{fd(b.date)}</td>
                        <td className="py-1.5">
                          <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${subjectColor(b.subject).bg} ${subjectColor(b.subject).text}`}>
                            {SUBJECT_ABBR[b.subject] ?? b.subject}
                          </span>
                        </td>
                        <td className="py-1.5"><span className={`font-medium capitalize ${statusColor(bStatus)}`}>{bStatus}</span></td>
                        <td className="py-1.5 text-center"><CircleToggle active={invInvoiceSentIds.has(b.id)} onClick={() => { const n = new Set(invInvoiceSentIds); n.has(b.id) ? n.delete(b.id) : n.add(b.id); setInvInvoiceSentIds(n) }} /></td>
                        <td className="py-1.5 text-center"><CircleToggle active={invPaidIds.has(b.id)} onClick={() => { const n = new Set(invPaidIds); n.has(b.id) ? n.delete(b.id) : n.add(b.id); setInvPaidIds(n) }} /></td>
                        <td className="py-1.5 text-right font-bold text-gray-800">€{b.amount}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-400">{filtered.length} session{filtered.length !== 1 ? 's' : ''}</p>
                <p className="text-xl font-bold text-gray-900">€{total}</p>
              </div>
            </>
          )}
        </div>

        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors float-right">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print invoice
        </button>
        <div className="clear-both" />
      </div>
    </div>
  )
}

function InvoiceModal({ studentName, allBookings, initialMonth, paidIds, onClose }: {
  studentName: string; allBookings: Booking[]; initialMonth: string | null; paidIds: Set<string>; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-500">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p className="font-semibold text-gray-900 text-sm">Generate invoice — {studentName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="w-3.5 h-3.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6">
          <InvoiceBuilder studentName={studentName} allBookings={allBookings} initialMonth={initialMonth} paidIds={paidIds} />
        </div>
      </div>
    </div>
  )
}


// ── Per-student stats panel ───────────────────────────────────────────────────

function StudentStatsPanel({ studentName, invoiceApproach }: { studentName: string; invoiceApproach?: InvoiceApproach }) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())
  const [invoiceSentIds, setInvoiceSentIds] = useState<Set<string>>(new Set())
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)

  const allBookings = BOOKINGS.filter(b => b.student === studentName && b.status !== 'cancelled')
  const allBookingsInclCancelled = BOOKINGS.filter(b => b.student === studentName)

  const byMonth = allBookings.reduce<Record<string, typeof allBookings>>((acc, b) => {
    const mk = b.date.slice(0, 7);
    (acc[mk] = acc[mk] ?? []).push(b); return acc
  }, {})
  const months = Object.keys(byMonth).sort()
  const visibleMonths = months.slice(monthOffset, monthOffset + 12)
  const monthRows: string[][] = []
  for (let i = 0; i < visibleMonths.length; i += 6) monthRows.push(visibleMonths.slice(i, i + 6))
  const canScrollPrev = monthOffset > 0
  const canScrollNext = monthOffset + 12 < months.length

  const statsSource = selectedMonth ? (byMonth[selectedMonth] ?? []) : allBookings
  const total = statsSource.reduce((s, b) => s + b.amount, 0)
  const received = statsSource.filter(b => paidIds.has(b.id)).length
  const notReceived = statsSource.length - received
  const avg = statsSource.length ? Math.round(total / statsSource.length) : 0

  const displayedBookings = (selectedMonth
    ? allBookings.filter(b => b.date.startsWith(selectedMonth))
    : allBookings
  ).sort((a, b) => a.date.localeCompare(b.date))

  function mlFull(key: string) { const [y, m] = key.split('-'); return new Date(+y, +m-1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) }
  function togglePaid(id: string) { setPaidIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  function MonthPill({ mk }: { mk: string }) {
    const mbs = byMonth[mk]
    const mt = mbs.reduce((s, b) => s + b.amount, 0)
    const active = selectedMonth === mk
    return (
      <button onClick={() => setSelectedMonth(active ? null : mk)}
        className={`flex-1 rounded-lg border px-2 py-1.5 text-left transition-colors ${active ? 'border-blue-400 bg-blue-50' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
        <p className={`text-xs font-semibold whitespace-nowrap ${active ? 'text-blue-700' : 'text-gray-700'}`}>{mlShort(mk)}</p>
        <p className={`text-[10px] mt-0.5 whitespace-nowrap ${active ? 'text-blue-500' : 'text-gray-400'}`}>{mbs.length} · <span className="font-semibold">€{mt}</span></p>
      </button>
    )
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50/40">
      <div className="px-5 pt-3 pb-2">
        {/* Stats + months */}
        <div className="flex gap-3 items-stretch">
          <div className="flex flex-col gap-2 shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{statsSource.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Avg / session</p>
              <p className="text-2xl font-bold text-gray-900">{statsSource.length ? `€${avg}` : '—'}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 flex flex-col justify-center shrink-0">
            <div className="flex items-center justify-between gap-3 mb-0.5">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Revenue</p>
              {invoiceApproach === 'A' && (
                <button onClick={() => setInvoiceOpen(true)} title="Generate invoice"
                  className="w-5 h-5 flex items-center justify-center rounded text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </button>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">€{total}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{received} received · {notReceived} pending</p>
          </div>
          <div className="flex-1 flex gap-2 min-w-0 items-center">
            {canScrollPrev ? (
              <button onClick={() => setMonthOffset(o => Math.max(0, o - 12))}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="w-3 h-3"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
            ) : <div className="w-6 shrink-0" />}
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              {monthRows.map((row, ri) => (
                <div key={ri} className="flex gap-1.5">
                  {row.map(mk => <MonthPill key={mk} mk={mk} />)}
                </div>
              ))}
            </div>
            {canScrollNext ? (
              <button onClick={() => setMonthOffset(o => o + 12)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="w-3 h-3"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ) : <div className="w-6 shrink-0" />}
          </div>
        </div>
      </div>

      {/* Bookings table */}
      <div className="bg-white border-t border-gray-100 overflow-hidden">
        {selectedMonth && (
          <div className="px-5 py-2 border-b border-gray-100 bg-blue-50 flex items-center justify-between">
            <p className="text-xs font-medium text-blue-700">{mlFull(selectedMonth)}</p>
            <button onClick={() => setSelectedMonth(null)} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">Show all</button>
          </div>
        )}
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase">
              <th className="text-left px-5 py-2.5 font-medium w-16">Date</th>
              <th className="text-left px-3 py-2.5 font-medium w-10">Course</th>
              <th className="text-left px-3 py-2.5 font-medium">Teacher</th>
              <th className="text-left px-3 py-2.5 font-medium">Status</th>
              <th className="text-center px-3 py-2.5 font-medium w-14">Invoice</th>
              <th className="text-center px-3 py-2.5 font-medium w-14">Payment</th>
              <th className="text-right px-5 py-2.5 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayedBookings.map(b => {
              const bStatus = bookingStatus(b)
              return (
                <tr key={b.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2 text-gray-500 whitespace-nowrap">{fd(b.date)}</td>
                  <td className="px-3 py-2">
                    <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${subjectColor(b.subject).bg} ${subjectColor(b.subject).text}`}>
                      {SUBJECT_ABBR[b.subject] ?? b.subject}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{b.teacher.split(' ')[0]}</td>
                  <td className="px-3 py-2"><span className={`font-medium capitalize ${statusColor(bStatus)}`}>{bStatus}</span></td>
                  <td className="px-3 py-2 text-center"><CircleToggle active={invoiceSentIds.has(b.id)} onClick={() => { const n = new Set(invoiceSentIds); n.has(b.id) ? n.delete(b.id) : n.add(b.id); setInvoiceSentIds(n) }} /></td>
                  <td className="px-3 py-2 text-center"><CircleToggle active={paidIds.has(b.id)} onClick={() => togglePaid(b.id)} /></td>
                  <td className="px-5 py-2 text-right font-bold text-gray-800">€{b.amount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Approach A: invoice modal */}
      {invoiceApproach === 'A' && invoiceOpen && (
        <InvoiceModal studentName={studentName} allBookings={allBookingsInclCancelled} initialMonth={selectedMonth} paidIds={paidIds} onClose={() => setInvoiceOpen(false)} />
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [variant, setVariant] = useState<Variant>('B2A')
  const [parentStatus,   setParentStatus]   = useState<Record<string, ParentStatus>>({})
  const [expandedParent, setExpandedParent] = useState<Record<string, boolean>>({})
  const [expandedStats,  setExpandedStats]  = useState<Record<string, boolean>>({})
  const [statsModal,     setStatsModal]     = useState<string | null>(null)
  function toggleParent(email: string) { setExpandedParent(prev => ({ ...prev, [email]: !prev[email] })) }
  function toggleStats(email: string)  { setExpandedStats(prev => ({ ...prev, [email]: !prev[email] })) }
  function cycleParent(email: string)  { setParentStatus(prev => ({ ...prev, [email]: CYCLE[prev[email] ?? 'to_contact'] })) }

  const VARIANTS: { id: Variant; label: string; desc: string }[] = [
    { id: 'B2',  label: 'B2',     desc: 'Référence' },
    { id: 'D2',  label: 'D2',     desc: 'Référence' },
    { id: 'B2A', label: 'B2 × A', desc: 'Invoice modal' },
    { id: 'D2A', label: 'D2 × A', desc: 'Invoice modal' },
  ]

  // Shared B2 card renderer (used by B2, B2A, B2C)
  function renderB2(invoiceApproach?: InvoiceApproach) {
    return (
      <div className="space-y-3">
        {STUDENTS.map(s => {
          const pStatus = s.is_minor ? (parentStatus[s.email] ?? 'to_contact') : 'to_contact'
          const cardBorder = s.is_minor
            ? pStatus === 'answered' ? 'border-green-400' : pStatus === 'contacted' ? 'border-amber-400' : 'border-orange-400'
            : 'border-gray-200'
          const parentIconCls = pStatus === 'answered' ? 'bg-green-100 text-green-600' : pStatus === 'contacted' ? 'bg-amber-100 text-amber-600' : 'bg-orange-100 text-orange-500'
          return (
            <div key={s.email} className={`bg-white rounded-xl border-2 overflow-hidden flex flex-col transition-colors ${cardBorder}`}>
              <div className="flex items-stretch">
                <div className="flex items-center gap-3 px-5 py-3 min-w-60 border-r border-gray-100">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0 ${avatarColor(s.name)}`}>{s.avatar}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      {s.is_minor && <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-orange-50 text-orange-500 border border-orange-200">Minor</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{s.email}</p>
                    <p className="text-xs text-gray-400">{s.phone}</p>
                  </div>
                </div>
                <div className="flex items-center px-5 py-3 flex-1 border-r border-gray-100 gap-2 flex-wrap">
                  {s.courses.map((c, i) => (
                    <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${subjectColor(c.subject).bg} ${subjectColor(c.subject).text}`}>
                      <span>{c.teacherInitials}</span><span className="opacity-50">·</span><span>{c.subject}</span><span className="text-blue-500 font-bold ml-0.5">×{c.count}</span>
                    </div>
                  ))}
                </div>
                {s.is_minor ? (
                  <div className="flex items-center gap-3 px-5 py-3 min-w-56 border-r border-gray-100">
                    <div className="relative shrink-0 cursor-pointer" onClick={() => cycleParent(s.email)}>
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${parentIconCls}`}><ParentIcon /></span>
                      <StatusBadge pStatus={pStatus} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700">{s.parent_name}</p>
                      <p className="text-xs text-gray-400 mb-2">{s.parent_phone}</p>
                      <div className="flex flex-col gap-1 items-start">
                        <TgBtn phone={s.parent_phone!} active={s.parent_prefs?.includes('telegram') ?? true} />
                        <EmBtn email={s.parent_email!} active={false} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-56 border-r border-gray-100" />
                )}
                <div className="flex items-center px-5 py-3 gap-1.5 border-r border-gray-100">
                  <TgBtn phone={s.phone} active={s.prefs.includes('telegram')} />
                  <EmBtn email={s.email} active={s.prefs.includes('email')} />
                </div>
                <button onClick={() => toggleStats(s.email)}
                  className="flex items-center justify-center px-3 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform ${expandedStats[s.email] ? 'rotate-90' : ''}`}><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
              {expandedStats[s.email] && <StudentStatsPanel studentName={s.name} invoiceApproach={invoiceApproach} />}
            </div>
          )
        })}
      </div>
    )
  }

  // Shared D2 card renderer (used by D2, D2A, D2C)
  function renderD2(invoiceApproach?: InvoiceApproach) {
    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          {STUDENTS.map(s => {
            const pStatus = s.is_minor ? (parentStatus[s.email] ?? 'to_contact') : 'to_contact'
            const parentOpen = s.is_minor && !!expandedParent[s.email]
            const borderColor = s.is_minor
              ? pStatus === 'answered' ? 'border-green-300' : pStatus === 'contacted' ? 'border-amber-300' : 'border-orange-200'
              : 'border-gray-200'
            const ringColor = s.is_minor
              ? pStatus === 'answered' ? 'ring-green-400' : pStatus === 'contacted' ? 'ring-amber-400' : 'ring-orange-400'
              : ''
            const parentIconCls = pStatus === 'answered' ? 'bg-green-100 text-green-600' : pStatus === 'contacted' ? 'bg-amber-100 text-amber-600' : 'bg-orange-100 text-orange-500'
            return (
              <div key={s.email} className={`bg-white rounded-xl border-2 p-5 flex gap-0 overflow-hidden transition-colors ${borderColor}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    <button type="button" className="relative shrink-0 cursor-pointer focus:outline-none"
                      onClick={e => { e.stopPropagation(); setStatsModal(s.email) }}>
                      <span className={`inline-flex items-center justify-center w-11 h-11 rounded-full text-sm font-bold ${avatarColor(s.name)} ${s.is_minor ? `ring-2 ring-offset-1 ${ringColor}` : ''}`}>{s.avatar}</span>
                      {s.is_minor && <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-white ${parentDotColor(pStatus)}`} />}
                    </button>
                    <div>
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.email}</p>
                      <p className="text-xs text-gray-400">{s.phone}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {s.courses.map((c, i) => (
                      <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${subjectColor(c.subject).bg} ${subjectColor(c.subject).text}`}>
                        <span>{c.teacherInitials}</span><span className="opacity-50">·</span><span>{c.subject}</span><span className="text-blue-500 font-bold ml-0.5">×{c.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <TgBtn phone={s.phone} active={s.prefs.includes('telegram')} />
                    <EmBtn email={s.email} active={s.prefs.includes('email')} />
                  </div>
                </div>
                {s.is_minor && (
                  <div className="ml-4 flex flex-col items-end gap-3 shrink-0 min-w-[148px]">
                    <button type="button" className="relative cursor-pointer focus:outline-none"
                      onClick={e => { e.stopPropagation(); toggleParent(s.email) }}>
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${parentIconCls}`}><ParentIcon /></span>
                      <StatusBadge pStatus={pStatus} />
                    </button>
                    {parentOpen && (
                      <div className="border-t border-orange-100 pt-2.5 flex flex-col gap-2 items-start w-full">
                        <p className="text-sm font-semibold text-gray-700">{s.parent_name}</p>
                        <p className="text-xs text-gray-400 -mt-1">{s.parent_phone}</p>
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex flex-col gap-1 items-start">
                            <TgBtn phone={s.parent_phone!} active={s.parent_prefs?.includes('telegram') ?? true} />
                            <EmBtn email={s.parent_email!} active={false} />
                          </div>
                          <button onClick={e => { e.stopPropagation(); cycleParent(s.email) }} title={parentBtnLabel(pStatus)}
                            className={`ml-auto flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors shrink-0 ${pStatus === 'answered' ? 'bg-green-100 text-green-600 border-green-300' : pStatus === 'contacted' ? 'bg-amber-100 text-amber-600 border-amber-300' : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6 9 17l-5-5"/></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* D2 stats modal */}
        {statsModal && (() => {
          const s = STUDENTS.find(st => st.email === statsModal)
          if (!s) return null
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setStatsModal(null)}>
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold ${avatarColor(s.name)}`}>{s.avatar}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setStatsModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="w-4 h-4"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                <StudentStatsPanel studentName={s.name} invoiceApproach={invoiceApproach} />
              </div>
            </div>
          )
        })()}
      </>
    )
  }

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-screen-xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin — Design explorations</h1>
          <p className="text-xs text-gray-400 mt-0.5">Données fictives · mai 2026 – mai 2027</p>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {VARIANTS.map(v => (
            <button key={v.id} onClick={() => setVariant(v.id)}
              className={`px-4 py-2 rounded-xl border text-left transition-all ${variant === v.id ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
              <p className="text-sm font-bold">{v.label}</p>
              <p className={`text-xs mt-0.5 ${variant === v.id ? 'text-blue-100' : 'text-gray-400'}`}>{v.desc}</p>
            </button>
          ))}
        </div>

        {variant === 'B2'  && renderB2()}
        {variant === 'B2A' && renderB2('A')}

        {variant === 'D2'  && renderD2()}
        {variant === 'D2A' && renderD2('A')}

      </div>
    </main>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function StatusBadge({ pStatus }: { pStatus: ParentStatus }) {
  return (
    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center transition-colors ${pStatus === 'answered' ? 'bg-green-500' : pStatus === 'contacted' ? 'bg-amber-400' : 'bg-gray-400'}`}>
      {pStatus === 'to_contact' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" className="w-2 h-2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      ) : pStatus === 'contacted' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" className="w-2 h-2"><path d="M5 22h14M5 2h14M17 22v-4l-5-4 5-4V2M7 2v4l5 4-5 4v4"/></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2"><path d="M20 6 9 17l-5-5"/></svg>
      )}
    </span>
  )
}

function TgIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}
function EmailIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  )
}
function ParentIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
    </svg>
  )
}
