'use client'

import { useEffect, useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

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
  status: string
  teachers: { name: string } | null
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
  parent_email: string | null
  total: number
  combos: Combo[]
}

type ParentStatus = 'to_contact' | 'contacted' | 'answered'
type SortCol = 'date' | 'teacher' | 'course' | 'student' | 'status'
type FilterMinors = 'all' | 'minors' | 'non_minors' | 'to_contact' | 'contacted' | 'answered'

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
    allMinors: 'Tous',
    minorsOnly: 'Mineurs',
    nonMinors: 'Non mineurs',
    parentNotReached: 'Parent non contacté',
    loading: 'Chargement…',
    empty: 'Aucune réservation.',
    emptyCrm: 'Aucun élève.',
    status: { pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé' },
    cols: { date: 'Date / Heure', teacher: 'Professeur', course: 'Matière', student: 'Élève', contact: 'Contact', status: 'Statut' },
    crmCols: { student: 'Élève', contact: 'Contact', courses: 'Matières', teachers: 'Professeurs' },
    minor: 'Mineur',
    responsible: 'Responsable',
    parent: 'Parent',
    toContact: 'Marquer contacté',
    contacted: 'Contacté',
    answered: 'A répondu',
    parentStatusFilter: { to_contact: 'À contacter', contacted: 'Contacté', answered: 'A répondu' },
    total: (n: number) => `${n} total`,
    dateFormat: "d MMM 'à' HH'h'mm",
    locale: fr,
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
    allMinors: 'All',
    minorsOnly: 'Minors',
    nonMinors: 'Non-minors',
    parentNotReached: 'Parent not reached',
    loading: 'Loading…',
    empty: 'No bookings.',
    emptyCrm: 'No students.',
    status: { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' },
    cols: { date: 'Date / Time', teacher: 'Teacher', course: 'Course', student: 'Student', contact: 'Contact', status: 'Status' },
    crmCols: { student: 'Student', contact: 'Contact', courses: 'Courses', teachers: 'Teachers' },
    minor: 'Minor',
    responsible: 'Responsible',
    parent: 'Parent',
    toContact: 'Mark contacted',
    contacted: 'Contacted',
    answered: 'Answered',
    parentStatusFilter: { to_contact: 'To contact', contacted: 'Contacted', answered: 'Answered' },
    total: (n: number) => `${n} total`,
    dateFormat: "d MMM 'at' HH:mm",
    locale: enUS,
  },
}

