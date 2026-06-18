'use client'

import { useEffect, useRef, useState } from 'react'

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

const LANG_LABELS: Record<string, string> = { en: 'EN', ru: 'RU', et: 'ET', ky: 'KY' }
const LANG_COLORS: Record<string, string> = {
  en: 'bg-blue-100 text-blue-700',
  ru: 'bg-orange-100 text-orange-700',
  et: 'bg-green-100 text-green-700',
  ky: 'bg-purple-100 text-purple-700',
}

type Session = { id: string; session_date: string; start_time: string; session_start_utc: string | null }

type Batch = {
  id: string
  subject: string
  teaching_language: string | null
  target_levels: string[]
  start_date: string
  start_time: string
  duration_minutes: number
  max_students: number
  status: 'active' | 'completed' | 'cancelled'
  enrollment_count: number
  group_slot_sessions: Session[]
}

type Props = {
  teacherId: string
  subjects: string[]
  subjectFormats: Record<string, string[]>
  subjectLevels: Record<string, string[]>
  teachingLanguages: string[]
  lang: 'en' | 'ru' | 'et'
  prefillSubject?: string
  prefillLang?: string
  prefillLevel?: string
  prefillTrigger?: number
  onBatchCreated?: () => void
}

const LABELS = {
  en: {
    title: 'Group sessions',
    newBatch: 'New group',
    subject: 'Subject',
    language: 'Teaching language',
    targetLevels: 'Target levels',
    startDate: 'Start date',
    startTime: 'Time',
    create: 'Create',
    creating: 'Creating…',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    spots: (n: number, max: number) => `${n}/${max}`,
    sessions: '4 sessions:',
    empty: 'No group batches yet.',
    maxReached: 'Max 5 active groups for this subject.',
    duplicateSlot: 'You already have a session scheduled at this date and time.',
    errorGeneric: 'Failed to create batch.',
    errorFields: 'Please fill all required fields.',
    confirmTitle: 'Confirm creation',
    confirmBody: 'Once created, this group cannot be deleted. Enrolled students will hold these slots permanently. Make sure all details are correct and that these time slots will be dedicated to this course.',
    confirmReview: 'Review',
    confirmCreate: 'Confirm & Create',
    conflictTitle: 'Group already created',
    conflictBody: (name: string) => `${name} already opened a group for this subject, language and level. Create yours anyway?`,
    conflictCancel: 'Cancel',
    conflictForce: 'Create anyway',
    scheduleConflict: (label: string) => `Schedule conflict: ${label}. Please adjust the time or resolve the existing session first.`,
  },
  ru: {
    title: 'Групповые занятия',
    newBatch: 'Новая группа',
    subject: 'Предмет',
    language: 'Язык преподавания',
    targetLevels: 'Целевые уровни',
    startDate: 'Дата начала',
    startTime: 'Время',
    create: 'Создать',
    creating: 'Создание…',
    active: 'Активна',
    completed: 'Завершена',
    cancelled: 'Отменена',
    spots: (n: number, max: number) => `${n}/${max}`,
    sessions: '4 занятия:',
    empty: 'Групп пока нет.',
    maxReached: 'Максимум 5 активных групп для этого предмета.',
    duplicateSlot: 'У вас уже запланировано занятие на эту дату и время.',
    errorGeneric: 'Не удалось создать группу.',
    errorFields: 'Заполните все обязательные поля.',
    confirmTitle: 'Подтвердить создание',
    confirmBody: 'После создания группу нельзя удалить. Записанные студенты займут эти слоты навсегда. Убедитесь, что все данные верны.',
    confirmReview: 'Проверить',
    confirmCreate: 'Подтвердить и создать',
    conflictTitle: 'Группа уже создана',
    conflictBody: (name: string) => `${name} уже открыл группу для этого предмета, языка и уровня. Создать свою всё равно?`,
    conflictCancel: 'Отмена',
    conflictForce: 'Создать всё равно',
    scheduleConflict: (label: string) => `Конфликт расписания: ${label}. Измените время или сначала урегулируйте существующее занятие.`,
  },
  et: {
    title: 'Grupitunnid',
    newBatch: 'Uus grupp',
    subject: 'Aine',
    language: 'Õpetamiskeel',
    targetLevels: 'Sihttasemed',
    startDate: 'Alguskuupäev',
    startTime: 'Kellaaeg',
    create: 'Loo',
    creating: 'Loomine…',
    active: 'Aktiivne',
    completed: 'Lõpetatud',
    cancelled: 'Tühistatud',
    spots: (n: number, max: number) => `${n}/${max}`,
    sessions: '4 tundi:',
    empty: 'Gruppe pole veel.',
    maxReached: 'Maksimaalselt 5 aktiivset gruppi selle aine jaoks.',
    duplicateSlot: 'Teil on sellel kuupäeval ja kellaajal juba tund planeeritud.',
    errorGeneric: 'Grupi loomine ebaõnnestus.',
    errorFields: 'Täitke kõik kohustuslikud väljad.',
    confirmTitle: 'Kinnita loomine',
    confirmBody: 'Pärast loomist ei saa gruppi kustutada. Registreeritud õpilased hoiavad neid aegu jäädavalt.',
    confirmReview: 'Vaata üle',
    confirmCreate: 'Kinnita ja loo',
    conflictTitle: 'Grupp on juba loodud',
    conflictBody: (name: string) => `${name} avas juba selle aine, keele ja taseme jaoks grupi. Loo oma grupp ikkagi?`,
    conflictCancel: 'Tühista',
    conflictForce: 'Loo ikkagi',
    scheduleConflict: (label: string) => `Ajakava konflikt: ${label}. Muutke kellaaega või lahendage olemasolev tund esmalt.`,
  },
}

