'use client'

import { useState } from 'react'

type ParentStatus = 'to_contact' | 'contacted' | 'answered'
type Variant = 'B1' | 'B2' | 'D1' | 'D2'

type Booking = {
  id: string
  date: string // ISO
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
  parent_prefs?: ('telegram')[]
  courses: { subject: string; teacher: string; teacherInitials: string; teacherColor: string; teacherBg: string; count: number }[]
}

const STUDENTS: Student[] = [
  {
    name: 'Sophie Dubois',
    email: 'sophie@gmail.com',
    phone: '+33612345678',
    avatar: 'SD',
    prefs: ['telegram'],
    is_minor: false,
    courses: [
      { subject: 'English', teacher: 'Elizabeth Kivonen', teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', count: 3 },
      { subject: 'English', teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700', teacherBg: 'bg-sky-100', count: 2 },
    ],
  },
  {
    name: 'Lucas Martin',
    email: 'lucas@gmail.com',
    phone: '+33698765432',
    avatar: 'LM',
    prefs: ['telegram'],
    is_minor: false,
    courses: [
      { subject: 'Estonian', teacher: 'Elizabeth Kivonen', teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', count: 2 },
      { subject: 'English', teacher: 'Elizabeth Kivonen', teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', count: 3 },
    ],
  },
  {
    name: 'Emma Leroy',
    email: 'emma@gmail.com',
    phone: '+33677889900',
    avatar: 'EL',
    prefs: ['email'],
    is_minor: true,
    parent_name: 'Marie Leroy',
    parent_phone: '+33644556677',
    parent_prefs: ['telegram'],
    courses: [
      { subject: 'Russian',  teacher: 'Dominika Fält', teacherInitials: 'DF', teacherColor: 'text-pink-700', teacherBg: 'bg-pink-100', count: 1 },
      { subject: 'Estonian', teacher: 'Dominika Fält', teacherInitials: 'DF', teacherColor: 'text-pink-700', teacherBg: 'bg-pink-100', count: 2 },
    ],
  },
  {
    name: 'Tom Bernard',
    email: 'tom@gmail.com',
    phone: '+33655443322',
    avatar: 'TB',
    prefs: ['telegram'],
    is_minor: false,
    courses: [
      { subject: 'Spanish', teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700', teacherBg: 'bg-sky-100', count: 2 },
      { subject: 'English', teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700', teacherBg: 'bg-sky-100', count: 1 },
    ],
  },
]

// ── Bookings mock data (May / June / July 2026) ───────────────────────────────

const BOOKINGS: Booking[] = [
  // May 2026
  { id: 'm1',  date: '2026-05-05T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Sophie Dubois',  amount: 35, status: 'confirmed' },
  { id: 'm2',  date: '2026-05-07T14:00:00', subject: 'Estonian', teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'confirmed' },
  { id: 'm3',  date: '2026-05-09T11:00:00', subject: 'Russian',  teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 30, status: 'confirmed' },
  { id: 'm4',  date: '2026-05-12T10:00:00', subject: 'English',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Sophie Dubois',  amount: 35, status: 'confirmed' },
  { id: 'm5',  date: '2026-05-14T16:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'confirmed' },
  { id: 'm6',  date: '2026-05-19T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'confirmed' },
  { id: 'm7',  date: '2026-05-21T14:00:00', subject: 'Estonian', teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 35, status: 'confirmed' },
  { id: 'm8',  date: '2026-05-26T16:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'confirmed' },
  // June 2026
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
  // July 2026
  { id: 'jl1', date: '2026-07-03T10:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Sophie Dubois',  amount: 35, status: 'pending' },
  { id: 'jl2', date: '2026-07-07T14:00:00', subject: 'Estonian', teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'pending' },
  { id: 'jl3', date: '2026-07-09T15:00:00', subject: 'Russian',  teacher: 'Dominika Fält',     teacherInitials: 'DF', teacherColor: 'text-pink-700',   teacherBg: 'bg-pink-100',   student: 'Emma Leroy',    amount: 30, status: 'pending' },
  { id: 'jl4', date: '2026-07-14T16:00:00', subject: 'Spanish',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Tom Bernard',   amount: 40, status: 'pending' },
  { id: 'jl5', date: '2026-07-16T10:00:00', subject: 'English',  teacher: 'Mihhail Skvortsov', teacherInitials: 'MS', teacherColor: 'text-sky-700',    teacherBg: 'bg-sky-100',    student: 'Sophie Dubois',  amount: 35, status: 'pending' },
  { id: 'jl6', date: '2026-07-21T11:00:00', subject: 'English',  teacher: 'Elizabeth Kivonen',  teacherInitials: 'EK', teacherColor: 'text-violet-700', teacherBg: 'bg-violet-100', student: 'Lucas Martin',   amount: 35, status: 'pending' },
]

const CYCLE: Record<ParentStatus, ParentStatus> = { to_contact: 'contacted', contacted: 'answered', answered: 'to_contact' }
const AVATAR_COLORS = ['bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700', 'bg-pink-100 text-pink-700', 'bg-emerald-100 text-emerald-700']
function avatarColor(name: string) { let h = 0; for (const c of name) h = (h + c.charCodeAt(0)) % AVATAR_COLORS.length; return AVATAR_COLORS[h] }
function parentDotColor(s: ParentStatus) { return s === 'answered' ? 'bg-green-400' : s === 'contacted' ? 'bg-amber-400' : 'bg-orange-400' }
function parentBtnClass(s: ParentStatus) { return s === 'answered' ? 'bg-green-100 text-green-700 border-green-200' : s === 'contacted' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-orange-50 text-orange-500 border-orange-200' }
function parentBtnLabel(s: ParentStatus) { return s === 'answered' ? '✓ Answered' : s === 'contacted' ? 'Contacted' : 'Mark contacted' }
function tgLink(phone: string) { return `https://t.me/+${phone.replace(/\D/g, '')}` }

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
function TgBtnIcon({ phone, active = true }: { phone: string; active?: boolean }) {
  return <a href={tgLink(phone)} target="_blank" rel="noopener noreferrer" className={`w-7 h-7 flex items-center justify-center rounded-full border transition-colors ${active ? 'bg-sky-500 text-white border-sky-500 hover:bg-sky-600' : 'bg-white text-sky-400 border-sky-200 hover:bg-sky-50'}`}><TgIcon className="w-3.5 h-3.5" /></a>
}
function EmBtnIcon({ email, active = true }: { email: string; active?: boolean }) {
  return <a href={`mailto:${email}`} className={`w-7 h-7 flex items-center justify-center rounded-full border transition-colors ${active ? 'bg-violet-500 text-white border-violet-500 hover:bg-violet-600' : 'bg-white text-violet-400 border-violet-200 hover:bg-violet-50'}`}><EmailIcon className="w-3.5 h-3.5" /></a>
}

// ── Per-student stats panel ───────────────────────────────────────────────────

function StudentStatsPanel({ studentName, visibleMonths = 3 }: { studentName: string; visibleMonths?: number }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())

  const allBookings = BOOKINGS.filter(b => b.student === studentName && b.status !== 'cancelled')
  const total = allBookings.reduce((s, b) => s + b.amount, 0)
  const confirmed = allBookings.filter(b => b.status === 'confirmed').length
  const pending = allBookings.filter(b => b.status === 'pending').length

  const byMonth = allBookings.reduce<Record<string, typeof allBookings>>((acc, b) => {
    const mk = b.date.slice(0, 7);
    (acc[mk] = acc[mk] ?? []).push(b); return acc
  }, {})
  const months = Object.keys(byMonth).sort()
  const canPrev = monthOffset > 0
  const canNext = monthOffset + visibleMonths < months.length
  const visibleSlice = months.slice(monthOffset, monthOffset + visibleMonths)

  const displayedBookings = (selectedMonth
    ? allBookings.filter(b => b.date.startsWith(selectedMonth))
    : allBookings
  ).sort((a, b) => a.date.localeCompare(b.date))

  function ml(key: string) { const [y, m] = key.split('-'); return new Date(+y, +m - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) }
  function fd(iso: string) { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
  function togglePaid(id: string) { setPaidIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  return (
    <div className="border-t border-gray-100 bg-gray-50/40 p-5">
      {/* Summary + month carousel */}
      <div className="flex items-start gap-3 mb-4 flex-wrap">
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 min-w-24 shrink-0">
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Sessions</p>
          <p className="text-2xl font-bold text-gray-900">{allBookings.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 min-w-28 shrink-0">
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Revenue</p>
          <p className="text-2xl font-bold text-gray-900">€{total}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{confirmed} confirmed · {pending} pending</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 min-w-24 shrink-0">
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Avg / session</p>
          <p className="text-2xl font-bold text-gray-900">{allBookings.length ? `€${Math.round(total / allBookings.length)}` : '—'}</p>
        </div>

        {/* Month carousel */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {canPrev && (
            <button onClick={() => setMonthOffset(o => o - 1)} className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="w-3 h-3"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {visibleSlice.map(mk => {
              const mbs = byMonth[mk]
              const mt = mbs.reduce((s, b) => s + b.amount, 0)
              const active = selectedMonth === mk
              return (
                <button key={mk} onClick={() => setSelectedMonth(active ? null : mk)}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${active ? 'border-blue-400 bg-blue-50' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
                  <p className={`text-xs font-semibold whitespace-nowrap ${active ? 'text-blue-700' : 'text-gray-700'}`}>{ml(mk)}</p>
                  <p className={`text-[10px] mt-0.5 whitespace-nowrap ${active ? 'text-blue-500' : 'text-gray-400'}`}>{mbs.length} sessions · <span className="font-semibold">€{mt}</span></p>
                </button>
              )
            })}
          </div>
          {canNext && (
            <button onClick={() => setMonthOffset(o => o + 1)} className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="w-3 h-3"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Bookings table — all by default, filtered when month selected */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {selectedMonth && (
          <div className="px-4 py-2 border-b border-gray-100 bg-blue-50 flex items-center justify-between">
            <p className="text-xs font-medium text-blue-700">{ml(selectedMonth)}</p>
            <button onClick={() => setSelectedMonth(null)} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">Show all</button>
          </div>
        )}
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase">
              <th className="text-left px-4 py-2.5 font-medium">Date</th>
              <th className="text-left px-4 py-2.5 font-medium">Course</th>
              <th className="text-left px-4 py-2.5 font-medium">Teacher</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 font-medium">Payment</th>
              <th className="text-right px-4 py-2.5 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayedBookings.map(b => {
              const isPaid = paidIds.has(b.id)
              return (
                <tr key={b.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{fd(b.date)}</td>
                  <td className="px-4 py-2"><span className={`font-semibold px-1.5 py-0.5 rounded ${b.teacherBg} ${b.teacherColor}`}>{b.subject}</span></td>
                  <td className="px-4 py-2 text-gray-600">{b.teacher.split(' ')[0]}</td>
                  <td className="px-4 py-2"><span className={`font-medium ${b.status === 'confirmed' ? 'text-green-600' : 'text-amber-500'}`}>{b.status}</span></td>
                  <td className="px-4 py-2">
                    <button onClick={() => togglePaid(b.id)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                      {isPaid ? '✓ Received' : 'Received?'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-gray-800">€{b.amount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' + d.toTimeString().slice(0, 5)
}
function monthKey(iso: string) { return iso.slice(0, 7) } // "2026-06"
function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default function DemoPage() {
  const [variant, setVariant] = useState<Variant>('B1')
  const [parentStatus, setParentStatus] = useState<Record<string, ParentStatus>>({})
  const [expandedParent, setExpandedParent] = useState<Record<string, boolean>>({})
  const [expandedStats, setExpandedStats] = useState<Record<string, boolean>>({})
  const [statsModal, setStatsModal] = useState<string | null>(null)
  function toggleParent(email: string) { setExpandedParent(prev => ({ ...prev, [email]: !prev[email] })) }
  function toggleStats(email: string) { setExpandedStats(prev => ({ ...prev, [email]: !prev[email] })) }

  function cycleParent(email: string) {
    setParentStatus(prev => ({ ...prev, [email]: CYCLE[prev[email] ?? 'to_contact'] }))
  }


  const VARIANTS: { id: Variant; label: string; desc: string }[] = [
    { id: 'B1', label: 'B1 ★', desc: 'Sections avec séparateurs' },
    { id: 'B2', label: 'B2', desc: 'B1 + icônes rondes' },
    { id: 'D1', label: 'D1 ★', desc: 'Grille 2 col, layout standard' },
    { id: 'D2', label: 'D2', desc: 'Grille 2 col, icônes rondes' },
  ]

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-screen-xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin — Design explorations</h1>
          <p className="text-xs text-gray-400 mt-0.5">Données fictives · mai–juillet 2026</p>
        </div>


        {/* Variant switcher */}
        <div className="flex gap-2 mb-8">
          {VARIANTS.map(v => (
            <button key={v.id} onClick={() => setVariant(v.id)}
              className={`px-5 py-2.5 rounded-xl border text-left transition-all ${variant === v.id ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
              <p className="text-sm font-bold">{v.label}</p>
              <p className={`text-xs mt-0.5 ${variant === v.id ? 'text-blue-100' : 'text-gray-400'}`}>{v.desc}</p>
            </button>
          ))}
        </div>

        {/* ── B1 — Card with dividers ─────────────────────────────────────────── */}
        {variant === 'B1' && (
          <div className="space-y-3">
            {STUDENTS.map(s => {
              const pStatus = s.is_minor ? (parentStatus[s.email] ?? 'to_contact') : 'to_contact'
              return (
                <div key={s.email} className={`bg-white rounded-xl border overflow-hidden flex items-stretch ${s.is_minor ? 'border-orange-200' : 'border-gray-200'}`}>
                  {/* Minor accent bar */}
                  {s.is_minor && <div className={`w-1 shrink-0 ${parentDotColor(pStatus)}`} />}

                  {/* Identity */}
                  <div className="flex items-center gap-3 px-5 py-4 min-w-60 border-r border-gray-100">
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

                  {/* Courses */}
                  <div className="flex items-center px-5 py-4 flex-1 border-r border-gray-100 gap-2 flex-wrap">
                    {s.courses.map((c, i) => (
                      <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${c.teacherBg} ${c.teacherColor}`}>
                        <span>{c.teacherInitials}</span>
                        <span className="opacity-50">·</span>
                        <span>{c.subject}</span>
                        <span className="text-blue-500 font-bold ml-0.5">×{c.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Contact student */}
                  <div className="flex items-center px-5 py-4 gap-1.5 border-r border-gray-100">
                    <TgBtn phone={s.phone} active={s.prefs.includes('telegram')} />
                    <EmBtn email={s.email} active={s.prefs.includes('email')} />
                  </div>

                  {/* Parent */}
                  {s.is_minor ? (
                    <div className="flex items-center gap-3 px-5 py-4 min-w-64 bg-orange-50/30">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-500 shrink-0"><ParentIcon /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700">{s.parent_name}</p>
                        <p className="text-xs text-gray-400 mb-1.5">{s.parent_phone}</p>
                        <div className="flex gap-1.5 mb-1.5">
                          <TgBtn phone={s.parent_phone!} active={s.parent_prefs?.includes('telegram') ?? true} />
                        </div>
                        <button onClick={() => cycleParent(s.email)}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${parentBtnClass(pStatus)}`}>
                          {parentBtnLabel(pStatus)}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── B2 — full CTAs, parent row below, status = border + parent icon ── */}
        {variant === 'B2' && (
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

                  {/* Identity */}
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

                  {/* Courses */}
                  <div className="flex items-center px-5 py-3 flex-1 border-r border-gray-100 gap-2 flex-wrap">
                    {s.courses.map((c, i) => (
                      <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${c.teacherBg} ${c.teacherColor}`}>
                        <span>{c.teacherInitials}</span>
                        <span className="opacity-50">·</span>
                        <span>{c.subject}</span>
                        <span className="text-blue-500 font-bold ml-0.5">×{c.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Parent/tutor column — col 3 */}
                  {s.is_minor ? (
                    <div className="flex items-start gap-3 px-5 py-3 min-w-56 border-r border-gray-100">
                      {/* Parent icon + status cycle badge — click anywhere on icon to cycle */}
                      <div className="relative shrink-0 mt-0.5 cursor-pointer" onClick={() => cycleParent(s.email)}>
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${parentIconCls}`}><ParentIcon /></span>
                        <span
                          title={parentBtnLabel(pStatus)}
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center transition-colors ${
                            pStatus === 'answered' ? 'bg-green-500' : pStatus === 'contacted' ? 'bg-amber-400' : 'bg-gray-400'
                          }`}
                        >
                          {pStatus === 'to_contact' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" className="w-2 h-2">
                              <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                          ) : pStatus === 'contacted' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" className="w-2 h-2">
                              <path d="M5 22h14M5 2h14M17 22v-4l-5-4 5-4V2M7 2v4l5 4-5 4v4" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-700">{s.parent_name}</p>
                        <p className="text-xs text-gray-400 mb-2">{s.parent_phone}</p>
                        <TgBtn phone={s.parent_phone!} active={s.parent_prefs?.includes('telegram') ?? true} />
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-56 border-r border-gray-100" />
                  )}

                  {/* Student contacts — col 4 */}
                  <div className="flex items-center px-5 py-3 gap-1.5 border-r border-gray-100">
                    <TgBtn phone={s.phone} active={s.prefs.includes('telegram')} />
                    <EmBtn email={s.email} active={s.prefs.includes('email')} />
                  </div>

                  {/* Expand stats — col 5 */}
                  <button onClick={() => toggleStats(s.email)}
                    className="flex items-center justify-center px-3 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform ${expandedStats[s.email] ? 'rotate-90' : ''}`}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  </div>

                  {/* Per-student stats panel */}
                  {expandedStats[s.email] && <StudentStatsPanel studentName={s.name} visibleMonths={12} />}
                </div>
              )
            })}
          </div>
        )}

        {/* ── D1 — Grid 2col, standard card ──────────────────────────────────── */}
        {variant === 'D1' && (
          <div className="grid grid-cols-2 gap-4">
            {STUDENTS.map(s => {
              const pStatus = s.is_minor ? (parentStatus[s.email] ?? 'to_contact') : 'to_contact'
              return (
                <div key={s.email} className="bg-white rounded-xl border border-gray-200 p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className={`inline-flex items-center justify-center w-11 h-11 rounded-full text-sm font-bold ${avatarColor(s.name)}`}>{s.avatar}</span>
                        {s.is_minor && (
                          <button onClick={() => cycleParent(s.email)}
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${parentDotColor(pStatus)}`} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.email}</p>
                        <p className="text-xs text-gray-400">{s.phone}</p>
                      </div>
                    </div>
                    {s.is_minor && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200">Minor</span>}
                  </div>

                  {/* Courses */}
                  <div className="mb-4">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1.5 tracking-wide">Courses</p>
                    <div className="flex flex-wrap gap-1.5">
                      {s.courses.map((c, i) => (
                        <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${c.teacherBg} ${c.teacherColor}`}>
                          <span>{c.teacherInitials}</span>
                          <span className="opacity-50">·</span>
                          <span>{c.subject}</span>
                          <span className="text-blue-500 font-bold ml-0.5">×{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex gap-1.5 flex-wrap">
                    <TgBtn phone={s.phone} active={s.prefs.includes('telegram')} />
                    <EmBtn email={s.email} active={s.prefs.includes('email')} />
                  </div>

                  {/* Parent */}
                  {s.is_minor && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-500 shrink-0"><ParentIcon /></span>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">{s.parent_name}</p>
                            <p className="text-xs text-gray-400">{s.parent_phone}</p>
                          </div>
                        </div>
                        <button onClick={() => cycleParent(s.email)}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${parentBtnClass(pStatus)}`}>
                          {parentBtnLabel(pStatus)}
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <TgBtn phone={s.parent_phone!} active={s.parent_prefs?.includes('telegram') ?? true} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── D2 — Grid 2col, parent panel à droite ─── */}
        {variant === 'D2' && (
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

                  {/* ── Colonne gauche : étudiant ── */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Student avatar — click to open stats modal */}
                      <div className="relative shrink-0 cursor-pointer" onClick={() => setStatsModal(s.email)}>
                        <span className={`inline-flex items-center justify-center w-11 h-11 rounded-full text-sm font-bold ${avatarColor(s.name)} ${s.is_minor ? `ring-2 ring-offset-1 ${ringColor}` : ''}`}>{s.avatar}</span>
                        {s.is_minor && <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-white ${parentDotColor(pStatus)}`} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.email}</p>
                        <p className="text-xs text-gray-400">{s.phone}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {s.courses.map((c, i) => (
                        <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${c.teacherBg} ${c.teacherColor}`}>
                          <span>{c.teacherInitials}</span>
                          <span className="opacity-50">·</span>
                          <span>{c.subject}</span>
                          <span className="text-blue-500 font-bold ml-0.5">×{c.count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <TgBtn phone={s.phone} active={s.prefs.includes('telegram')} />
                      <EmBtn email={s.email} active={s.prefs.includes('email')} />
                    </div>
                  </div>

                  {/* ── Colonne droite : parent icon toggle (top-right) ── */}
                  {s.is_minor && (
                    <div className="ml-4 flex flex-col items-end gap-3 shrink-0 min-w-[140px]">
                      {/* Parent icon — click to toggle parent panel */}
                      <div className="relative cursor-pointer" onClick={() => toggleParent(s.email)}>
                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${parentIconCls}`}><ParentIcon /></span>
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center transition-colors ${pStatus === 'answered' ? 'bg-green-500' : pStatus === 'contacted' ? 'bg-amber-400' : 'bg-gray-400'}`}>
                          {pStatus === 'to_contact' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" className="w-2 h-2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                          ) : pStatus === 'contacted' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" className="w-2 h-2"><path d="M5 22h14M5 2h14M17 22v-4l-5-4 5-4V2M7 2v4l5 4-5 4v4" /></svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2"><path d="M20 6 9 17l-5-5" /></svg>
                          )}
                        </span>
                      </div>

                      {/* Parent panel */}
                      {parentOpen && (
                        <div className="border-t border-orange-100 pt-2.5 flex flex-col gap-2 items-start w-full">
                          <p className="text-sm font-semibold text-gray-700">{s.parent_name}</p>
                          <p className="text-xs text-gray-400 -mt-1">{s.parent_phone}</p>
                          <TgBtn phone={s.parent_phone!} active={s.parent_prefs?.includes('telegram') ?? true} />
                          {/* Status cycle — click badge icon */}
                          <button onClick={() => cycleParent(s.email)}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors w-fit ${parentBtnClass(pStatus)}`}>
                            {parentBtnLabel(pStatus)}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* D2 stats modal */}
      {statsModal && (() => {
        const s = STUDENTS.find(st => st.email === statsModal)!
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setStatsModal(null)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold ${avatarColor(s.name)}`}>{s.avatar}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </div>
                </div>
                <button onClick={() => setStatsModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="w-4 h-4">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <StudentStatsPanel studentName={s.name} visibleMonths={2} />
            </div>
          </div>
        )
      })()}
    </main>
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
