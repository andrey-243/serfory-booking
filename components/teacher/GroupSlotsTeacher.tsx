'use client'

import { useEffect, useState } from 'react'

type Session = { id: string; session_date: string; start_time: string }

type Batch = {
  id: string
  subject: string
  start_date: string
  start_time: string
  duration_minutes: number
  max_students: number
  status: 'prelock' | 'active' | 'completed' | 'cancelled'
  enrollment_count: number
  group_slot_sessions: Session[]
}

type Props = {
  teacherId: string
  subjects: string[]
  lang: 'en' | 'ru' | 'et'
}

const LABELS = {
  en: {
    title: 'Group sessions',
    newBatch: 'New batch',
    subject: 'Subject',
    startDate: 'Start date',
    startTime: 'Time',
    create: 'Create',
    creating: 'Creating…',
    prelock: 'Pre-locked',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    spots: (n: number, max: number) => `${n}/${max} enrolled`,
    sessions: '4 sessions:',
    empty: 'No group batches yet.',
    maxReached: 'Max 3 future batches for this subject.',
    errorGeneric: 'Failed to create batch.',
  },
  ru: {
    title: 'Групповые занятия',
    newBatch: 'Новый батч',
    subject: 'Предмет',
    startDate: 'Дата начала',
    startTime: 'Время',
    create: 'Создать',
    creating: 'Создание…',
    prelock: 'Предзаблокирован',
    active: 'Активен',
    completed: 'Завершён',
    cancelled: 'Отменён',
    spots: (n: number, max: number) => `${n}/${max} записано`,
    sessions: '4 занятия:',
    empty: 'Групповых батчей нет.',
    maxReached: 'Максимум 3 будущих батча для этого предмета.',
    errorGeneric: 'Не удалось создать батч.',
  },
  et: {
    title: 'Grupitunnid',
    newBatch: 'Uus grupp',
    subject: 'Aine',
    startDate: 'Alguskuupäev',
    startTime: 'Kellaaeg',
    create: 'Loo',
    creating: 'Loomine…',
    prelock: 'Eelblokeeritud',
    active: 'Aktiivne',
    completed: 'Lõpetatud',
    cancelled: 'Tühistatud',
    spots: (n: number, max: number) => `${n}/${max} registreeritud`,
    sessions: '4 tundi:',
    empty: 'Grupitunde pole veel.',
    maxReached: 'Maksimaalselt 3 tulevast gruppi selle aine jaoks.',
    errorGeneric: 'Grupi loomine ebaõnnestus.',
  },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  prelock: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
}

export default function GroupSlotsTeacher({ teacherId, subjects, lang }: Props) {
  const t = LABELS[lang]
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    subject: subjects[0] || '',
    start_date: today,
    start_time: '17:00',
  })

  function loadBatches() {
    setLoading(true)
    fetch(`/api/group-slots?teacherId=${teacherId}`)
      .then(r => r.json())
      .then(d => setBatches(d.batches || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadBatches() }, [teacherId])

  async function handleCreate() {
    setCreating(true)
    setFormError(null)
    try {
      const res = await fetch('/api/group-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, ...form }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(res.status === 422 ? t.maxReached : (data.error || t.errorGeneric))
        return
      }
      setShowForm(false)
      loadBatches()
    } catch {
      setFormError(t.errorGeneric)
    } finally {
      setCreating(false)
    }
  }

  const futureBatches = batches.filter(b => b.status !== 'completed' && b.status !== 'cancelled')
  const pastBatches = batches.filter(b => b.status === 'completed' || b.status === 'cancelled')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{t.title}</h2>
        <button
          onClick={() => { setShowForm(s => !s); setFormError(null) }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t.newBatch}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.subject}</label>
              <select
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.startDate}</label>
              <input
                type="date"
                min={today}
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.startTime}</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !form.subject || !form.start_date || !form.start_time}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {creating ? t.creating : t.create}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-gray-200/70 animate-pulse" />)}
        </div>
      ) : futureBatches.length === 0 && pastBatches.length === 0 ? (
        <p className="text-sm text-gray-400">{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {[...futureBatches, ...pastBatches].map(batch => (
            <div key={batch.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === batch.id ? null : batch.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[batch.status]}`}>
                    {t[batch.status as keyof typeof t] as string}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{batch.subject}</span>
                  <span className="text-xs text-gray-500">{formatDate(batch.start_date)} · {batch.start_time.slice(0, 5)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{t.spots(batch.enrollment_count, batch.max_students)}</span>
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
                  <p className="text-xs font-medium text-gray-500 mb-2">{t.sessions}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {batch.group_slot_sessions
                      .sort((a, b) => a.session_date.localeCompare(b.session_date))
                      .map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-medium text-[10px] flex-shrink-0">
                            {i + 1}
                          </span>
                          {formatDate(s.session_date)}, {s.start_time.slice(0, 5)}
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
