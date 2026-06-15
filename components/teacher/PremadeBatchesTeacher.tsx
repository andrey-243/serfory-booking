'use client'

import { useEffect, useState } from 'react'

const LANG_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Kyrgyz']

const ALL_GRADES = ['kindergarten', '1', '2', '3-4', '5-6', '7-8', '9', '10-12']
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2']

const GRADE_LABELS: Record<string, Record<string, string>> = {
  en: {
    kindergarten: 'Kindergarten', '1': 'Grade 1', '2': 'Grade 2',
    '3-4': 'Grade 3-4', '5-6': 'Grade 5-6', '7-8': 'Grade 7-8',
    '9': 'Grade 9', '10-12': 'Grade 10-12',
    A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2',
  },
  ru: {
    kindergarten: 'Детский сад', '1': '1 класс', '2': '2 класс',
    '3-4': '3-4 класс', '5-6': '5-6 класс', '7-8': '7-8 класс',
    '9': '9 класс', '10-12': '10-12 класс',
    A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2',
  },
  et: {
    kindergarten: 'Lasteaed', '1': '1. klass', '2': '2. klass',
    '3-4': '3.-4. klass', '5-6': '5.-6. klass', '7-8': '7.-8. klass',
    '9': '9. klass', '10-12': '10.-12. klass',
    A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2',
  },
}

const LABELS = {
  en: {
    title: 'Premade courses',
    newBatch: 'New course',
    batchName: 'Course name',
    subject: 'Subject',
    duration: 'Duration (min)',
    targetLevels: 'Target levels',
    nbSessions: 'Number of sessions',
    sessions: 'Sessions',
    sessionName: 'Session name',
    date: 'Date',
    time: 'Time',
    create: 'Create',
    creating: 'Creating…',
    cancel: 'Cancel',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    spots: (n: number, max: number) => `${n}/${max} enrolled`,
    empty: 'No premade courses yet.',
    errorGeneric: 'Failed to create course.',
    errorFields: 'Please fill all fields.',
    levels: 'levels',
    addSession: 'Add session',
    removeSession: 'Remove',
    errorDateRange: 'All sessions must be in the same calendar month as the first session.',
  },
  ru: {
    title: 'Готовые курсы',
    newBatch: 'Новый курс',
    batchName: 'Название курса',
    subject: 'Предмет',
    duration: 'Длительность (мин)',
    targetLevels: 'Целевые уровни',
    nbSessions: 'Количество занятий',
    sessions: 'Занятия',
    sessionName: 'Название занятия',
    date: 'Дата',
    time: 'Время',
    create: 'Создать',
    creating: 'Создание…',
    cancel: 'Отмена',
    active: 'Активен',
    completed: 'Завершён',
    cancelled: 'Отменён',
    spots: (n: number, max: number) => `${n}/${max} записано`,
    empty: 'Готовых курсов нет.',
    errorGeneric: 'Не удалось создать курс.',
    errorFields: 'Заполните все поля.',
    levels: 'уровни',
    addSession: 'Добавить занятие',
    removeSession: 'Удалить',
    errorDateRange: 'Все занятия должны быть в том же календарном месяце, что и первое.',
  },
  et: {
    title: 'Valmiskursused',
    newBatch: 'Uus kursus',
    batchName: 'Kursuse nimi',
    subject: 'Aine',
    duration: 'Kestus (min)',
    targetLevels: 'Sihttasemed',
    nbSessions: 'Tundide arv',
    sessions: 'Tunnid',
    sessionName: 'Tunni nimi',
    date: 'Kuupäev',
    time: 'Kellaaeg',
    create: 'Loo',
    creating: 'Loomine…',
    cancel: 'Tühista',
    active: 'Aktiivne',
    completed: 'Lõpetatud',
    cancelled: 'Tühistatud',
    spots: (n: number, max: number) => `${n}/${max} registreeritud`,
    empty: 'Valmiskursusi pole veel.',
    errorGeneric: 'Kursuse loomine ebaõnnestus.',
    errorFields: 'Täitke kõik väljad.',
    levels: 'tasemed',
    addSession: 'Lisa tund',
    removeSession: 'Eemalda',
    errorDateRange: 'Kõik tunnid peavad olema esimese tunniga samas kalendrikuus.',
  },
}

type PremadeSession = {
  id: string
  name: string
  session_date: string
  start_time: string
  gcal_event_id: string | null
}

type PremadeBatch = {
  id: string
  name: string
  subject: string
  target_levels: string[]
  duration_min: number
  max_students: number
  status: 'active' | 'completed' | 'cancelled'
  enrollment_count: number
  premade_sessions: PremadeSession[]
}

type SessionDraft = { name: string; session_date: string; start_time: string }

