'use client'

import { useEffect, useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

// ── Types ─────────────────────────────────────────────────────────────────────

type Booking = {
  id: string
  subject: string
  slot_start: string
  slot_end: string
  student_name: string
  student_email: string
  student_phone: string
  contact_pref: string
  is_minor: boolean
  parent_name: string | null
  parent_contact: string | null
  parent_email: string | null
  parent_pref: string | null
  telegram_username: string | null
  status: string
  amount: number | null
  invoice_id: string | null
  student_response: string | null
  teacher_response: string | null
  teachers: { name: string } | null
}

type Application = {
  id: string
  name: string
  email: string
  phone: string
  country_code: string | null
  is_minor: boolean
  parent_name: string | null
  parent_contact: string | null
  parent_email: string | null
  parent_pref: string | null
  subject: string
  grade: string
  contact_pref: string
  telegram_username: string | null
  telegram_parent_username: string | null
  telegram_chat_id: number | null
  telegram_parent_chat_id: number | null
  learning_lang: string | null
  lang: string
  communication_lang: string | null
  status: string
  parent_approved: boolean
  price_tier: string | null
  created_at: string
}

type PanelBooking = {
  id: string
  date: string
  subject: string
  teacher: string
  status: 'confirmed' | 'pending' | 'cancelled'
  amount: number
  invoice_id: string | null
  invoice_status: 'sent' | 'paid' | null
}

type Combo = { subject: string; teacher: string; count: number }

type StudentRow = {
  name: string
  email: string
  phone: string
  prefs: string[]
  parent_name: string | null
  parent_contact: string | null
  parent_email: string | null
  country_code: string | null
  appId: string | null
  total: number
  combos: Combo[]
  tgSynced: boolean
  gcalResponse: string | null
  learningLang: string | null
  communicationLang: string | null
  grade: string | null
  createdAt: string | null
}

type ParentStatus = 'to_contact' | 'contacted' | 'answered'
type SortCol = 'date' | 'teacher' | 'course' | 'student' | 'status'

type GroupSession = {
  id: string
  session_date: string
  start_time: string
  gcal_event_id: string | null
}
type GroupBatch = {
  id: string
  teacher_id: string
  subject: string
  start_date: string
  start_time: string
  duration_minutes: number
  max_students: number
  status: string
  enrollment_count: number
  group_slot_sessions: GroupSession[]
  teachers: { name: string; teaching_languages: string[] | null } | null
}
type PremadeSession = {
  id: string
  name: string
  session_date: string
  start_time: string
  gcal_event_id: string | null
}
type AdminPremadeBatch = {
  id: string
  teacher_id: string
  name: string
  subject: string
  target_levels: string[]
  duration_min: number
  max_students: number
  status: string
  enrollment_count: number
  premade_sessions: PremadeSession[]
  teachers: { name: string; teaching_languages: string[] | null } | null
}

type InvoiceRow = {
  id: string
  invoice_number: number
  format: 'individual' | 'pair' | 'group'
  lessons_count: number
  students_count: number
  price_per_lesson: number
  total_amount: number
  status: 'sent' | 'paid'
  pdf_url: string | null
  tg_sent_at: string | null
  created_at: string
  applications: {
    id: string
    name: string
    email: string
    subject: string
    ref_token: string
    lang: string
    learning_lang: string | null
    telegram_chat_id: number | null
    country_code: string | null
  } | null
}

// ── i18n ──────────────────────────────────────────────────────────────────────

const T = {
  fr: {
    title: 'Administration',
    bookings: (n: number) => `${n} réservation${n > 1 ? 's' : ''}`,
    logout: 'Déconnexion',
    viewBookings: 'Réservations',
    viewCrm: 'Élèves',
    allStatuses: 'Tous',
    allCourses: 'Toutes les matières',
    allTeachers: 'Tous les profs',
    loading: 'Chargement…',
    empty: 'Aucune réservation.',
    emptyCrm: 'Aucun élève.',
    status: { pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé' },
    cols: { date: 'Date / Heure', teacher: 'Professeur', course: 'Matière', student: 'Élève', contact: 'Contact', status: 'Statut' },
    crmCols: { student: 'Élève', contact: 'Contact', courses: 'Matières', teachers: 'Professeurs' },
    parent: 'Parent',
    toContact: 'Marquer contacté',
    contacted: 'Contacté',
    answered: 'A répondu',
    total: (n: number) => `${n} total`,
    dateFormat: "d MMM 'à' HH'h'mm",
    locale: fr,
    groupByLabel: 'Grouper',
    groupBy: { none: 'Aucun', teacher: 'Par prof', subject: 'Par matière' },
    period: { all: 'Tous', upcoming: 'À venir', past: 'Passés' },
    allProfs: 'Tous les profs',
  },
  en: {
    title: 'Administration',
    bookings: (n: number) => `${n} booking${n > 1 ? 's' : ''}`,
    logout: 'Sign out',
    viewBookings: 'Bookings',
    viewCrm: 'Students',
    allStatuses: 'All',
    allCourses: 'All courses',
    allTeachers: 'All teachers',
    loading: 'Loading…',
    empty: 'No bookings.',
    emptyCrm: 'No students.',
    status: { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' },
    cols: { date: 'Date / Time', teacher: 'Teacher', course: 'Course', student: 'Student', contact: 'Contact', status: 'Status' },
    crmCols: { student: 'Student', contact: 'Contact', courses: 'Courses', teachers: 'Teachers' },
    parent: 'Parent',
    toContact: 'Mark contacted',
    contacted: 'Contacted',
    answered: 'Answered',
    total: (n: number) => `${n} total`,
    dateFormat: "d MMM 'at' HH:mm",
    locale: enUS,
    groupByLabel: 'Group',
    groupBy: { none: 'None', teacher: 'By teacher', subject: 'By subject' },
    period: { all: 'All', upcoming: 'Upcoming', past: 'Past' },
    allProfs: 'All teachers',
  },
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function tgLink(phone: string) { return `https://t.me/+${phone.replace(/\D/g, '')}` }

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'serforybot'

const TG_APP_MESSAGES: Record<string, (name: string, subject: string, learningLang: string, appId: string) => string> = {
  en: (name, subject, lang, id) => `Hi ${name}! We received your application for ${subject} (${lang}) at Serfory.\n\nTap the link below to connect with our assistant and receive your booking link:\nt.me/${BOT_USERNAME}?start=${id}`,
  et: (name, subject, lang, id) => `Tere ${name}! Saime teie ${subject} (${lang}) avalduse kätte Serfory's.\n\nVajutage lingil broneeringulingi saamiseks:\nt.me/${BOT_USERNAME}?start=${id}`,
  ru: (name, subject, lang, id) => `Привет, ${name}! Мы получили вашу заявку на ${subject} (${lang}) в Serfory.\n\nНажмите на ссылку, чтобы получить ссылку для бронирования:\nt.me/${BOT_USERNAME}?start=${id}`,
}

function tgAppLink(a: Application): string {
  const msgLang = (a.lang as string) in TG_APP_MESSAGES ? a.lang : 'en'
  const langLabel = a.learning_lang === 'ru' ? 'Russian' : a.learning_lang === 'et' ? 'Estonian' : 'English'
  const msg = TG_APP_MESSAGES[msgLang](a.name, a.subject, langLabel, a.id)
  if (a.telegram_username) return `https://t.me/${a.telegram_username}?text=${encodeURIComponent(msg)}`
  return `https://t.me/+${a.phone.replace(/\D/g, '')}`
}

const LS_STATUS_KEY = 'admin_parent_status'
function loadStatus(): Record<string, ParentStatus> {
  try { return JSON.parse(localStorage.getItem(LS_STATUS_KEY) || '{}') } catch { return {} }
}
function saveStatus(s: Record<string, ParentStatus>) {
  localStorage.setItem(LS_STATUS_KEY, JSON.stringify(s))
}

function dotColorClass(status: ParentStatus): string {
  if (status === 'answered') return 'bg-green-400'
  if (status === 'contacted') return 'bg-amber-400'
  return 'bg-orange-400'
}

const CYCLE: Record<ParentStatus, ParentStatus> = {
  to_contact: 'contacted',
  contacted: 'answered',
  answered: 'to_contact',
}

const GRADE_NORMALIZE: Record<string, string> = {
  'Детский сад': 'Kindergarten', 'Kindergarten': 'Kindergarten',
  '1 класс': 'Grade 1',  '1. klass': 'Grade 1',  'Grade 1': 'Grade 1',
  '2 класс': 'Grade 2',  '2. klass': 'Grade 2',  'Grade 2': 'Grade 2',
  '3 класс': 'Grade 3',  '3. klass': 'Grade 3',  'Grade 3': 'Grade 3',
  '4 класс': 'Grade 4',  '4. klass': 'Grade 4',  'Grade 4': 'Grade 4',
  '5 класс': 'Grade 5',  '5. klass': 'Grade 5',  'Grade 5': 'Grade 5',
  '6 класс': 'Grade 6',  '6. klass': 'Grade 6',  'Grade 6': 'Grade 6',
  '7 класс': 'Grade 7',  '7. klass': 'Grade 7',  'Grade 7': 'Grade 7',
  '8 класс': 'Grade 8',  '8. klass': 'Grade 8',  'Grade 8': 'Grade 8',
  '9 класс': 'Grade 9',  '9. klass': 'Grade 9',  'Grade 9': 'Grade 9',
  '10 класс': 'Grade 10', '10. klass': 'Grade 10', 'Grade 10': 'Grade 10',
  '11 класс': 'Grade 11', '11. klass': 'Grade 11', 'Grade 11': 'Grade 11',
  '12 класс': 'Grade 12', '12. klass': 'Grade 12', 'Grade 12': 'Grade 12',
  'Взрослый': 'Adult', 'Täiskasvanu': 'Adult', 'Adult': 'Adult',
}
const normalizeGrade = (g: string) => GRADE_NORMALIZE[g] ?? g

// ── CRM D2×A — helpers ────────────────────────────────────────────────────────

const SUBJECT_COLORS_CRM: Record<string, { bg: string; text: string }> = {
  Russian:  { bg: 'bg-pink-100',   text: 'text-pink-700'   },
  English:  { bg: 'bg-violet-100', text: 'text-violet-700' },
  Estonian: { bg: 'bg-teal-100',   text: 'text-teal-700'   },
  Spanish:  { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  Math:     { bg: 'bg-blue-100',   text: 'text-blue-700'   },
}
const SUBJECT_ABBR_CRM: Record<string, string> = {
  Russian: 'RU', English: 'EN', Estonian: 'ET', Spanish: 'ES', Math: 'MA',
}
const CRM_AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-pink-100 text-pink-700',
  'bg-emerald-100 text-emerald-700',
]
function avatarColorCrm(name: string): string {
  let h = 0; for (const c of name) h = (h + c.charCodeAt(0)) % CRM_AVATAR_COLORS.length
  return CRM_AVATAR_COLORS[h]
}
function nameInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}
const TG_CIS_COUNTRIES = new Set(['RU','BY','UA','KZ','KG','TJ','TM','UZ','AZ','AM','GE','MD','EE','LV','LT','PL','RO','BG','RS','HU','CZ','SK','HR','BA','ME','MK','AL'])
function isTgEligible(country_code: string | null, learning_lang: string | null): boolean {
  return learning_lang === 'ru' || (!!country_code && TG_CIS_COUNTRIES.has(country_code.toUpperCase()))
}
function subjectColorCrm(subject: string) {
  return SUBJECT_COLORS_CRM[subject] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
}
function crmPanelBookingStatus(status: string, date: string): string {
  if (status === 'cancelled') return 'cancelled'
  if (status === 'confirmed' && new Date(date) < new Date()) return 'provided'
  if (status === 'confirmed') return 'confirmed'
  return 'pending'
}
function crmStatusColor(s: string): string {
  if (s === 'confirmed') return 'text-green-600'
  if (s === 'provided')  return 'text-blue-600'
  if (s === 'cancelled') return 'text-red-400'
  return 'text-amber-500'
}
function crmWeekStart(iso: string): string {
  const d = new Date(iso); const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d.toISOString().slice(0, 10)
}
function crmWeekRange(key: string): string {
  const mon = new Date(key); const sun = new Date(mon); sun.setDate(sun.getDate() + 6)
  const f = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${f(mon)} – ${f(sun)}`
}
function crmMlShort(key: string): string {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}
function crmFd(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function crmInitials(name: string): string {
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}
function teacherInitialsCrm(name: string): string {
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

// ── CRM D2×A — components ─────────────────────────────────────────────────────

function CircleToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-4 h-4 rounded-full border-2 transition-all shrink-0 ${active ? 'bg-green-400 border-green-400' : 'bg-white border-gray-300 hover:border-green-300'}`}
    />
  )
}

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

function CrmStatusBadge({ pStatus }: { pStatus: ParentStatus }) {
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

function StudentStatsPanelAdmin({ bookings: allBookings, studentName, grade, initialPaidIds, initialInvoiceSentIds }: {
  bookings: PanelBooking[]
  studentName: string
  grade?: string | null
  initialPaidIds?: Set<string>
  initialInvoiceSentIds?: Set<string>
}) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [paidIds, setPaidIds] = useState<Set<string>>(initialPaidIds ?? new Set())
  const [invoiceSentIds, setInvoiceSentIds] = useState<Set<string>>(initialInvoiceSentIds ?? new Set())
  const [monthOffset, setMonthOffset] = useState(0)
  const [cancelledOpen, setCancelledOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  const [invTeacherFilter, setInvTeacherFilter] = useState('all')
  const [invCourseFilter, setInvCourseFilter] = useState('all')
  const [invStatusFilter, setInvStatusFilter] = useState<Set<string>>(new Set(['confirmed', 'pending']))

  const nonCancelled = allBookings.filter(b => b.status !== 'cancelled')
  const cancelledBookings = allBookings.filter(b => b.status === 'cancelled').sort((a, b) => a.date.localeCompare(b.date))

  const byMonth = nonCancelled.reduce<Record<string, PanelBooking[]>>((acc, b) => {
    const mk = b.date.slice(0, 7);
    (acc[mk] = acc[mk] ?? []).push(b); return acc
  }, {})
  const months = Object.keys(byMonth).sort()
  const visibleMonths = months.slice(monthOffset, monthOffset + 12)
  const monthRows: string[][] = []
  for (let i = 0; i < visibleMonths.length; i += 6) monthRows.push(visibleMonths.slice(i, i + 6))
  const canScrollPrev = monthOffset > 0
  const canScrollNext = monthOffset + 12 < months.length

  const statsSource = selectedMonth ? (byMonth[selectedMonth] ?? []) : nonCancelled
  const received = statsSource.filter(b => paidIds.has(b.id)).length
  const notReceived = statsSource.length - received

  const totalRevenue = statsSource.reduce((s, b) => s + (b.amount ?? 0), 0)
  const paidRevenue = statsSource.filter(b => paidIds.has(b.id)).reduce((s, b) => s + (b.amount ?? 0), 0)
  const hasAmounts = statsSource.some(b => (b.amount ?? 0) > 0)

  const panelTeachers = [...new Set(allBookings.map(b => b.teacher))].sort()
  const panelCourses  = [...new Set(allBookings.map(b => b.subject))].sort()

  const isDone = (b: PanelBooking) =>
    crmPanelBookingStatus(b.status, b.date) === 'provided' && paidIds.has(b.id) && invoiceSentIds.has(b.id)

  const doneBookings = nonCancelled.filter(isDone).sort((a, b) => a.date.localeCompare(b.date))

  const displayedBookings = (selectedMonth
    ? nonCancelled.filter(b => b.date.startsWith(selectedMonth))
    : nonCancelled
  ).filter(b => {
    if (isDone(b)) return false
    if (!invStatusFilter.has(b.status)) return false
    if (invTeacherFilter !== 'all' && b.teacher !== invTeacherFilter) return false
    if (invCourseFilter !== 'all' && b.subject !== invCourseFilter) return false
    return true
  }).sort((a, b) => a.date.localeCompare(b.date))

  function mlFull(key: string) {
    const [y, m] = key.split('-')
    return new Date(+y, +m-1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }
  function togglePaid(id: string) { setPaidIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  function MonthPill({ mk }: { mk: string }) {
    const mbs = byMonth[mk]
    const active = selectedMonth === mk
    const mRev = mbs.reduce((s, b) => s + (b.amount ?? 0), 0)
    return (
      <button onClick={() => setSelectedMonth(active ? null : mk)}
        className={`flex-1 rounded-lg border px-2 py-1.5 text-left transition-colors ${active ? 'border-blue-400 bg-blue-50' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
        <p className={`text-xs font-semibold whitespace-nowrap ${active ? 'text-blue-700' : 'text-gray-700'}`}>{crmMlShort(mk)}</p>
        <p className={`text-[10px] mt-0.5 whitespace-nowrap ${active ? 'text-blue-500' : 'text-gray-400'}`}>
          {mbs.length}{mRev > 0 ? ` · €${mRev}` : ` session${mbs.length !== 1 ? 's' : ''}`}
        </p>
      </button>
    )
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50/40">
      <div className="px-5 pt-3 pb-2">
        <div className="flex gap-3 items-stretch">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 flex flex-col justify-center shrink-0">
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{statsSource.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 flex flex-col justify-center shrink-0">
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Tracked</p>
            <p className="text-2xl font-bold text-gray-900">{received}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{received} paid · {notReceived} pending</p>
          </div>
          {hasAmounts && (
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 flex flex-col justify-center shrink-0">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">€{totalRevenue}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">€{paidRevenue} received · €{totalRevenue - paidRevenue} pending</p>
            </div>
          )}
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

      <div className="bg-white border-t border-gray-100 overflow-hidden">
        {/* Filter bar */}
        <div className="px-5 py-2 border-b border-gray-100 flex items-center gap-2 flex-wrap">
          {selectedMonth && (
            <>
              <span className="text-xs font-medium text-blue-700">{mlFull(selectedMonth)}</span>
              <button onClick={() => setSelectedMonth(null)} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">×</button>
              <div className="h-4 w-px bg-gray-200" />
            </>
          )}
          {(['confirmed', 'pending'] as const).map(s => {
            const on = invStatusFilter.has(s)
            const col = s === 'confirmed' ? 'bg-green-500 text-white border-green-500' : 'bg-amber-500 text-white border-amber-500'
            return (
              <button key={s} onClick={() => setInvStatusFilter(prev => { const n = new Set(prev); on ? n.delete(s) : n.add(s); return n })}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize transition-colors ${on ? col : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}>
                {s}
              </button>
            )
          })}
          {panelTeachers.length > 1 && (
            <select value={invTeacherFilter} onChange={e => setInvTeacherFilter(e.target.value)}
              className="text-[11px] border border-gray-200 rounded-full px-2 py-0.5 bg-white text-gray-600 focus:outline-none cursor-pointer">
              <option value="all">All teachers</option>
              {panelTeachers.map(t => <option key={t} value={t}>{t.split(' ')[0]}</option>)}
            </select>
          )}
          {panelCourses.length > 1 && (
            <select value={invCourseFilter} onChange={e => setInvCourseFilter(e.target.value)}
              className="text-[11px] border border-gray-200 rounded-full px-2 py-0.5 bg-white text-gray-600 focus:outline-none cursor-pointer">
              <option value="all">All courses</option>
              {panelCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase">
              <th className="text-left px-5 py-2.5 font-medium w-20">Date</th>
              <th className="text-left px-3 py-2.5 font-medium w-12">Course</th>
              <th className="text-left px-3 py-2.5 font-medium w-28">Teacher</th>
              <th className="text-left px-3 py-2.5 font-medium">Status</th>
              <th className="text-center px-3 py-2.5 font-medium w-16">Invoice</th>
              <th className="text-center px-3 py-2.5 font-medium w-16">Payment</th>
              <th className="text-right px-5 py-2.5 font-medium w-20">Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayedBookings.map(b => {
              const bStatus = crmPanelBookingStatus(b.status, b.date)
              return (
                <tr key={b.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2 text-gray-500 whitespace-nowrap">{crmFd(b.date)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${subjectColorCrm(b.subject).bg} ${subjectColorCrm(b.subject).text}`}>
                        {SUBJECT_ABBR_CRM[b.subject] ?? b.subject}
                      </span>
                      {grade && <span className="text-[10px] text-gray-400 font-medium">{grade}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{b.teacher.split(' ')[0]}</td>
                  <td className="px-3 py-2"><span className={`font-medium capitalize ${crmStatusColor(bStatus)}`}>{bStatus}</span></td>
                  <td className="px-3 py-2 text-center"><CircleToggle active={invoiceSentIds.has(b.id)} onClick={() => { const n = new Set(invoiceSentIds); n.has(b.id) ? n.delete(b.id) : n.add(b.id); setInvoiceSentIds(n) }} /></td>
                  <td className="px-3 py-2 text-center"><CircleToggle active={paidIds.has(b.id)} onClick={() => togglePaid(b.id)} /></td>
                  <td className="px-5 py-2 text-right font-medium text-gray-700">{b.amount ? `€${b.amount}` : <span className="text-gray-300">—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {doneBookings.length > 0 && (
          <div className="border-t border-gray-100">
            <button
              onClick={() => setDoneOpen(o => !o)}
              className="w-full flex items-center gap-2 px-5 py-2 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-left"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className={`w-3 h-3 transition-transform ${doneOpen ? 'rotate-90' : ''}`}><path d="M9 18l6-6-6-6"/></svg>
              <span>{doneBookings.length} done session{doneBookings.length !== 1 ? 's' : ''}</span>
            </button>
            {doneOpen && (
              <table className="w-full text-xs border-t border-gray-50">
                <tbody>
                  {doneBookings.map(b => (
                    <tr key={b.id} className="border-b border-gray-50 last:border-0 opacity-60">
                      <td className="px-5 py-2 text-gray-500 whitespace-nowrap w-20">{crmFd(b.date)}</td>
                      <td className="px-3 py-2 w-12">
                        <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${subjectColorCrm(b.subject).bg} ${subjectColorCrm(b.subject).text}`}>
                          {SUBJECT_ABBR_CRM[b.subject] ?? b.subject}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 w-28">{b.teacher.split(' ')[0]}</td>
                      <td className="px-3 py-2 text-blue-600 font-medium">Provided</td>
                      <td className="px-3 py-2 text-center w-16"><CircleToggle active onClick={() => { const n = new Set(invoiceSentIds); n.delete(b.id); setInvoiceSentIds(n) }} /></td>
                      <td className="px-3 py-2 text-center w-16"><CircleToggle active onClick={() => togglePaid(b.id)} /></td>
                      <td className="px-5 py-2 text-right font-medium text-gray-700 w-20">{b.amount ? `€${b.amount}` : <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {cancelledBookings.length > 0 && (
          <div className="border-t border-gray-100">
            <button
              onClick={() => setCancelledOpen(o => !o)}
              className="w-full flex items-center gap-2 px-5 py-2 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-left"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className={`w-3 h-3 transition-transform ${cancelledOpen ? 'rotate-90' : ''}`}><path d="M9 18l6-6-6-6"/></svg>
              <span>{cancelledBookings.length} cancelled session{cancelledBookings.length !== 1 ? 's' : ''}</span>
            </button>
            {cancelledOpen && (
              <table className="w-full text-xs border-t border-gray-50">
                <tbody>
                  {cancelledBookings.map(b => (
                    <tr key={b.id} className="border-b border-gray-50 last:border-0 opacity-60">
                      <td className="px-5 py-2 text-gray-500 whitespace-nowrap w-20">{crmFd(b.date)}</td>
                      <td className="px-3 py-2 w-12">
                        <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${subjectColorCrm(b.subject).bg} ${subjectColorCrm(b.subject).text}`}>
                          {SUBJECT_ABBR_CRM[b.subject] ?? b.subject}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 w-28">{b.teacher.split(' ')[0]}</td>
                      <td className="px-3 py-2 text-red-400 font-medium">Cancelled</td>
                      <td className="px-3 py-2 text-center w-16">—</td>
                      <td className="px-3 py-2 text-center w-16">—</td>
                      <td className="px-5 py-2 text-right w-20 text-gray-300">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

// ── AdminPage ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [lang, setLang] = useState<'fr' | 'en'>('en')
  const [view, setView] = useState<'bookings' | 'crm' | 'invoices'>('bookings')
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)

  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set(['pending', 'confirmed']))
  const [filterCourses, setFilterCourses] = useState<Set<string>>(new Set())
  const [filterTeachers, setFilterTeachers] = useState<Set<string>>(new Set())
  const [groupBy, setGroupBy] = useState<'none' | 'teacher' | 'subject'>('none')
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')

  const [crmFilterCourse, setCrmFilterCourse] = useState<string>('all')
  const [crmFilterTeacher, setCrmFilterTeacher] = useState<string>('all')
  const [crmSortCol, setCrmSortCol] = useState<'name' | 'total' | 'createdAt'>('total')
  const [crmSortDir, setCrmSortDir] = useState<'asc' | 'desc'>('desc')
  const [sortCol, setSortCol] = useState<SortCol>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const [expandedParent, setExpandedParent] = useState<Record<string, boolean>>({})
  const [statsModal, setStatsModal] = useState<string | null>(null)
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)

  const [groupBatches, setGroupBatches] = useState<GroupBatch[]>([])
  const [adminPremadeBatches, setAdminPremadeBatches] = useState<AdminPremadeBatch[]>([])
  const [expandedGroupBatch, setExpandedGroupBatch] = useState<string | null>(null)
  const [expandedPremadeBatch, setExpandedPremadeBatch] = useState<string | null>(null)

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  const [parentStatus, setParentStatus] = useState<Record<string, ParentStatus>>({})
  useEffect(() => { setParentStatus(loadStatus()) }, [])

  function cycleParentStatus(email: string) {
    setParentStatus(prev => {
      const current = prev[email] ?? 'to_contact'
      const updated = { ...prev, [email]: CYCLE[current] }
      saveStatus(updated)
      return updated
    })
  }

  const t = T[lang]

  function statusLabel(email: string): string {
    const s = parentStatus[email] ?? 'to_contact'
    if (s === 'answered') return `✓ ${t.answered}`
    if (s === 'contacted') return t.contacted
    return t.toContact
  }

  function statusButtonClass(email: string): string {
    const s = parentStatus[email] ?? 'to_contact'
    if (s === 'answered') return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
    if (s === 'contacted') return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
    return 'bg-orange-50 text-orange-500 border-orange-200 hover:bg-orange-100'
  }

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(d => { setBookings(d.bookings || []); setLoading(false) })
    fetch('/api/applications')
      .then(r => r.json())
      .then(d => { setApplications(d.applications || []); setLoadingApps(false) })
    fetch('/api/invoices')
      .then(r => r.json())
      .then(d => { setInvoices(d.invoices || []); setLoadingInvoices(false) })
    fetch('/api/group-slots?all=true')
      .then(r => r.json())
      .then(d => setGroupBatches(d.batches || []))
    fetch('/api/premade-batches?all=true')
      .then(r => r.json())
      .then(d => setAdminPremadeBatches(d.batches || []))
  }, [])

  async function handleUpdateParentContact(appId: string, value: string) {
    const val = value.trim() || null
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, parent_contact: val }),
    })
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, parent_contact: val } : a))
  }

  async function handleUpdateParentEmail(appId: string, value: string) {
    const val = value.trim() || null
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, parent_email: val }),
    })
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, parent_email: val } : a))
  }

  async function handleUpdateParentName(appId: string, value: string) {
    const val = value.trim() || null
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, parent_name: val }),
    })
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, parent_name: val } : a))
  }

  const [openParents, setOpenParents] = useState<Set<string>>(new Set())
  function toggleParent(email: string) {
    setOpenParents(prev => { const s = new Set(prev); s.has(email) ? s.delete(email) : s.add(email); return s })
  }

  async function handleUpdateBookingTgUsername(id: string, username: string) {
    const val = username.replace(/^@/, '').trim() || null
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, telegram_username: val }),
    })
    setBookings(prev => prev.map(b => b.id === id ? { ...b, telegram_username: val } : b))
  }

  const courses = useMemo(() => [...new Set(bookings.map(b => b.subject))].sort(), [bookings])
  const teachers = useMemo(() => [...new Set(bookings.map(b => b.teachers?.name).filter(Boolean) as string[])].sort(), [bookings])

  const now = new Date()
  const filtered = bookings.filter(b => {
    if (filterStatuses.size > 0 && !filterStatuses.has(b.status)) return false
    if (filterCourses.size > 0 && !filterCourses.has(b.subject)) return false
    if (filterTeachers.size > 0 && !filterTeachers.has(b.teachers?.name ?? '')) return false
    if (timeFilter === 'upcoming' && new Date(b.slot_start) < now) return false
    if (timeFilter === 'past' && new Date(b.slot_start) >= now) return false
    return true
  })

  const sorted = (() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortCol) {
        case 'date': cmp = a.slot_start.localeCompare(b.slot_start); break
        case 'teacher': cmp = (a.teachers?.name ?? '').localeCompare(b.teachers?.name ?? ''); break
        case 'course': cmp = a.subject.localeCompare(b.subject); break
        case 'student': cmp = a.student_name.localeCompare(b.student_name); break
        case 'status': {
          const ord: Record<string, number> = { confirmed: 0, pending: 1, cancelled: 2 }
          cmp = (ord[a.status] ?? 1) - (ord[b.status] ?? 1)
          break
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  })()

  const students = useMemo<StudentRow[]>(() => {
    // Build learning lang map from applications (email → learning_lang)
    const langMap: Record<string, string> = {}
    applications.forEach(a => { if (a.learning_lang && !langMap[a.email]) langMap[a.email] = a.learning_lang })

    // Build communication_lang map from applications (email → communication_lang)
    const commLangMap: Record<string, string> = {}
    applications.forEach(a => { if (a.communication_lang && !commLangMap[a.email]) commLangMap[a.email] = a.communication_lang })

    // Build TG sync map from applications (email → chat_id presence)
    const syncMap: Record<string, boolean> = {}
    applications.forEach(a => { if (a.telegram_chat_id) syncMap[a.email] = true })

    // Build app id map (email → most recent accepted app id)
    const appIdMap: Record<string, string> = {}
    applications.forEach(a => { if (!appIdMap[a.email]) appIdMap[a.email] = a.id })

    // Build parent contact map from applications (email → parent_name, parent_contact, parent_email)
    const parentMap: Record<string, { name: string | null; contact: string | null; email: string | null }> = {}
    applications.forEach(a => {
      if (!parentMap[a.email]) parentMap[a.email] = { name: a.parent_name, contact: a.parent_contact, email: a.parent_email }
    })

    // Build country code map from applications (email → country_code)
    const countryMap: Record<string, string | null> = {}
    applications.forEach(a => { if (!countryMap[a.email]) countryMap[a.email] = a.country_code ?? null })

    // Build grade map from applications (email → most recent grade)
    const gradeMap: Record<string, string | null> = {}
    applications.forEach(a => { if (a.grade && !gradeMap[a.email]) gradeMap[a.email] = a.grade })

    // Build created_at map from applications (email → earliest created_at)
    const createdAtMap: Record<string, string> = {}
    applications.forEach(a => {
      if (!createdAtMap[a.email] || a.created_at < createdAtMap[a.email]) createdAtMap[a.email] = a.created_at
    })

    // Track most recent active booking per student for GCal response
    const latestBooking = new Map<string, Booking>()
    bookings.forEach(b => {
      if (b.status === 'cancelled') return
      const prev = latestBooking.get(b.student_email)
      if (!prev || b.slot_start > prev.slot_start) latestBooking.set(b.student_email, b)
    })

    const map = new Map<string, StudentRow>()
    bookings.forEach(b => {
      const key = b.student_email
      if (!map.has(key)) {
        map.set(key, {
          name: b.student_name,
          email: b.student_email,
          phone: b.student_phone,
          prefs: [],
          parent_name: parentMap[b.student_email]?.name ?? null,
          parent_contact: parentMap[b.student_email]?.contact ?? b.parent_contact,
          parent_email: parentMap[b.student_email]?.email ?? b.parent_email,
          country_code: countryMap[b.student_email] ?? null,
          appId: appIdMap[b.student_email] ?? null,
          total: 0,
          combos: [],
          tgSynced: syncMap[b.student_email] ?? false,
          gcalResponse: latestBooking.get(b.student_email)?.student_response ?? null,
          learningLang: langMap[b.student_email] ?? null,
          communicationLang: commLangMap[b.student_email] ?? null,
          grade: gradeMap[b.student_email] ?? null,
          createdAt: createdAtMap[b.student_email] ?? null,
        })
      }
      const s = map.get(key)!
      s.total++
      b.contact_pref?.split(',').forEach(p => { if (!s.prefs.includes(p)) s.prefs.push(p) })
      const tName = b.teachers?.name ?? '—'
      const comboKey = `${b.subject}||${tName}`
      const existing = s.combos.find(c => `${c.subject}||${c.teacher}` === comboKey)
      if (existing) existing.count++
      else s.combos.push({ subject: b.subject, teacher: tName, count: 1 })
    })
    // Add applications (pending or accepted) not yet in the map (no booking yet)
    applications.forEach(a => {
      if (a.status === 'rejected') return
      if (map.has(a.email)) return
      map.set(a.email, {
        name: a.name,
        email: a.email,
        phone: a.phone,
        prefs: a.contact_pref ? [a.contact_pref] : [],
        parent_name: a.parent_name,
        parent_contact: a.parent_contact,
        parent_email: a.parent_email,
        country_code: a.country_code ?? null,
        appId: a.id,
        total: 0,
        combos: [],
        tgSynced: syncMap[a.email] ?? !!a.telegram_chat_id,
        gcalResponse: null,
        learningLang: a.learning_lang ?? null,
        communicationLang: commLangMap[a.email] ?? null,
        grade: a.grade ?? null,
        createdAt: a.created_at,
      })
    })

    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [bookings, applications])

  const visibleStudents = useMemo(() => {
    let result = students
    if (crmFilterCourse !== 'all') result = result.filter(s => s.combos.some(c => c.subject === crmFilterCourse))
    if (crmFilterTeacher !== 'all') result = result.filter(s => s.combos.some(c => c.teacher === crmFilterTeacher))
    return [...result].sort((a, b) => {
      let cmp = 0
      if (crmSortCol === 'name') cmp = a.name.localeCompare(b.name)
      else if (crmSortCol === 'createdAt') cmp = (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
      else cmp = a.total - b.total
      return crmSortDir === 'asc' ? cmp : -cmp
    })
  }, [students, crmFilterCourse, crmFilterTeacher, crmSortCol, crmSortDir])

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-screen-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🦤 {t.title}</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 shadow-sm text-sm">
              {(['bookings', 'crm', 'invoices'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`min-w-[100px] text-center px-4 py-1.5 rounded-lg font-medium transition-all ${view === v ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                  {v === 'bookings' ? t.viewBookings : v === 'crm' ? t.viewCrm : (
                    <span className="flex items-center gap-1.5">
                      {lang === 'fr' ? 'Factures' : 'Invoices'}
                      {invoices.filter(i => i.status === 'sent').length > 0 && (
                        <span className="bg-amber-400 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                          {invoices.filter(i => i.status === 'sent').length}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold shadow-sm">
              {(['fr', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1.5 uppercase transition-colors ${lang === l ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <a href="/api/auth/logout" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{t.logout}</a>
          </div>
        </div>

        {/* ── BOOKINGS VIEW ── */}
        {view === 'bookings' && (
          <>
            {/* ── Group courses ── */}
            {groupBatches.length > 0 && (() => {
              const langBadge: Record<string, string> = { en: 'bg-blue-50 text-blue-500', et: 'bg-green-50 text-green-600', ru: 'bg-orange-50 text-orange-500', ky: 'bg-purple-50 text-purple-500' }
              return (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Group courses</span>
                    <span className="text-xs text-gray-400">({groupBatches.length})</span>
                  </div>
                  {groupBatches.map(batch => {
                    const isOpen = expandedGroupBatch === batch.id
                    const sessions = batch.group_slot_sessions
                    const firstDate = sessions[0]?.session_date
                    const lastDate = sessions[sessions.length - 1]?.session_date
                    const subjectColor = SUBJECT_COLORS_CRM[batch.subject] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
                    const langs = batch.teachers?.teaching_languages ?? []
                    return (
                      <div key={batch.id} className="border-b border-gray-100 last:border-0">
                        <button
                          onClick={() => setExpandedGroupBatch(isOpen ? null : batch.id)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <svg className={`w-3 h-3 text-gray-300 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${subjectColor.bg} ${subjectColor.text}`}>{batch.subject}</span>
                          {batch.teachers?.name && <TeacherAvatar name={batch.teachers.name} />}
                          {batch.teachers?.name && <span className="text-sm text-gray-700">{batch.teachers.name.split(' ')[0]}</span>}
                          {langs.map(l => (
                            <span key={l} className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${langBadge[l] ?? 'bg-gray-100 text-gray-500'}`}>{l}</span>
                          ))}
                          {firstDate && (
                            <span className="text-xs text-gray-400 ml-1">
                              {fmtDate(firstDate)}{lastDate && lastDate !== firstDate ? ` – ${fmtDate(lastDate)}` : ''}
                            </span>
                          )}
                          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${batch.enrollment_count >= batch.max_students ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                            {batch.enrollment_count}/{batch.max_students}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${batch.status === 'active' ? 'bg-emerald-50 text-emerald-600' : batch.status === 'prelock' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                            {batch.status}
                          </span>
                        </button>
                        {isOpen && sessions.length > 0 && (
                          <div className="px-10 pb-3 pt-1 space-y-1.5">
                            {sessions.map((s, i) => (
                              <div key={s.id} className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="w-4 text-right text-gray-300 font-mono text-[11px]">{i + 1}</span>
                                <span>{fmtDate(s.session_date)}</span>
                                <span className="text-gray-300">·</span>
                                <span>{s.start_time.slice(0, 5)}</span>
                                {s.gcal_event_id && <span className="text-[10px] text-emerald-500 font-medium">GCal ✓</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* ── Premade courses ── */}
            {adminPremadeBatches.length > 0 && (() => {
              const langBadge: Record<string, string> = { en: 'bg-blue-50 text-blue-500', et: 'bg-green-50 text-green-600', ru: 'bg-orange-50 text-orange-500', ky: 'bg-purple-50 text-purple-500' }
              return (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Premade courses</span>
                    <span className="text-xs text-gray-400">({adminPremadeBatches.length})</span>
                  </div>
                  {adminPremadeBatches.map(batch => {
                    const isOpen = expandedPremadeBatch === batch.id
                    const sessions = batch.premade_sessions
                    const firstDate = sessions[0]?.session_date
                    const lastDate = sessions[sessions.length - 1]?.session_date
                    const subjectColor = SUBJECT_COLORS_CRM[batch.subject] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
                    const langs = batch.teachers?.teaching_languages ?? []
                    return (
                      <div key={batch.id} className="border-b border-gray-100 last:border-0">
                        <button
                          onClick={() => setExpandedPremadeBatch(isOpen ? null : batch.id)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <svg className={`w-3 h-3 text-gray-300 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${subjectColor.bg} ${subjectColor.text}`}>{batch.subject}</span>
                          {batch.teachers?.name && <TeacherAvatar name={batch.teachers.name} />}
                          {batch.teachers?.name && <span className="text-sm text-gray-700">{batch.teachers.name.split(' ')[0]}</span>}
                          {langs.map(l => (
                            <span key={l} className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${langBadge[l] ?? 'bg-gray-100 text-gray-500'}`}>{l}</span>
                          ))}
                          {batch.target_levels?.length > 0 && (
                            <span className="text-[10px] text-gray-400">{batch.target_levels.join(', ')}</span>
                          )}
                          <span className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{batch.name}</span>
                          {firstDate && (
                            <span className="text-xs text-gray-400">
                              {fmtDate(firstDate)}{lastDate && lastDate !== firstDate ? ` – ${fmtDate(lastDate)}` : ''}
                            </span>
                          )}
                          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${batch.enrollment_count >= batch.max_students ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                            {batch.enrollment_count}/{batch.max_students}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${batch.status === 'active' ? 'bg-emerald-50 text-emerald-600' : batch.status === 'completed' ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-400'}`}>
                            {batch.status}
                          </span>
                        </button>
                        {isOpen && sessions.length > 0 && (
                          <div className="px-10 pb-3 pt-1 space-y-1.5">
                            {sessions.map((s, i) => (
                              <div key={s.id} className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="w-4 text-right text-gray-300 font-mono text-[11px]">{i + 1}</span>
                                <span className="text-gray-600 font-medium">{s.name}</span>
                                <span className="text-gray-300">·</span>
                                <span>{fmtDate(s.session_date)}</span>
                                <span className="text-gray-300">·</span>
                                <span>{s.start_time.slice(0, 5)}</span>
                                {s.gcal_event_id && <span className="text-[10px] text-emerald-500 font-medium">GCal ✓</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Filter bar */}
            <div className="space-y-2 mb-4">
              {/* Row 1: Status + Matière */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase self-center mr-0.5">Statut</span>
                  {(['pending', 'confirmed', 'cancelled'] as const).map(s => {
                    const on = filterStatuses.has(s)
                    return (
                      <button key={s} onClick={() => setFilterStatuses(prev => { const n = new Set(prev); on ? n.delete(s) : n.add(s); return n })}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${on ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                        {t.status[s]}
                      </button>
                    )
                  })}
                </div>
                {courses.length > 1 && <div className="h-5 w-px bg-gray-200" />}
                {courses.length > 1 && (
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase self-center mr-0.5">Matière</span>
                    {courses.map(c => {
                      const col = SUBJECT_COLORS_CRM[c] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
                      const on = filterCourses.has(c)
                      return (
                        <button key={c} onClick={() => setFilterCourses(prev => { const n = new Set(prev); on ? n.delete(c) : n.add(c); return n })}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${on ? `${col.bg} ${col.text} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                          {c}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Row 2: Prof dropdown + GCal élève + group + period */}
              <div className="flex flex-wrap gap-2 items-center">
                {teachers.length > 0 && (
                  <MultiSelectDropdown
                    label={filterTeachers.size === 0 ? t.allProfs : [...filterTeachers].map(n => n.split(' ')[0]).join(', ')}
                    options={teachers.map(tc => ({ value: tc, label: tc }))}
                    selected={filterTeachers}
                    onChange={setFilterTeachers}
                  />
                )}

                <div className="h-5 w-px bg-gray-200 ml-auto" />

                {/* Group by */}
                <div className="flex gap-1.5 items-center">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">{t.groupByLabel}</span>
                  {(['none', 'teacher', 'subject'] as const).map(v => (
                    <button key={v} onClick={() => setGroupBy(v)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${groupBy === v ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                      {t.groupBy[v]}
                    </button>
                  ))}
                </div>

                <div className="h-5 w-px bg-gray-200" />

                {/* Période */}
                <div className="flex gap-1.5 items-center">
                  {(['all', 'upcoming', 'past'] as const).map(v => (
                    <button key={v} onClick={() => setTimeFilter(v)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${timeFilter === v ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300'}`}>
                      {t.period[v]}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {loading ? (
                <p className="p-6 text-sm text-gray-400">{t.loading}</p>
              ) : filtered.length === 0 ? (
                <p className="p-6 text-sm text-gray-400">{t.empty}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleSort('date')}>{t.cols.date}<SortIndicator active={sortCol === 'date'} dir={sortDir} /></th>
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleSort('teacher')}>{t.cols.teacher}<SortIndicator active={sortCol === 'teacher'} dir={sortDir} /></th>
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleSort('course')}>{t.cols.course}<SortIndicator active={sortCol === 'course'} dir={sortDir} /></th>
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleSort('student')}>{t.cols.student}<SortIndicator active={sortCol === 'student'} dir={sortDir} /></th>
                      <th className="text-left px-4 py-3 font-medium text-gray-400 uppercase text-xs whitespace-nowrap">{t.cols.status}</th>
                      <th className="w-8 px-3 py-3" />
                    </tr>
                  </thead>
                  {(() => {
                    // Group sorted bookings
                    type BGroup = { key: string; rows: typeof sorted }
                    const groups: BGroup[] = groupBy === 'none'
                      ? [{ key: 'all', rows: sorted }]
                      : (() => {
                          const map = new Map<string, typeof sorted>()
                          for (const b of sorted) {
                            const key = groupBy === 'teacher' ? (b.teachers?.name ?? '—') : b.subject
                            if (!map.has(key)) map.set(key, [])
                            map.get(key)!.push(b)
                          }
                          return [...map.entries()].map(([key, rows]) => ({ key, rows }))
                        })()

                    return groups.map(group => (
                      <tbody key={group.key}>
                        {groupBy !== 'none' && (
                          <tr className="bg-gray-100/60 border-b border-gray-100">
                            <td colSpan={6} className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {groupBy === 'teacher' && group.key !== 'all' && <TeacherAvatar name={group.key} />}
                                {groupBy === 'subject' && (() => {
                                  const col = SUBJECT_COLORS_CRM[group.key] ?? { bg: 'bg-gray-100', text: 'text-gray-500' }
                                  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>{group.key}</span>
                                })()}
                                {groupBy === 'teacher' && <span className="text-xs font-semibold text-gray-600">{group.key}</span>}
                                <span className="text-xs text-gray-400 ml-1">({group.rows.length})</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {group.rows.map(b => {
                          const isOpen = expandedBooking === b.id
                          const subjectColor = SUBJECT_COLORS_CRM[b.subject] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
                          const clickHandler = () => setExpandedBooking(isOpen ? null : b.id)
                          const cancelledCls = b.status === 'cancelled' ? 'opacity-50' : ''
                          const hoverCls = isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'
                          return (
                            <>
                              <tr key={b.id}
                                className={`border-b border-gray-100 transition-colors cursor-pointer select-none ${cancelledCls} ${hoverCls}`}
                                onClick={clickHandler}
                              >
                                <td className="px-4 py-3 text-gray-700 whitespace-nowrap align-middle">
                                  {format(parseISO(b.slot_start), t.dateFormat, { locale: t.locale })}
                                </td>
                                <td className="px-4 py-3 text-gray-700 align-middle">
                                  <div className="flex items-center gap-2">
                                    {b.teachers?.name && <TeacherAvatar name={b.teachers.name} />}
                                    <span>{b.teachers?.name?.split(' ')[0] ?? '—'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 align-middle">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subjectColor.bg} ${subjectColor.text}`}>{b.subject}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    className="font-semibold text-gray-900 hover:text-blue-600 hover:underline transition-colors text-left"
                                    onClick={e => { e.stopPropagation(); setStatsModal(b.student_email) }}
                                  >
                                    {b.student_name}
                                  </button>
                                </td>
                                <td className="px-4 py-3 align-middle">
                                  <div className="flex flex-col gap-1.5">
                                    {b.status === 'pending' && (
                                      <span className="text-[11px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full w-fit">
                                        {lang === 'fr' ? 'En attente' : 'Pending'}
                                      </span>
                                    )}
                                    {b.status === 'confirmed' && (
                                      <span className="text-[11px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full w-fit">
                                        {lang === 'fr' ? 'Confirmé' : 'Confirmed'}
                                      </span>
                                    )}
                                    {b.status === 'cancelled' && (
                                      <span className="text-[11px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full w-fit">
                                        {lang === 'fr' ? 'Annulé' : 'Cancelled'}
                                      </span>
                                    )}
                                    {b.teacher_response === 'declined' && (
                                      <span className="flex items-center gap-1 text-[11px] font-medium text-red-500 w-fit" title={lang === 'fr' ? 'Prof a refusé' : 'Teacher declined'}>
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M12 5v7" />
                                          <circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none" />
                                        </svg>
                                        {lang === 'fr' ? 'Prof' : 'Teacher'}
                                      </span>
                                    )}
                                    {b.teacher_response === 'accepted' && (
                                      <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 w-fit" title={lang === 'fr' ? 'Prof a confirmé' : 'Teacher confirmed'}>
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M5 13l4 4L19 7" />
                                        </svg>
                                        {lang === 'fr' ? 'Prof' : 'Teacher'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-gray-300 align-middle">
                                  <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                </td>
                              </tr>
                              {isOpen && (
                                <tr key={`${b.id}-exp`} className="border-b border-gray-100 bg-gray-50">
                                  <td colSpan={6} className="px-6 py-3">
                                    <div className="flex items-center gap-3 text-sm flex-wrap">
                                      <span className="text-gray-600">{b.student_email}</span>
                                      <span className="text-gray-200">·</span>
                                      <span className="text-gray-500">{b.student_phone}</span>
                                      {b.contact_pref === 'telegram' ? (
                                        <>
                                          <input
                                            className="w-28 text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500 placeholder-gray-300 focus:outline-none focus:border-sky-400 bg-white"
                                            defaultValue={b.telegram_username ? `@${b.telegram_username}` : ''}
                                            placeholder="@username"
                                            onClick={e => e.stopPropagation()}
                                            onBlur={e => { if (e.target.value !== (b.telegram_username ? `@${b.telegram_username}` : '')) handleUpdateBookingTgUsername(b.id, e.target.value) }}
                                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                                          />
                                          <a href={b.telegram_username ? `https://t.me/${b.telegram_username}` : tgLink(b.student_phone)} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs text-white bg-sky-500 hover:bg-sky-600 px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap">
                                            <TgIcon /> Telegram
                                          </a>
                                        </>
                                      ) : (
                                        <a href={`mailto:${b.student_email}`}
                                          className="flex items-center gap-1.5 text-xs text-white bg-violet-500 hover:bg-violet-600 px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap">
                                          <EmailIcon /> Email
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          )
                        })}
                      </tbody>
                    ))
                  })()}

                </table>
              )}
            </div>
          </>
        )}

        {/* ── INVOICES VIEW ── */}
        {view === 'invoices' && (
          <div className="space-y-2">
            {loadingInvoices ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400">
                {t.loading}
              </div>
            ) : invoices.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400">
                {lang === 'fr' ? 'Aucune facture.' : 'No invoices yet.'}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                      <th className="text-left px-4 py-3 font-medium">{lang === 'fr' ? 'Date' : 'Date'}</th>
                      <th className="text-left px-4 py-3 font-medium">{lang === 'fr' ? 'N°' : 'No.'}</th>
                      <th className="text-left px-4 py-3 font-medium">{lang === 'fr' ? 'Élève' : 'Student'}</th>
                      <th className="text-left px-4 py-3 font-medium">{lang === 'fr' ? 'Matière' : 'Subject'}</th>
                      <th className="text-left px-4 py-3 font-medium">{lang === 'fr' ? 'Format' : 'Format'}</th>
                      <th className="text-left px-4 py-3 font-medium">{lang === 'fr' ? 'Pack' : 'Pack'}</th>
                      <th className="text-right px-4 py-3 font-medium">{lang === 'fr' ? 'Montant' : 'Amount'}</th>
                      <th className="text-left px-4 py-3 font-medium">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => {
                      const app = inv.applications
                      const isPaid = inv.status === 'paid'
                      return (
                        <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {new Date(inv.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                            #{String(inv.invoice_number).padStart(3, '0')}
                          </td>
                          <td className="px-4 py-3">
                            {app?.email ? (
                              <button
                                className="font-semibold text-gray-900 hover:text-blue-600 hover:underline transition-colors text-left"
                                onClick={() => setStatsModal(app.email)}
                              >
                                {app.name}
                              </button>
                            ) : (
                              <p className="font-semibold text-gray-900">{app?.name ?? '—'}</p>
                            )}
                            <p className="text-xs text-gray-400">{app?.email ?? ''}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{app?.subject ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              inv.format === 'individual' ? 'bg-blue-50 text-blue-700' :
                              inv.format === 'pair' ? 'bg-purple-50 text-purple-700' :
                              'bg-green-50 text-green-700'
                            }`}>
                              {inv.format === 'individual' ? (lang === 'fr' ? 'Individuel' : 'Individual') :
                               inv.format === 'pair' ? (lang === 'fr' ? 'Duo' : 'Pair') :
                               (lang === 'fr' ? 'Groupe' : 'Group')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {inv.lessons_count} {lang === 'fr' ? 'cours' : 'lessons'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {inv.total_amount}€
                          </td>
                          <td className="px-4 py-3">
                            {isPaid ? (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                                {lang === 'fr' ? 'Payé' : 'Paid'}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                                {lang === 'fr' ? 'En attente' : 'Pending'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {inv.pdf_url && (
                                <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                                  PDF
                                </a>
                              )}
                              {!isPaid && (
                                <button
                                  onClick={async () => {
                                    if (!confirm(lang === 'fr' ? 'Confirmer la réception du paiement ?' : 'Confirm payment received?')) return
                                    const res = await fetch(`/api/invoices/${inv.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'paid' }),
                                    })
                                    if (res.ok) setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i))
                                  }}
                                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg font-medium transition-colors">
                                  {lang === 'fr' ? 'Paiement reçu' : 'Mark paid'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CRM VIEW — D2×A ── */}
        {view === 'crm' && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {courses.length > 1 && (
                <div className="flex gap-1.5">
                  {(['all', ...courses] as string[]).map(c => (
                    <button key={c} onClick={() => setCrmFilterCourse(c)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${crmFilterCourse === c ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'}`}>
                      {c === 'all' ? t.allCourses : c}
                    </button>
                  ))}
                </div>
              )}
              {teachers.length > 1 && <div className="h-5 w-px bg-gray-200" />}
              {teachers.length > 1 && (
                <select value={crmFilterTeacher} onChange={e => setCrmFilterTeacher(e.target.value)}
                  className="text-xs border border-gray-200 rounded-full px-3 py-1 bg-white text-gray-600 focus:outline-none cursor-pointer">
                  <option value="all">{t.allTeachers}</option>
                  {teachers.map(tc => <option key={tc} value={tc}>{tc}</option>)}
                </select>
              )}
              <div className="h-5 w-px bg-gray-200" />
              <select
                value={`${crmSortCol}:${crmSortDir}`}
                onChange={e => {
                  const [col, dir] = e.target.value.split(':')
                  setCrmSortCol(col as 'name' | 'total' | 'createdAt')
                  setCrmSortDir(dir as 'asc' | 'desc')
                }}
                className="text-xs border border-gray-200 rounded-full px-3 py-1 bg-white text-gray-600 focus:outline-none cursor-pointer"
              >
                <option value="total:desc">Most sessions</option>
                <option value="total:asc">Fewest sessions</option>
                <option value="name:asc">Name A to Z</option>
                <option value="name:desc">Name Z to A</option>
                <option value="createdAt:desc">Latest created</option>
                <option value="createdAt:asc">First created</option>
              </select>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400">{t.loading}</p>
            ) : visibleStudents.length === 0 ? (
              <p className="text-sm text-gray-400">{t.emptyCrm}</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {visibleStudents.map(s => {
                    const parentOpen = openParents.has(s.email)
                    const tgOk = isTgEligible(s.country_code, s.learningLang)

                    return (
                      <div key={s.email} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex">
                          {/* Student section */}
                          <div className={`p-5 ${parentOpen ? 'w-[70%]' : 'flex-1'} border-r border-gray-100`}>
                            <div className="flex items-start gap-3 mb-3">
                              <button type="button" className="relative shrink-0 cursor-pointer focus:outline-none"
                                onClick={e => { e.stopPropagation(); setStatsModal(s.email) }}>
                                <span className={`inline-flex items-center justify-center w-11 h-11 rounded-full text-sm font-bold ${avatarColorCrm(s.name)}`}>
                                  {nameInitials(s.name)}
                                </span>
                              </button>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-gray-900">{s.name}</p>
                                  {(s.communicationLang ?? s.learningLang) && (() => {
                                    const cl = (s.communicationLang ?? s.learningLang)!
                                    const badge: Record<string, string> = { en: 'bg-blue-50 text-blue-500', et: 'bg-green-50 text-green-600', ru: 'bg-orange-50 text-orange-500', ky: 'bg-purple-50 text-purple-500' }
                                    return (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${badge[cl] ?? 'bg-gray-100 text-gray-500'}`}>
                                        {cl}
                                      </span>
                                    )
                                  })()}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{s.email}</p>
                                <p className="text-xs text-gray-400">{s.phone}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {s.combos.map((c, i) => (
                                <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${subjectColorCrm(c.subject).bg} ${subjectColorCrm(c.subject).text}`}>
                                  <span>{teacherInitialsCrm(c.teacher)}</span>
                                  <span className="opacity-50">·</span>
                                  <span>{c.subject}</span>
                                  {s.grade && <span className="opacity-60 font-normal">{s.grade}</span>}
                                  <span className="text-blue-500 font-bold ml-0.5">×{c.count}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {tgOk ? (
                                <>
                                  <a href={tgLink(s.phone)} target="_blank" rel="noopener noreferrer"
                                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${s.prefs.includes('telegram') ? 'bg-sky-500 text-white hover:bg-sky-600' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}>
                                    <TgIcon /> Telegram
                                  </a>
                                  {s.tgSynced
                                    ? <span title="Bot connected" className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100 text-green-600 shrink-0">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><path d="M20 6 9 17l-5-5"/></svg>
                                      </span>
                                    : <span title="Bot not connected" className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-dashed border-gray-300 text-gray-400 text-[9px] font-bold shrink-0">?</span>
                                  }
                                </>
                              ) : (
                                <span title="Telegram not available for this region" className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-50 text-gray-300 line-through cursor-default whitespace-nowrap select-none">
                                  <TgIcon /> Telegram
                                </span>
                              )}
                              <a href={`mailto:${s.email}`}
                                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${s.prefs.includes('email') ? 'bg-violet-500 text-white hover:bg-violet-600' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}>
                                <EmailIcon /> Email
                              </a>
                            </div>
                          </div>

                          {/* Chevron toggle — always visible on right edge */}
                          {!parentOpen && (
                            <button onClick={e => { e.stopPropagation(); toggleParent(s.email) }}
                              className="flex items-center px-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg>
                            </button>
                          )}

                          {/* Parent panel — collapsible */}
                          {parentOpen && (
                            <div className="w-[30%] p-4 flex flex-col gap-2 border-l border-gray-100">
                              <div className="flex items-center justify-between mb-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">👪</span>
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t.parent}</p>
                                </div>
                                <button onClick={e => { e.stopPropagation(); toggleParent(s.email) }}
                                  className="text-gray-400 hover:text-gray-600 transition-colors">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m9 18 6-6-6-6"/></svg>
                                </button>
                              </div>
                              <input
                                key={`pname-${s.email}-${s.parent_name ?? ''}`}
                                type="text"
                                defaultValue={s.parent_name ?? ''}
                                placeholder="Full name"
                                onClick={e => e.stopPropagation()}
                                className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:border-blue-400 bg-white"
                                onBlur={e => { if (s.appId && e.target.value !== (s.parent_name ?? '')) handleUpdateParentName(s.appId, e.target.value) }}
                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                              />
                              <input
                                key={`contact-${s.email}-${s.parent_contact ?? ''}`}
                                type="text"
                                defaultValue={s.parent_contact ?? ''}
                                placeholder="Phone"
                                onClick={e => e.stopPropagation()}
                                className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:border-blue-400 bg-white"
                                onBlur={e => { if (s.appId && e.target.value !== (s.parent_contact ?? '')) handleUpdateParentContact(s.appId, e.target.value) }}
                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                              />
                              <input
                                key={`email-${s.email}-${s.parent_email ?? ''}`}
                                type="email"
                                defaultValue={s.parent_email ?? ''}
                                placeholder="Email"
                                onClick={e => e.stopPropagation()}
                                className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:border-blue-400 bg-white"
                                onBlur={e => { if (s.appId && e.target.value !== (s.parent_email ?? '')) handleUpdateParentEmail(s.appId, e.target.value) }}
                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                              />
                              <div className="flex flex-col gap-1 mt-0.5">
                                {tgOk && s.parent_contact && (
                                  <a href={tgLink(s.parent_contact)} target="_blank" rel="noopener noreferrer"
                                    className="w-fit flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors whitespace-nowrap">
                                    <TgIcon /> Telegram
                                  </a>
                                )}
                                {s.parent_email && (
                                  <a href={`mailto:${s.parent_email}`}
                                    className="w-fit flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium bg-violet-500 text-white hover:bg-violet-600 transition-colors whitespace-nowrap">
                                    <EmailIcon /> Email
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

              </>
            )}
          </>
        )}

        {/* ── STUDENT STATS MODAL (accessible from any tab) ── */}
        {statsModal && (() => {
          const s = students.find(st => st.email === statsModal)
          if (!s) return null
          const invoiceStatusMap = new Map(invoices.map(inv => [inv.id, inv.status]))
          const studentBookings: PanelBooking[] = bookings
            .filter(b => b.student_email === s.email)
            .map(b => {
              const invStatus = b.invoice_id ? (invoiceStatusMap.get(b.invoice_id) ?? null) : null
              return {
                id: b.id,
                date: b.slot_start,
                subject: b.subject,
                teacher: b.teachers?.name ?? '—',
                status: b.status as 'confirmed' | 'pending' | 'cancelled',
                amount: b.amount ?? 0,
                invoice_id: b.invoice_id ?? null,
                invoice_status: invStatus,
              }
            })
          const initialPaidIds = new Set(studentBookings.filter(b => b.invoice_status === 'paid').map(b => b.id))
          const initialInvoiceSentIds = new Set(studentBookings.filter(b => b.invoice_status === 'sent' || b.invoice_status === 'paid').map(b => b.id))
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setStatsModal(null)}>
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold ${avatarColorCrm(s.name)}`}>{crmInitials(s.name)}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        {(s.communicationLang ?? s.learningLang) && (() => {
                          const cl = (s.communicationLang ?? s.learningLang)!
                          const badge: Record<string, string> = { en: 'bg-blue-50 text-blue-500', et: 'bg-green-50 text-green-600', ru: 'bg-orange-50 text-orange-500', ky: 'bg-purple-50 text-purple-500' }
                          return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${badge[cl] ?? 'bg-gray-100 text-gray-500'}`}>{cl}</span>
                        })()}
                        {s.grade && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">{s.grade}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setStatsModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="w-4 h-4"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                <StudentStatsPanelAdmin key={s.email} bookings={studentBookings} studentName={s.name} grade={s.grade} initialPaidIds={initialPaidIds} initialInvoiceSentIds={initialInvoiceSentIds} />
              </div>
            </div>
          )
        })()}

      </div>
    </main>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SortIndicator({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <span className="ml-1 opacity-25">⇕</span>
  return <span className="ml-1 text-blue-500">{dir === 'asc' ? '↑' : '↓'}</span>
}

function teacherColor(name: string): string {
  const colors = ['bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700', 'bg-pink-100 text-pink-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-indigo-100 text-indigo-700', 'bg-rose-100 text-rose-700']
  let h = 0; for (const c of name) h = (h + c.charCodeAt(0)) % colors.length; return colors[h]
}

function TeacherAvatar({ name }: { name: string }) {
  const parts = name.trim().split(' ')
  const initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  return <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold shrink-0 ${teacherColor(name)}`}>{initials.toUpperCase()}</span>
}

function ParentIcon() {
  return (
    <svg className="w-3 h-3 inline-block mr-1 opacity-40 relative -top-px" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
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