// Browser timezone (computed once at module level - stable per tab)
function getBrowserTz(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function getTzAbbr(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? tz
}

function formatSessionUtc(utcIso: string): { date: string; time: string; tzAbbr: string } {
  const tz = getBrowserTz()
  const date = new Date(utcIso)
  return {
    date: date.toLocaleDateString('en-GB', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }),
    tzAbbr: getTzAbbr(date, tz),
  }
}

// Fallback for sessions without session_start_utc (legacy)
function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export default function GroupSlotsTeacher({ teacherId, subjects, subjectFormats, subjectLevels: _subjectLevels, teachingLanguages, lang, prefillSubject, prefillLang, prefillLevel, prefillTrigger = 0, onBatchCreated }: Props) {
  const t = LABELS[lang]
  const gl = GRADE_LABELS[lang]

  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<('active' | 'completed')[]>(['active'])
  const [isDemandDriven, setIsDemandDriven] = useState(false)
  const [conflictData, setConflictData] = useState<{ fulfilledBy: string } | null>(null)
  const prevTriggerRef = useRef(0)

  const today = new Date().toISOString().slice(0, 10)

  const [formSubject, setFormSubject] = useState(() => subjects.find(s => subjectFormats[s]?.includes('group')) ?? subjects[0] ?? '')
  const [formLang, setFormLang] = useState(teachingLanguages[0] ?? '')
  const [formLevels, setFormLevels] = useState<string[]>([])
  const [levelMode, setLevelMode] = useState<'grade' | 'cefr'>('grade')
  const [formDate, setFormDate] = useState(today)
  const [formTime, setFormTime] = useState('17:00')

  const isLang = LANG_SUBJECTS.includes(formSubject)
  const availableLevels = isLang ? (levelMode === 'cefr' ? CEFR_LEVELS : ALL_GRADES) : ALL_GRADES

  function toggleLevel(level: string) {
    setFormLevels(prev => prev.includes(level) ? [] : [level])
  }

  function resetForm() {
    const firstGroupSubject = subjects.find(s => subjectFormats[s]?.includes('group')) ?? subjects[0] ?? ''
    setFormSubject(firstGroupSubject)
    setFormLang(teachingLanguages[0] ?? '')
    setFormLevels([])
    setLevelMode('grade')
    setFormDate(today)
    setFormTime('17:00')
    setFormError(null)
  }

  function loadBatches() {
    setLoading(true)
    fetch(`/api/group-slots?teacherId=${teacherId}`)
      .then(r => r.json())
      .then(d => setBatches(d.batches || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadBatches() }, [teacherId])

  // When parent triggers a prefill (from DemandSection "+ Create batch"), open form with preset values
  useEffect(() => {
    if (prefillTrigger > 0 && prefillTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = prefillTrigger
      if (prefillSubject) setFormSubject(prefillSubject)
      if (prefillLang) setFormLang(prefillLang)
      if (prefillLevel) {
        setFormLevels([prefillLevel])
        const isCefr = ['A1', 'A2', 'B1', 'B2'].includes(prefillLevel)
        setLevelMode(isCefr ? 'cefr' : 'grade')
      }
      setFormDate(today)
      setFormTime('17:00')
      setFormError(null)
      setIsDemandDriven(true)
      setShowForm(true)
    }
  }, [prefillTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleOpenForm() {
    resetForm()
    setIsDemandDriven(false)
    setConflictData(null)
    setShowForm(s => !s)
  }

  function handleSubmitClick() {
    if (!formLang || formLevels.length === 0 || !formDate || !formTime || !formSubject) {
      setFormError(t.errorFields)
      return
    }
    setFormError(null)
    setShowConfirm(true)
  }

  async function handleCreate(force = false) {
    setShowConfirm(false)
    setConflictData(null)
    setCreating(true)
    try {
      const res = await fetch('/api/group-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          subject: formSubject,
          teaching_language: formLang,
          target_levels: formLevels,
          start_date: formDate,
          start_time: formTime,
          timezone: getBrowserTz(),
          isDemandDriven,
          force,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data.conflict) {
          setConflictData({ fulfilledBy: data.fulfilled_by ?? 'Another teacher' })
          return
        }
        if (res.status === 422) {
          const msg = (data.error as string) ?? ''
          if (Array.isArray(data.conflicts) && data.conflicts.length > 0) {
            const first = data.conflicts[0] as { label: string; startUtc: string }
            const time = new Date(first.startUtc).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
            setFormError(t.scheduleConflict(`${first.label} (${time})`))
          } else if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('date and time')) {
            setFormError(t.duplicateSlot)
          } else if (msg.toLowerCase().includes('max')) {
            setFormError(t.maxReached)
          } else {
            setFormError(msg || t.errorGeneric)
          }
        } else {
          setFormError(data.error || t.errorGeneric)
        }
        return
      }
      setShowForm(false)
      setIsDemandDriven(false)
      resetForm()
      loadBatches()
      onBatchCreated?.()
    } catch {
      setFormError(t.errorGeneric)
    } finally {
      setCreating(false)
    }
  }

  // Group by subject x lang x level (filtered by status)
  const filteredBatches = batches.filter(b => statusFilter.includes(b.status as 'active' | 'completed'))
  const groupMap = new Map<string, { subject: string; lang: string; levels: string[]; batches: Batch[] }>()
  for (const batch of filteredBatches) {
    const key = `${batch.subject}||${batch.teaching_language ?? ''}||${[...(batch.target_levels || [])].sort().join(',')}`
    if (!groupMap.has(key)) {
      groupMap.set(key, { subject: batch.subject, lang: batch.teaching_language ?? '', levels: batch.target_levels || [], batches: [] })
    }
    groupMap.get(key)!.batches.push(batch)
  }
  const groups = [...groupMap.values()]

  const groupEnabledForSubject = (s: string) => subjectFormats[s]?.includes('group') ?? false
  const anyGroupEnabled = subjects.some(s => groupEnabledForSubject(s))

  return (
    <div className="flex flex-col gap-4">
      {conflictData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-gray-900">{t.conflictTitle}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{t.conflictBody(conflictData.fulfilledBy)}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setConflictData(null); setShowForm(false); resetForm() }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors">
                {t.conflictCancel}
              </button>
              <button onClick={() => { handleCreate(true) }} className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                {t.conflictForce}
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirm && (() => {
        const browserTz = getBrowserTz()
        const tzAbbr = getTzAbbr(new Date(), browserTz)
        const sessionDates = [0, 7, 14, 21].map(offset => {
          const d = new Date(formDate + 'T12:00:00Z')
          d.setUTCDate(d.getUTCDate() + offset)
          return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
        })
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-gray-900">{t.confirmTitle}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t.confirmBody}</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-1.5">
                {sessionDates.map((date, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-[11px] flex-shrink-0">{i + 1}</span>
                    <span className="text-gray-700">{date}</span>
                    <span className="text-gray-500">{formTime}</span>
                    <span className="text-xs text-gray-400">{tzAbbr}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors">
                  {t.confirmReview}
                </button>
                <button onClick={() => { handleCreate() }} className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  {t.confirmCreate}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{t.title}</h2>
        {anyGroupEnabled && (
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t.newBatch}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.subject}</label>
              <select
                value={formSubject}
                onChange={e => { setFormSubject(e.target.value); setFormLevels([]); setLevelMode('grade') }}
                className="px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.filter(s => groupEnabledForSubject(s)).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.language} <span className="text-red-400">*</span></label>
              <select
                value={formLang}
                onChange={e => setFormLang(e.target.value)}
                className="px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-</option>
                {teachingLanguages.map(l => <option key={l} value={l}>{LANG_LABELS[l] ?? l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.startDate} <span className="text-red-400">*</span></label>
              <input
                type="date"
                min={today}
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.startTime} <span className="text-red-400">*</span></label>
              <input
                type="time"
                value={formTime}
                onChange={e => setFormTime(e.target.value)}
                className="px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-500">{t.targetLevels} <span className="text-red-400">*</span></label>
              {isLang && (
                <div className="flex rounded-lg overflow-hidden border border-gray-200 text-[11px] font-medium">
                  <button type="button" onClick={() => { setLevelMode('grade'); setFormLevels([]) }}
                    className={`px-2.5 py-1 transition-colors ${levelMode === 'grade' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                    Grades
                  </button>
                  <button type="button" onClick={() => { setLevelMode('cefr'); setFormLevels([]) }}
                    className={`px-2.5 py-1 transition-colors ${levelMode === 'cefr' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                    CEFR
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableLevels.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    formLevels.includes(level)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {gl[level] ?? level}
                </button>
              ))}
            </div>
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSubmitClick}
              disabled={creating}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {creating ? t.creating : t.create}
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm() }}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!loading && batches.some(b => b.status === 'completed') && (
        <div className="flex gap-1.5">
          {(['active', 'completed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                statusFilter.includes(s)
                  ? s === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s === 'active' ? t.active : t.completed}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-gray-200/70 animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <p className="text-sm text-gray-400">{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(group => (
            <div key={`${group.subject}||${group.lang}||${[...group.levels].sort().join(',')}`} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-0.5">
                <span className="text-sm font-semibold text-gray-900">{group.subject}</span>
                {group.lang && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${LANG_COLORS[group.lang] ?? 'bg-gray-100 text-gray-500'}`}>
                    {LANG_LABELS[group.lang] ?? group.lang}
                  </span>
                )}
                {group.levels.length > 0 && (
                  <span className="text-xs font-medium text-gray-500">
                    {group.levels.map(l => gl[l] ?? l).join(', ')}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {group.batches.map(batch => (
                  <div key={batch.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpanded(expanded === batch.id ? null : batch.id)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {batch.status === 'active' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 flex-shrink-0">
                            {t.active}
                          </span>
                        )}
                        {batch.status === 'completed' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 flex-shrink-0">
                            {t.completed}
                          </span>
                        )}
                        {batch.status === 'cancelled' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600 flex-shrink-0">
                            {t.cancelled}
                          </span>
                        )}
                        {(() => {
                          const firstUtc = batch.group_slot_sessions[0]?.session_start_utc
                          if (firstUtc) {
                            const { date, time, tzAbbr } = formatSessionUtc(firstUtc)
                            return (
                              <span className="text-sm text-gray-700">
                                {date} · {time} <span className="text-[11px] text-gray-400">{tzAbbr}</span>
                              </span>
                            )
                          }
                          return (
                            <span className="text-sm text-gray-700">
                              {formatDate(batch.start_date)} · {batch.start_time.slice(0, 5)}
                            </span>
                          )
                        })()}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
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
                                {s.session_start_utc ? (() => {
                                  const { date, time, tzAbbr } = formatSessionUtc(s.session_start_utc)
                                  return <>{date}, {time} <span className="text-gray-400">{tzAbbr}</span></>
                                })() : <>{formatDate(s.session_date)}, {s.start_time.slice(0, 5)}</>}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
