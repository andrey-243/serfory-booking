'use client'

import { Fragment, useState, useMemo } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id: string
  subject: string
  slot_start: string
  student_name: string
  student_email: string
  student_phone: string
  contact_pref: string
  is_minor: boolean
  parent_name: string | null
  parent_contact: string | null
  status: string
  teacher: string
}

type Combo = { subject: string; teacher: string; count: number }

type StudentRow = {
  name: string
  email: string
  phone: string
  prefs: string[]
  is_minor: boolean
  parent_name: string | null
  parent_contact: string | null
  total: number
  combos: Combo[]
}

type ParentStatus = 'to_contact' | 'contacted' | 'answered'

// ── Demo data ────────────────────────────────────────────────────────────────
// Covers: same course × different teachers, different courses × same teacher, minor with parent

const DEMO: Booking[] = [
  // Sophie — English with 2 different teachers (Elizabeth ×3, Mihhail ×2)
  { id: 'b1', subject: 'English', slot_start: '2026-06-02T10:00:00', student_name: 'Sophie Dubois', student_email: 'sophie@gmail.com', student_phone: '+33612345678', contact_pref: 'whatsapp', is_minor: false, parent_name: null, parent_contact: null, status: 'confirmed', teacher: 'Elizabeth Kivonen' },
  { id: 'b2', subject: 'English', slot_start: '2026-06-04T10:00:00', student_name: 'Sophie Dubois', student_email: 'sophie@gmail.com', student_phone: '+33612345678', contact_pref: 'whatsapp', is_minor: false, parent_name: null, parent_contact: null, status: 'confirmed', teacher: 'Elizabeth Kivonen' },
  { id: 'b3', subject: 'English', slot_start: '2026-06-06T10:00:00', student_name: 'Sophie Dubois', student_email: 'sophie@gmail.com', student_phone: '+33612345678', contact_pref: 'whatsapp', is_minor: false, parent_name: null, parent_contact: null, status: 'pending',   teacher: 'Elizabeth Kivonen' },
  { id: 'b4', subject: 'English', slot_start: '2026-06-03T14:00:00', student_name: 'Sophie Dubois', student_email: 'sophie@gmail.com', student_phone: '+33612345678', contact_pref: 'whatsapp', is_minor: false, parent_name: null, parent_contact: null, status: 'confirmed', teacher: 'Mihhail Skvortsov' },
  { id: 'b5', subject: 'English', slot_start: '2026-06-05T14:00:00', student_name: 'Sophie Dubois', student_email: 'sophie@gmail.com', student_phone: '+33612345678', contact_pref: 'whatsapp', is_minor: false, parent_name: null, parent_contact: null, status: 'pending',   teacher: 'Mihhail Skvortsov' },

  // Lucas — different courses × same teacher (Elizabeth: Estonian ×2 + English ×3)
  { id: 'b6',  subject: 'Estonian', slot_start: '2026-06-02T11:00:00', student_name: 'Lucas Martin', student_email: 'lucas@gmail.com', student_phone: '+33698765432', contact_pref: 'telegram', is_minor: false, parent_name: null, parent_contact: null, status: 'confirmed', teacher: 'Elizabeth Kivonen' },
  { id: 'b7',  subject: 'Estonian', slot_start: '2026-06-04T11:00:00', student_name: 'Lucas Martin', student_email: 'lucas@gmail.com', student_phone: '+33698765432', contact_pref: 'telegram', is_minor: false, parent_name: null, parent_contact: null, status: 'pending',   teacher: 'Elizabeth Kivonen' },
  { id: 'b8',  subject: 'English',  slot_start: '2026-06-03T11:00:00', student_name: 'Lucas Martin', student_email: 'lucas@gmail.com', student_phone: '+33698765432', contact_pref: 'telegram', is_minor: false, parent_name: null, parent_contact: null, status: 'confirmed', teacher: 'Elizabeth Kivonen' },
  { id: 'b9',  subject: 'English',  slot_start: '2026-06-05T11:00:00', student_name: 'Lucas Martin', student_email: 'lucas@gmail.com', student_phone: '+33698765432', contact_pref: 'telegram', is_minor: false, parent_name: null, parent_contact: null, status: 'confirmed', teacher: 'Elizabeth Kivonen' },
  { id: 'b10', subject: 'English',  slot_start: '2026-06-07T11:00:00', student_name: 'Lucas Martin', student_email: 'lucas@gmail.com', student_phone: '+33698765432', contact_pref: 'telegram', is_minor: false, parent_name: null, parent_contact: null, status: 'pending',   teacher: 'Elizabeth Kivonen' },

  // Emma — minor, different courses × same teacher (Dominika: Russian ×1 + Estonian ×2)
  { id: 'b11', subject: 'Russian',  slot_start: '2026-06-02T15:00:00', student_name: 'Emma Leroy', student_email: 'emma@gmail.com', student_phone: '+33677889900', contact_pref: 'email', is_minor: true, parent_name: 'Marie Leroy', parent_contact: '+33644556677', status: 'confirmed', teacher: 'Dominika Fält' },
  { id: 'b12', subject: 'Estonian', slot_start: '2026-06-04T15:00:00', student_name: 'Emma Leroy', student_email: 'emma@gmail.com', student_phone: '+33677889900', contact_pref: 'email', is_minor: true, parent_name: 'Marie Leroy', parent_contact: '+33644556677', status: 'confirmed', teacher: 'Dominika Fält' },
  { id: 'b13', subject: 'Estonian', slot_start: '2026-06-06T15:00:00', student_name: 'Emma Leroy', student_email: 'emma@gmail.com', student_phone: '+33677889900', contact_pref: 'email', is_minor: true, parent_name: 'Marie Leroy', parent_contact: '+33644556677', status: 'pending',   teacher: 'Dominika Fält' },

  // Tom — same teacher (Mihhail), different courses (Spanish ×2 + English ×1)
  { id: 'b14', subject: 'Spanish', slot_start: '2026-06-03T16:00:00', student_name: 'Tom Bernard', student_email: 'tom@gmail.com', student_phone: '+33655443322', contact_pref: 'whatsapp', is_minor: false, parent_name: null, parent_contact: null, status: 'confirmed', teacher: 'Mihhail Skvortsov' },
  { id: 'b15', subject: 'Spanish', slot_start: '2026-06-05T16:00:00', student_name: 'Tom Bernard', student_email: 'tom@gmail.com', student_phone: '+33655443322', contact_pref: 'whatsapp', is_minor: false, parent_name: null, parent_contact: null, status: 'pending',   teacher: 'Mihhail Skvortsov' },
  { id: 'b16', subject: 'English', slot_start: '2026-06-07T16:00:00', student_name: 'Tom Bernard', student_email: 'tom@gmail.com', student_phone: '+33655443322', contact_pref: 'whatsapp', is_minor: false, parent_name: null, parent_contact: null, status: 'pending',   teacher: 'Mihhail Skvortsov' },
]