type Props = {
  teacherId: string
  subjects: string[]
  lang: 'en' | 'ru' | 'et'
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function lastDayOfMonth(firstDate: string): string {
  const d = new Date(firstDate + 'T12:00:00Z')
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
}

function emptySession(): SessionDraft {
  return { name: '', session_date: new Date().toISOString().slice(0, 10), start_time: '14:00' }
}

export default function PremadeBatchesTeacher({ teacherId, subjects, lang }: Props) {
  const t = LABELS[lang]
  const gl = GRADE_LABELS[lang]

  const [batches, setBatches] = useState<PremadeBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [subject, setSubject] = useState(subjects[0] || '')
  const [durationMin, setDurationMin] = useState(60)
  const [targetLevels, setTargetLevels] = useState<string[]>([])
  const [sessions, setSessions] = useState<SessionDraft[]>([emptySession(), emptySession(), emptySession(), emptySession(), emptySession(), emptySession()])

  const isLang = LANG_SUBJECTS.includes(subject)
  const availableLevels = isLang ? [...ALL_GRADES, ...CEFR_LEVELS] : ALL_GRADES

  function toggleLevel(level: string) {
    setTargetLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    )
  }

  function updateSession(i: number, field: keyof SessionDraft, value: string) {
    setSessions(prev => prev.map((s, j) => j === i ? { ...s, [field]: value } : s))
  }

  function addSession() {
    setSessions(prev => [...prev, emptySession()])
  }

  function removeSession(i: number) {
    if (sessions.length <= 1) return
    setSessions(prev => prev.filter((_, j) => j !== i))
  }

  function resetForm() {
    setName('')
    setSubject(subjects[0] || '')
    setDurationMin(60)
    setTargetLevels([])
    setSessions([emptySession(), emptySession(), emptySession(), emptySession(), emptySession(), emptySession()])
    setFormError(null)
  }

  useEffect(() => {
    setLoading(true)
    fetch(`/api/premade-batches?teacherId=${teacherId}`)
      .then(r => r.json())
      .then(d => setBatches(d.batches || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [teacherId, refreshKey])

  async function handleCreate() {
    if (!name.trim()) { setFormError(t.errorFields); return }
    for (const s of sessions) {
      if (!s.name.trim() || !s.session_date || !s.start_time) { setFormError(t.errorFields); return }
    }
    if (sessions.length > 1) {
      const first = new Date(sessions[0].session_date + 'T12:00:00Z')
      const refYear = first.getUTCFullYear()
      const refMonth = first.getUTCMonth()
      for (const s of sessions.slice(1)) {
        const d = new Date(s.session_date + 'T12:00:00Z')
        if (d.getUTCFullYear() !== refYear || d.getUTCMonth() !== refMonth) {
          setFormError(t.errorDateRange); return
        }
      }
    }

    setCreating(true)
    setFormError(null)
    try {
      const res = await fetch('/api/premade-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, name: name.trim(), subject, target_levels: targetLevels, duration_min: durationMin, sessions }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || t.errorGeneric)
        return
      }
      setShowForm(false)
      resetForm()
      setRefreshKey(k => k + 1)
    } catch {
      setFormError(t.errorGeneric)
    } finally {
      setCreating(false)
    }
  }

  const activeBatches = batches.filter(b => b.status === 'active')
  const pastBatches = batches.filter(b => b.status !== 'active')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{t.title}</h2>
        <button
          onClick={() => { setShowForm(s => !s); if (showForm) resetForm() }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t.newBatch}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4">
          {/* Row 1: name + subject + duration */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1 col-span-1">
              <label className="text-xs font-medium text-gray-500">{t.batchName}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Chemistry Basics"
                className="px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.subject}</label>
              <select
                value={subject}
                onChange={e => {
                  const s = e.target.value
                  setSubject(s)
                  if (!LANG_SUBJECTS.includes(s)) {
                    setTargetLevels(prev => prev.filter(l => !CEFR_LEVELS.includes(l)))
                  }
                }}
                className="px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.duration}</label>
              <input
                type="number"
                min={30}
                max={180}
                step={15}
                value={durationMin}
                onChange={e => setDurationMin(Number(e.target.value))}
                className="px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Target levels */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">{t.targetLevels}</label>
            <div className="flex flex-wrap gap-1.5">
              {availableLevels.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={`px-2.5 py-1 text-xs rounded-full border font-medium transition-colors ${
                    targetLevels.includes(level)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {gl[level] ?? level}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">{t.sessions} ({sessions.length})</label>
            <div className="flex flex-col gap-2">
              {sessions.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_140px_100px_auto] gap-2 items-center">
                  <input
                    type="text"
                    value={s.name}
                    onChange={e => updateSession(i, 'name', e.target.value)}
                    placeholder={`Session ${i + 1}`}
                    className="px-3 py-1.5 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={s.session_date}
                    min={sessions[0]?.session_date || undefined}
                    max={sessions[0]?.session_date ? lastDayOfMonth(sessions[0].session_date) : undefined}
                    onChange={e => updateSession(i, 'session_date', e.target.value)}
                    className="px-3 py-1.5 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={s.start_time}
                    onChange={e => updateSession(i, 'start_time', e.target.value)}
                    className="px-3 py-1.5 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSession(i)}
                    disabled={sessions.length <= 1}
                    className="text-xs text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors whitespace-nowrap"
                  >
                    {t.removeSession}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSession}
              className="self-start flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t.addSession}
            </button>
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {creating ? t.creating : t.create}
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm() }}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-gray-200/70 animate-pulse" />)}
        </div>
      ) : activeBatches.length === 0 && pastBatches.length === 0 ? (
        <p className="text-sm text-gray-400">{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {[...activeBatches, ...pastBatches].map(batch => (
            <div key={batch.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === batch.id ? null : batch.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[batch.status]}`}>
                    {t[batch.status as 'active' | 'completed' | 'cancelled']}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">{batch.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{batch.subject}</span>
                  {batch.target_levels.length > 0 && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {batch.target_levels.map(l => gl[l] ?? l).join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400">{t.spots(batch.enrollment_count, batch.max_students)}</span>
                  <span className="text-xs text-gray-400">{batch.premade_sessions.length} {t.sessions.toLowerCase()}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expanded === batch.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expanded === batch.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {batch.premade_sessions.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-medium text-[10px] flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-800 truncate flex-1">{s.name}</span>
                        <span className="flex-shrink-0">{formatDate(s.session_date)}</span>
                        <span className="flex-shrink-0">{s.start_time.slice(0, 5)}</span>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.gcal_event_id ? 'bg-green-400' : 'bg-gray-300'}`} title={s.gcal_event_id ? 'GCal synced' : 'GCal pending'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