function waLink(phone: string) { return `https://wa.me/${phone.replace(/\D/g, '')}` }
function tgLink(phone: string) { return `https://t.me/+${phone.replace(/\D/g, '')}` }

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

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [view, setView] = useState<'bookings' | 'crm'>('bookings')

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCourse, setFilterCourse] = useState<string>('all')
  const [filterTeacher, setFilterTeacher] = useState<string>('all')
  const [filterMinors, setFilterMinors] = useState<FilterMinors>('all')

  const [crmFilterCourse, setCrmFilterCourse] = useState<string>('all')
  const [crmFilterTeacher, setCrmFilterTeacher] = useState<string>('all')
  const [crmFilterMinors, setCrmFilterMinors] = useState<FilterMinors>('all')
  const [crmSortCol, setCrmSortCol] = useState<'name' | 'total'>('total')
  const [crmSortDir, setCrmSortDir] = useState<'asc' | 'desc'>('desc')
  const [sortCol, setSortCol] = useState<SortCol>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function handleCrmSort(col: 'name' | 'total') {
    if (crmSortCol === col) setCrmSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setCrmSortCol(col); setCrmSortDir(col === 'total' ? 'desc' : 'asc') }
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
  }, [])

  const courses = useMemo(() => [...new Set(bookings.map(b => b.subject))].sort(), [bookings])
  const teachers = useMemo(() => [...new Set(bookings.map(b => b.teachers?.name).filter(Boolean) as string[])].sort(), [bookings])

  const filtered = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (filterCourse !== 'all' && b.subject !== filterCourse) return false
    if (filterTeacher !== 'all' && b.teachers?.name !== filterTeacher) return false
    if (filterMinors === 'minors' && !b.is_minor) return false
    if (filterMinors === 'non_minors' && b.is_minor) return false
    if (['to_contact', 'contacted', 'answered'].includes(filterMinors) && (!b.is_minor || (parentStatus[b.student_email] ?? 'to_contact') !== filterMinors)) return false
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
    const map = new Map<string, StudentRow>()
    bookings.forEach(b => {
      const key = b.student_email
      if (!map.has(key)) {
        map.set(key, {
          name: b.student_name,
          email: b.student_email,
          phone: b.student_phone,
          prefs: [],
          is_minor: b.is_minor,
          parent_name: b.parent_name,
          parent_contact: b.parent_contact,
          parent_email: b.parent_email,
          total: 0,
          combos: [],
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
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [bookings])

  const visibleStudents = useMemo(() => {
    let result = students
    if (crmFilterMinors === 'minors') result = result.filter(s => s.is_minor)
    else if (crmFilterMinors === 'non_minors') result = result.filter(s => !s.is_minor)
    else if (['to_contact', 'contacted', 'answered'].includes(crmFilterMinors))
      result = result.filter(s => s.is_minor && (parentStatus[s.email] ?? 'to_contact') === crmFilterMinors)
    if (crmFilterCourse !== 'all') result = result.filter(s => s.combos.some(c => c.subject === crmFilterCourse))
    if (crmFilterTeacher !== 'all') result = result.filter(s => s.combos.some(c => c.teacher === crmFilterTeacher))
    return [...result].sort((a, b) => {
      const cmp = crmSortCol === 'name' ? a.name.localeCompare(b.name) : a.total - b.total
      return crmSortDir === 'asc' ? cmp : -cmp
    })
  }, [students, crmFilterMinors, crmFilterCourse, crmFilterTeacher, crmSortCol, crmSortDir])

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-screen-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🦤 {t.title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{t.bookings(bookings.length)}</span>
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 shadow-sm text-sm">
              {(['bookings', 'crm'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-lg font-medium transition-all ${view === v ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                  {v === 'bookings' ? t.viewBookings : t.viewCrm}
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
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              {/* Status */}
              <div className="flex gap-1.5">
                {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                    {s === 'all' ? t.allStatuses : t.status[s]}
                  </button>
                ))}
              </div>

              {/* Courses */}
              {courses.length > 1 && <div className="h-5 w-px bg-gray-200" />}
              {courses.length > 1 && (
                <div className="flex gap-1.5">
                  {['all', ...courses].map(c => (
                    <button key={c} onClick={() => setFilterCourse(c)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterCourse === c ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'}`}>
                      {c === 'all' ? t.allCourses : c}
                    </button>
                  ))}
                </div>
              )}

              {/* Teachers dropdown */}
              {teachers.length > 1 && <div className="h-5 w-px bg-gray-200" />}
              {teachers.length > 1 && (
                <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
                  className="text-xs border border-gray-200 rounded-full px-3 py-1 bg-white text-gray-600 focus:outline-none cursor-pointer">
                  <option value="all">{t.allTeachers}</option>
                  {teachers.map(tc => <option key={tc} value={tc}>{tc}</option>)}
                </select>
              )}

              {/* Minors dropdown — always last */}
              <div className="h-5 w-px bg-gray-200" />
              <select
                value={filterMinors}
                onChange={e => setFilterMinors(e.target.value as FilterMinors)}
                className={`text-xs border rounded-full px-3 py-1 bg-white focus:outline-none cursor-pointer transition-colors ${
                  filterMinors !== 'all'
                    ? 'text-orange-500 border-orange-400 font-medium'
                    : 'text-gray-500 border-gray-200 hover:border-orange-300'
                }`}
              >
                <option value="all">{t.allMinors}</option>
                <option value="minors">{t.minorsOnly}</option>
                <option value="non_minors">{t.nonMinors}</option>
                <option value="to_contact">{t.parentStatusFilter.to_contact}</option>
                <option value="contacted">{t.parentStatusFilter.contacted}</option>
                <option value="answered">{t.parentStatusFilter.answered}</option>
              </select>
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
                      <th className="w-6 px-3 py-3" />
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleSort('date')}>{t.cols.date}<SortIndicator active={sortCol === 'date'} dir={sortDir} /></th>
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleSort('teacher')}>{t.cols.teacher}<SortIndicator active={sortCol === 'teacher'} dir={sortDir} /></th>
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleSort('course')}>{t.cols.course}<SortIndicator active={sortCol === 'course'} dir={sortDir} /></th>
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleSort('student')}>{t.cols.student}<SortIndicator active={sortCol === 'student'} dir={sortDir} /></th>
                      <th className="text-left px-4 py-3 font-medium">{t.cols.contact}</th>
                      <th className="w-20 px-3 py-3" />
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleSort('status')}>{t.cols.status}<SortIndicator active={sortCol === 'status'} dir={sortDir} /></th>
                    </tr>
                  </thead>
                  {sorted.map(b => {
                    const pStatus = b.is_minor ? (parentStatus[b.student_email] ?? 'to_contact') : 'to_contact'
                    const hasParent = b.is_minor && !!b.parent_contact
                    const span = hasParent ? 2 : 1
                    const divStyle = hasParent ? { borderBottom: '1px solid #e5e7eb' } : {}
                    const statusBadge = (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {t.status[b.status as keyof typeof t.status] ?? b.status}
                      </span>
                    )
                    return (
                      <tbody key={b.id} className="group">
                        <tr className={`group-hover:bg-gray-50 transition-colors ${!hasParent ? 'border-b border-gray-200' : ''}`}>
                          <td rowSpan={span} className="px-3 pt-3 pb-0 align-top">
                            {b.is_minor && (
                              <span
                                title={`Minor — ${pStatus === 'answered' ? 'parent answered' : pStatus === 'contacted' ? 'parent contacted' : 'reach their parent'}`}
                                className={`inline-block w-2.5 h-2.5 rounded-full cursor-help ${dotColorClass(pStatus)}`}
                              />
                            )}
                          </td>
                          <td rowSpan={span} className="px-4 py-3 text-gray-700 whitespace-nowrap align-middle">
                            {format(parseISO(b.slot_start), t.dateFormat, { locale: t.locale })}
                          </td>
                          <td rowSpan={span} className="px-4 py-3 text-gray-700 align-middle">
                            <div className="flex items-center gap-2">
                              {b.teachers?.name && <TeacherAvatar name={b.teachers.name} />}
                              <span>{b.teachers?.name?.split(' ')[0] ?? '—'}</span>
                            </div>
                          </td>
                          <td rowSpan={span} className="px-4 py-3 text-gray-700 align-middle">{b.subject}</td>
                          <td className="px-4 py-3" style={divStyle}>
                            <p className="font-semibold text-gray-900">{b.student_name}</p>
                          </td>
                          <td className="px-4 py-3" style={divStyle}>
                            <p className="text-xs text-gray-400">{b.student_email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{b.student_phone}</p>
                          </td>
                          <td className="px-3 py-3" style={divStyle}>
                            <div className="flex flex-col gap-1">
                              {b.contact_pref?.split(',').map(pref => (
                                pref === 'whatsapp' ? (
                                  <a key="wa" href={waLink(b.student_phone)} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit">
                                    <WaIcon /> WhatsApp
                                  </a>
                                ) : pref === 'telegram' ? (
                                  <a key="tg" href={tgLink(b.student_phone)} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-white bg-sky-500 hover:bg-sky-600 px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit">
                                    <TgIcon /> Telegram
                                  </a>
                                ) : (
                                  <a key="em" href={`mailto:${b.student_email}`}
                                    className="flex items-center gap-1.5 text-xs text-white bg-violet-500 hover:bg-violet-600 px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit">
                                    <EmailIcon /> Email
                                  </a>
                                )
                              ))}
                            </div>
                          </td>
                          <td rowSpan={span} className="px-4 pt-3 pb-0 align-top">{statusBadge}</td>
                        </tr>
                        {hasParent && (
                          <tr className="border-b border-gray-200 group-hover:bg-gray-50 transition-colors">
                            {/* dot, date, teacher, course, status spanned */}
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900"><ParentIcon />{b.parent_name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-gray-400">{b.parent_contact}</p>
                              {b.parent_email && <p className="text-xs text-gray-400 mt-0.5">{b.parent_email}</p>}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-1">
                                {(() => {
                                  const pp = b.parent_pref?.split(',') ?? []
                                  const waActive = pp.length > 0 ? pp.includes('whatsapp') : true
                                  const tgActive = pp.length > 0 ? pp.includes('telegram') : true
                                  const emActive = pp.includes('email')
                                  return (<>
                                    <a href={waLink(b.parent_contact!)} target="_blank" rel="noopener noreferrer"
                                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit ${waActive ? 'text-white bg-emerald-500 hover:bg-emerald-600' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}>
                                      <WaIcon /> WhatsApp
                                    </a>
                                    <a href={tgLink(b.parent_contact!)} target="_blank" rel="noopener noreferrer"
                                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit ${tgActive ? 'text-white bg-sky-500 hover:bg-sky-600' : 'text-sky-600 bg-sky-50 hover:bg-sky-100'}`}>
                                      <TgIcon /> Telegram
                                    </a>
                                    {b.parent_email && (
                                      <a href={`mailto:${b.parent_email}`}
                                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap w-fit ${emActive ? 'text-white bg-violet-500 hover:bg-violet-600' : 'text-violet-600 bg-violet-50 hover:bg-violet-100'}`}>
                                        <EmailIcon /> Email
                                      </a>
                                    )}
                                  </>)
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    )
                  })}
                </table>
              )}
            </div>
          </>
        )}

        {/* ── CRM VIEW ── */}
        {view === 'crm' && (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Course pills */}
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
              {/* Teacher dropdown */}
              {teachers.length > 1 && <div className="h-5 w-px bg-gray-200" />}
              {teachers.length > 1 && (
                <select value={crmFilterTeacher} onChange={e => setCrmFilterTeacher(e.target.value)}
                  className="text-xs border border-gray-200 rounded-full px-3 py-1 bg-white text-gray-600 focus:outline-none cursor-pointer">
                  <option value="all">{t.allTeachers}</option>
                  {teachers.map(tc => <option key={tc} value={tc}>{tc}</option>)}
                </select>
              )}
              {/* Minors / parent status dropdown */}
              <div className="h-5 w-px bg-gray-200" />
              <select
                value={crmFilterMinors}
                onChange={e => setCrmFilterMinors(e.target.value as FilterMinors)}
                className={`text-xs border rounded-full px-3 py-1 bg-white focus:outline-none cursor-pointer transition-colors ${
                  crmFilterMinors !== 'all'
                    ? 'text-orange-500 border-orange-400 font-medium'
                    : 'text-gray-500 border-gray-200 hover:border-orange-300'
                }`}
              >
                <option value="all">{t.allMinors}</option>
                <option value="minors">{t.minorsOnly}</option>
                <option value="non_minors">{t.nonMinors}</option>
                <option value="to_contact">{t.parentStatusFilter.to_contact}</option>
                <option value="contacted">{t.parentStatusFilter.contacted}</option>
                <option value="answered">{t.parentStatusFilter.answered}</option>
              </select>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400">{t.loading}</p>
            ) : visibleStudents.length === 0 ? (
              <p className="text-sm text-gray-400">{t.emptyCrm}</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                      <th className="w-6 px-3 py-3" />
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleCrmSort('name')}>{t.crmCols.student}<SortIndicator active={crmSortCol === 'name'} dir={crmSortDir} /></th>
                      <th className="text-left px-4 py-3 font-medium">{t.crmCols.contact}</th>
                      <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleCrmSort('total')}>{t.crmCols.courses}<SortIndicator active={crmSortCol === 'total'} dir={crmSortDir} /></th>
                      <th className="text-left px-4 py-3 font-medium">{t.crmCols.teachers}</th>
                    </tr>
                  </thead>
                  {visibleStudents.map(s => {
                    const pStatus = s.is_minor ? (parentStatus[s.email] ?? 'to_contact') : 'to_contact'
                    const sep = { borderBottom: '1px solid #f3f4f6' }
                    return (
                      <tbody key={s.email} className="group">
                        <tr className={`group-hover:bg-gray-50 transition-colors ${!s.is_minor ? 'border-b border-gray-200' : ''}`}>
                          {/* Dot — rowspan 2 for minors, no border on it */}
                          <td rowSpan={s.is_minor ? 2 : 1} className="px-3 pt-3 pb-0 align-top">
                            {s.is_minor && (
                              <span
                                title={`Minor — ${pStatus === 'answered' ? 'parent answered' : pStatus === 'contacted' ? 'parent contacted' : 'reach their parent'}`}
                                className={`inline-block w-2.5 h-2.5 rounded-full cursor-help ${dotColorClass(pStatus)}`}
                              />
                            )}
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
                            <p className="text-xs text-gray-400 mb-1.5">{t.total(s.total)}</p>
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
                              {s.parent_name && <p className="font-semibold text-gray-900"><ParentIcon />{s.parent_name}</p>}
                              {s.parent_contact && <p className="text-xs text-gray-400 mt-0.5">{s.parent_contact}</p>}
                              {s.parent_email && <p className="text-xs text-gray-400 mt-0.5">{s.parent_email}</p>}
                              <button
                                onClick={() => cycleParentStatus(s.email)}
                                className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${statusButtonClass(s.email)}`}
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
        )}
      </div>
    </main>
  )
}

function SortIndicator({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <span className="ml-1 opacity-25">↕</span>
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