// ── Utils ────────────────────────────────────────────────────────────────────

function waLink(phone: string) { return `https://wa.me/${phone.replace(/\D/g, '')}` }
function tgLink(phone: string) { return `https://t.me/+${phone.replace(/\D/g, '')}` }
function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' at ' + d.toTimeString().slice(0, 5)
}

const LS_KEY = 'demo_parent_status'
function loadStatus(): Record<string, ParentStatus> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function saveStatus(s: Record<string, ParentStatus>) {
  localStorage.setItem(LS_KEY, JSON.stringify(s))
}

function dotColor(s: ParentStatus) {
  if (s === 'answered') return 'bg-green-400'
  if (s === 'contacted') return 'bg-amber-400'
  return 'bg-orange-400'
}

const CYCLE: Record<ParentStatus, ParentStatus> = { to_contact: 'contacted', contacted: 'answered', answered: 'to_contact' }

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [view, setView] = useState<'bookings' | 'crm'>('crm')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCourse, setFilterCourse] = useState('all')
  const [filterTeacher, setFilterTeacher] = useState('all')
  const [filterMinors, setFilterMinors] = useState<'all' | 'minors' | 'not_reached'>('all')
  const [parentStatus, setParentStatus] = useState<Record<string, ParentStatus>>(loadStatus)

  function cycleStatus(email: string) {
    setParentStatus(prev => {
      const next = { ...prev, [email]: CYCLE[prev[email] ?? 'to_contact'] }
      saveStatus(next)
      return next
    })
  }

  function statusLabel(email: string) {
    const s = parentStatus[email] ?? 'to_contact'
    if (s === 'answered') return '✓ Answered'
    if (s === 'contacted') return 'Contacted'
    return 'Mark contacted'
  }

  function statusBtnClass(email: string) {
    const s = parentStatus[email] ?? 'to_contact'
    if (s === 'answered') return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
    if (s === 'contacted') return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
    return 'bg-orange-50 text-orange-500 border-orange-200 hover:bg-orange-100'
  }

  const courses = useMemo(() => [...new Set(DEMO.map(b => b.subject))].sort(), [])
  const teachers = useMemo(() => [...new Set(DEMO.map(b => b.teacher))].sort(), [])

  const filtered = DEMO.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (filterCourse !== 'all' && b.subject !== filterCourse) return false
    if (filterTeacher !== 'all' && b.teacher !== filterTeacher) return false
    if (filterMinors === 'minors' && !b.is_minor) return false
    if (filterMinors === 'not_reached' && (!b.is_minor || (parentStatus[b.student_email] ?? 'to_contact') !== 'to_contact')) return false
    return true
  })

  const students = useMemo<StudentRow[]>(() => {
    const map = new Map<string, StudentRow>()
    DEMO.forEach(b => {
      if (!map.has(b.student_email)) {
        map.set(b.student_email, { name: b.student_name, email: b.student_email, phone: b.student_phone, prefs: [], is_minor: b.is_minor, parent_name: b.parent_name, parent_contact: b.parent_contact, total: 0, combos: [] })
      }
      const s = map.get(b.student_email)!
      s.total++
      if (!s.prefs.includes(b.contact_pref)) s.prefs.push(b.contact_pref)
      const key = `${b.subject}||${b.teacher}`
      const existing = s.combos.find(c => `${c.subject}||${c.teacher}` === key)
      if (existing) existing.count++
      else s.combos.push({ subject: b.subject, teacher: b.teacher, count: 1 })
    })
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [])

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Demo — Admin simulation</h1>
            <p className="text-xs text-gray-400 mt-0.5">Données fictives · {DEMO.length} réservations · 4 élèves</p>
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 shadow-sm text-sm">
            {(['bookings', 'crm'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all ${view === v ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                {v === 'bookings' ? 'Bookings' : 'Students'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scenarios legend ── */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: 'Sophie', tag: 'English × 2 teachers', color: 'bg-violet-50 text-violet-700 border-violet-200' },
            { label: 'Lucas',  tag: 'Estonian + English × same teacher', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Emma',   tag: 'Russian + Estonian × same teacher · minor', color: 'bg-orange-50 text-orange-700 border-orange-200' },
            { label: 'Tom',    tag: 'Spanish + English × same teacher', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${s.color}`}>
              <span className="font-semibold">{s.label}</span>
              <span className="opacity-70">{s.tag}</span>
            </div>
          ))}
        </div>

        {/* ── BOOKINGS VIEW ── */}
        {view === 'bookings' && (
          <>
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <div className="flex gap-1.5">
                {(['all', 'pending', 'confirmed'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <div className="flex gap-1.5">
                {['all', ...courses].map(c => (
                  <button key={c} onClick={() => setFilterCourse(c)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterCourse === c ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'}`}>
                    {c === 'all' ? 'All courses' : c}
                  </button>
                ))}
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
                className="text-xs border border-gray-200 rounded-full px-3 py-1 bg-white text-gray-600 focus:outline-none cursor-pointer">
                <option value="all">All teachers</option>
                {teachers.map(tc => <option key={tc} value={tc}>{tc}</option>)}
              </select>
              <div className="h-5 w-px bg-gray-200" />
              <select value={filterMinors} onChange={e => setFilterMinors(e.target.value as 'all' | 'minors' | 'not_reached')}
                className={`text-xs border rounded-full px-3 py-1 bg-white focus:outline-none cursor-pointer transition-colors ${filterMinors !== 'all' ? 'text-orange-500 border-orange-400 font-medium' : 'text-gray-500 border-gray-200 hover:border-orange-300'}`}>
                <option value="all">All</option>
                <option value="minors">Minors</option>
                <option value="not_reached">Parent not reached</option>
              </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                    <th className="w-6 px-3 py-3" />
                    <th className="text-left px-4 py-3 font-medium">Date / Time</th>
                    <th className="text-left px-4 py-3 font-medium">Teacher</th>
                    <th className="text-left px-4 py-3 font-medium">Course</th>
                    <th className="text-left px-4 py-3 font-medium">Élève</th>
                    <th className="text-left px-4 py-3 font-medium">Contact</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="w-24 px-3 py-3" />
                  </tr>
                </thead>
                {filtered.map(b => {
                  const pStatus = b.is_minor ? (parentStatus[b.student_email] ?? 'to_contact') : 'to_contact'
                  const hasParent = b.is_minor && !!b.parent_contact
                  const span = hasParent ? 2 : 1
                  const divStyle = hasParent ? { borderBottom: '1px solid #e5e7eb' } : {}
                  const statusBadge = (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </span>
                  )
                  return (
                    <tbody key={b.id} className="group">
                      <tr className={`group-hover:bg-gray-50 transition-colors ${!hasParent ? 'border-b border-gray-200' : ''}`}>
                        <td rowSpan={span} className="px-3 py-3 text-center align-middle">
                          {b.is_minor && <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor(pStatus)}`} />}
                        </td>
                        <td rowSpan={span} className="px-4 py-3 text-gray-700 whitespace-nowrap align-middle">{fmtDate(b.slot_start)}</td>
                        <td rowSpan={span} className="px-4 py-3 text-gray-700 align-middle">{b.teacher.split(' ')[0]}</td>
                        <td rowSpan={span} className="px-4 py-3 text-gray-700 align-middle">{b.subject}</td>
                        <td className="px-4 py-3" style={divStyle}>
                          <p className="font-semibold text-gray-900">{b.student_name}</p>
                        </td>
                        <td className="px-4 py-3" style={divStyle}>
                          <p className="text-xs text-gray-400">{b.student_email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{b.student_phone}</p>
                        </td>
                        <td rowSpan={span} className="px-4 py-3 align-middle">{statusBadge}</td>
                        <td className="px-3 py-3" style={divStyle}>
                          {b.contact_pref === 'whatsapp' && (
                            <a href={waLink(b.student_phone)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit">
                              <WaIcon /> WhatsApp
                            </a>
                          )}
                          {b.contact_pref === 'telegram' && (
                            <a href={tgLink(b.student_phone)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-white bg-sky-500 hover:bg-sky-600 px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit">
                              <TgIcon /> Telegram
                            </a>
                          )}
                          {b.contact_pref === 'email' && (
                            <a href={`mailto:${b.student_email}`}
                              className="flex items-center gap-1.5 text-xs text-white bg-violet-500 hover:bg-violet-600 px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit">
                              <EmailIcon /> Email
                            </a>
                          )}
                        </td>
                      </tr>
                      {hasParent && (
                        <tr className="border-b border-gray-200 group-hover:bg-gray-50 transition-colors">
                          {/* dot, date, teacher, course, status spanned */}
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{b.parent_name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-400">{b.parent_contact}</p>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1">
                              <a href={waLink(b.parent_contact!)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit">
                                <WaIcon /> WhatsApp
                              </a>
                              <a href={tgLink(b.parent_contact!)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit">
                                <TgIcon /> Telegram
                              </a>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  )
                })}
              </table>
            </div>
          </>
        )}

        {/* ── CRM VIEW ── */}
        {view === 'crm' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                  <th className="w-6 px-3 py-3" />
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Contact</th>
                  <th className="text-left px-4 py-3 font-medium">Courses</th>
                  <th className="text-left px-4 py-3 font-medium">Teachers</th>
                </tr>
              </thead>
              {students.map(s => {
                const pStatus = s.is_minor ? (parentStatus[s.email] ?? 'to_contact') : 'to_contact'
                const sep = { borderBottom: '1px solid #f3f4f6' }
                return (
                  <tbody key={s.email} className="group">
                    <tr className={`group-hover:bg-gray-50 transition-colors ${!s.is_minor ? 'border-b border-gray-200' : ''}`}>
                      <td rowSpan={s.is_minor ? 2 : 1} className="px-3 py-3 text-center align-middle">
                        {s.is_minor && <span className={`inline-block w-2.5 h-2.5 rounded-full cursor-help ${dotColor(pStatus)}`} />}
                      </td>
                      <td className="px-4 py-3" style={s.is_minor ? sep : {}}>
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.phone}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.email}</p>
                      </td>
                      <td className="px-4 py-3" style={s.is_minor ? sep : {}}>
                        <div className="flex flex-wrap gap-2">
                          <a href={waLink(s.phone)} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${s.prefs.includes('whatsapp') ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                            <WaIcon /> WhatsApp
                          </a>
                          <a href={tgLink(s.phone)} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${s.prefs.includes('telegram') ? 'bg-sky-500 text-white hover:bg-sky-600' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}>
                            <TgIcon /> Telegram
                          </a>
                          <a href={`mailto:${s.email}`}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${s.prefs.includes('email') ? 'bg-violet-500 text-white hover:bg-violet-600' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}>
                            <EmailIcon /> Email
                          </a>
                        </div>
                      </td>
                      <td rowSpan={s.is_minor ? 2 : 1} className="px-4 py-3 align-middle">
                        <p className="text-xs text-gray-400 mb-1.5">{s.total} total</p>
                        <div className="space-y-1.5">
                          {s.combos.map((c, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-800">{c.subject}</span>
                              <span className="text-xs font-semibold text-blue-500">×{c.count}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td rowSpan={s.is_minor ? 2 : 1} className="px-4 py-3 align-middle">
                        <p className="text-xs text-gray-400 mb-1.5">&nbsp;</p>
                        <div className="space-y-1.5">
                          {s.combos.map((c, i) => (
                            <div key={i} className="text-xs text-gray-500">{c.teacher.split(' ')[0]}</div>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {s.is_minor && (
                      <tr className="border-b border-gray-200 group-hover:bg-gray-50 transition-colors">
                        {/* dot spanned */}
                        <td className="px-4 py-3">
                          {s.parent_name && <p className="font-semibold text-gray-900">{s.parent_name}</p>}
                          {s.parent_contact && <p className="text-xs text-gray-400 mt-0.5">{s.parent_contact}</p>}
                          <button
                            onClick={() => cycleStatus(s.email)}
                            className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${statusBtnClass(s.email)}`}
                          >
                            {pStatus === 'answered' && <CheckIcon />}
                            {statusLabel(s.email)}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {s.parent_contact ? (
                            <div className="flex flex-wrap gap-2">
                              <a href={waLink(s.parent_contact)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                                <WaIcon /> WhatsApp
                              </a>
                              <a href={tgLink(s.parent_contact)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors bg-sky-50 text-sky-600 hover:bg-sky-100">
                                <TgIcon /> Telegram
                              </a>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-300">—</p>
                          )}
                        </td>
                        {/* courses + teachers spanned */}
                      </tr>
                    )}
                  </tbody>
                )
              })}
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function WaIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function TgIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
