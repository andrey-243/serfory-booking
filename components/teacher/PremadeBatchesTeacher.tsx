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

const LABELS = {
  en: {
    title: 'Premade courses',
    newBatch: 'New course',
    batchName: 'Course name',
    subject: 'Subject',
    duration: 'Duration (min)',
    language: 'Language',
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
    editNames: 'Edit names',
    saveNames: 'Save',
    savingNames: 'Saving…',
    useTemplate: 'Use as template',
    confirmTitle: 'Confirm creation',
    confirmBody: 'Once created, this course cannot be deleted. Enrolled students will hold these sessions permanently. Make sure all details are correct and that these time slots will be dedicated to this course.',
    confirmReview: 'Review',
    confirmCreate: 'Confirm & Create',
    maxReached: 'You already have 2 active courses for this subject. A slot will free up automatically once all sessions of a course have passed.',
    duplicateCourse: 'You already have an active course with this name for this language and level. Change the language or level to create a variant.',
    saveAsTemplate: 'Save as template',
    savedTemplate: 'Saved!',
    templates: 'Templates',
    deleteTemplate: 'Delete',
    applyTemplate: 'Use',
  },
  ru: {
    title: 'Готовые курсы',
    newBatch: 'Новый курс',
    batchName: 'Название курса',
    subject: 'Предмет',
    duration: 'Длительность (мин)',
    language: 'Язык',
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
    editNames: 'Редактировать',
    saveNames: 'Сохранить',
    savingNames: 'Сохранение…',
    useTemplate: 'Использовать как шаблон',
    confirmTitle: 'Подтвердить создание',
    confirmBody: 'После создания курс нельзя удалить. Записанные студенты займут эти занятия навсегда. Убедитесь, что все данные верны и эти временные слоты будут посвящены этому курсу.',
    confirmReview: 'Проверить',
    confirmCreate: 'Подтвердить и создать',
    maxReached: 'У вас уже 2 активных курса по этому предмету. Слот освободится автоматически, когда все занятия курса пройдут.',
    duplicateCourse: 'Активный курс с таким названием для этого языка и уровня уже существует. Измените язык или уровень для создания варианта.',
    saveAsTemplate: 'Сохранить как шаблон',
    savedTemplate: 'Сохранено!',
    templates: 'Шаблоны',
    deleteTemplate: 'Удалить',
    applyTemplate: 'Применить',
  },
  et: {
    title: 'Valmiskursused',
    newBatch: 'Uus kursus',
    batchName: 'Kursuse nimi',
    subject: 'Aine',
    duration: 'Kestus (min)',
    language: 'Keel',
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
    editNames: 'Muuda nimesid',
    saveNames: 'Salvesta',
    savingNames: 'Salvestamine…',
    useTemplate: 'Kasuta mallina',
    confirmTitle: 'Kinnita loomine',
    confirmBody: 'Pärast loomist ei saa kursust kustutada. Registreeritud õpilased hoiavad neid tunde jäädavalt. Veenduge, et kõik andmed on õiged ja need ajad on pühendatud sellele kursusele.',
    confirmReview: 'Vaata üle',
    confirmCreate: 'Kinnita ja loo',
    maxReached: 'Teil on juba 2 aktiivset kursust selle aine jaoks. Koht vabaneb automaatselt, kui kõik kursuse tunnid on möödas.',
    duplicateCourse: 'Selle keele ja tasemega sama nimega aktiivne kursus on juba olemas. Variandi loomiseks muutke keelt või taset.',
    saveAsTemplate: 'Salvesta mallina',
    savedTemplate: 'Salvestatud!',
    templates: 'Mallid',
    deleteTemplate: 'Kustuta',
    applyTemplate: 'Kasuta',
  },
}

type PremadeTemplate = {
  id: string
  name: string
  subject: string
  teaching_language: string | null
  target_levels: string[]
  duration_min: number
  session_names: string[]
  session_default_time: string
}

type PremadeSession = {
  id: string
  name: string
  session_date: string
  start_time: string
  session_start_utc: string | null
  gcal_event_id: string | null
}

type PremadeBatch = {
  id: string
  name: string
  subject: string
  teaching_language: string | null
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
  teachingLanguages?: string[]
  subjectFormats?: Record<string, string[]>
}

const LANG_LABELS: Record<string, string> = { en: 'EN', ru: 'RU', et: 'ET', ky: 'KY' }
const LANG_COLORS: Record<string, string> = {
  en: 'bg-blue-100 text-blue-700',
  ru: 'bg-orange-100 text-orange-700',
  et: 'bg-green-100 text-green-700',
  ky: 'bg-purple-100 text-purple-700',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
}

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

function lastDayOfMonth(firstDate: string): string {
  const d = new Date(firstDate + 'T12:00:00Z')
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
}

function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function emptySession(dayOffset = 0): SessionDraft {
  return { name: '', session_date: dateOffset(dayOffset), start_time: '14:00' }
}

export default function PremadeBatchesTeacher({ teacherId, subjects, lang, teachingLanguages = [], subjectFormats = {} }: Props) {
  const t = LABELS[lang]
  const gl = GRADE_LABELS[lang]

  const [batches, setBatches] = useState<PremadeBatch[]>([])
  const [templates, setTemplates] = useState<PremadeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<('active' | 'completed')[]>(['active'])
  const formRef = useRef<HTMLDivElement>(null)
  // Session name editing: batchId → { names: Record<sessionId, string>, saving, editMode }
  const [sessionEdits, setSessionEdits] = useState<Record<string, { names: Record<string, string>; saving: boolean; editMode: boolean }>>({})

  const [name, setName] = useState('')
  const [subject, setSubject] = useState(() => subjects.find(s => subjectFormats[s]?.includes('premade')) ?? subjects[0] ?? '')
  const [durationMin, setDurationMin] = useState(60)
  const [targetLevels, setTargetLevels] = useState<string[]>([])
  const [levelMode, setLevelMode] = useState<'grade' | 'cefr'>('grade')
  const [teachingLanguage, setTeachingLanguage] = useState<string>(teachingLanguages[0] ?? '')
  const [sessions, setSessions] = useState<SessionDraft[]>([emptySession(0), emptySession(1)])

  const isLang = LANG_SUBJECTS.includes(subject)
  const availableLevels = isLang ? (levelMode === 'cefr' ? CEFR_LEVELS : ALL_GRADES) : ALL_GRADES

  function toggleLevel(level: string) {
    setTargetLevels(prev => prev.includes(level) ? [] : [level])
  }

  function updateSession(i: number, field: keyof SessionDraft, value: string) {
    setSessions(prev => prev.map((s, j) => j === i ? { ...s, [field]: value } : s))
  }

  function addSession() {
    setSessions(prev => [...prev, emptySession(prev.length)])
  }

  function removeSession(i: number) {
    if (sessions.length <= 1) return
    setSessions(prev => prev.filter((_, j) => j !== i))
  }

  function resetForm() {
    const firstPremadeSubject = subjects.find(s => subjectFormats[s]?.includes('premade')) ?? subjects[0] ?? ''
    setName('')
    setSubject(firstPremadeSubject)
    setDurationMin(60)
    setTargetLevels([])
    setLevelMode('grade')
    setTeachingLanguage(teachingLanguages[0] ?? '')
    setSessions([emptySession(0), emptySession(1)])
    setFormError(null)
  }

  function applyTemplate(batch: PremadeBatch) {
    setName(batch.name)
    setSubject(batch.subject)
    setDurationMin(batch.duration_min)
    setTargetLevels(batch.target_levels)
    setTeachingLanguage(batch.teaching_language ?? teachingLanguages[0] ?? '')
    setSessions(
      batch.premade_sessions
        .slice()
        .sort((a, b) => a.session_date.localeCompare(b.session_date))
        .map((s, i) => ({ name: s.name, session_date: dateOffset(i), start_time: s.start_time }))
    )
    setShowForm(true)
    setFormError(null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function initSessionEdit(batch: PremadeBatch) {
    if (sessionEdits[batch.id]) return
    const names: Record<string, string> = {}
    for (const s of batch.premade_sessions) names[s.id] = s.name
    setSessionEdits(prev => ({ ...prev, [batch.id]: { names, saving: false, editMode: false } }))
  }

  async function saveSessionNames(batchId: string) {
    const edit = sessionEdits[batchId]
    if (!edit) return
    setSessionEdits(prev => ({ ...prev, [batchId]: { ...prev[batchId], saving: true } }))
    const session_updates = Object.entries(edit.names).map(([id, name]) => ({ id, name }))
    await fetch(`/api/premade-batches/${batchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_updates }),
    })
    setSessionEdits(prev => ({ ...prev, [batchId]: { ...prev[batchId], saving: false, editMode: false } }))
    setRefreshKey(k => k + 1)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/premade-batches?teacherId=${teacherId}`).then(r => r.json()),
      fetch(`/api/premade-templates?teacherId=${teacherId}`).then(r => r.json()),
    ])
      .then(([batchData, tplData]) => {
        setBatches(batchData.batches || [])
        setTemplates(tplData.templates || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [teacherId, refreshKey])

  async function saveAsTemplate(batch: PremadeBatch) {
    setSavingTemplate(batch.id)
    const session_names = batch.premade_sessions
      .slice()
      .sort((a, b) => a.session_date.localeCompare(b.session_date))
      .map(s => s.name)
    const session_default_time = batch.premade_sessions[0]?.start_time ?? '14:00'
    const res = await fetch('/api/premade-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: batch.name,
        subject: batch.subject,
        teaching_language: batch.teaching_language,
        target_levels: batch.target_levels,
        duration_min: batch.duration_min,
        session_names,
        session_default_time,
      }),
    })
    if (res.ok) {
      const { template } = await res.json()
      setTemplates(prev => [template, ...prev])
    }
    setSavingTemplate(null)
  }

  async function deleteTemplate(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/premade-templates?id=${id}`, { method: 'DELETE' })
  }

  function applyDbTemplate(tpl: PremadeTemplate) {
    setName(tpl.name)
    setSubject(tpl.subject)
    setDurationMin(tpl.duration_min)
    setTargetLevels(tpl.target_levels)
    setLevelMode(tpl.target_levels.some(l => CEFR_LEVELS.includes(l)) ? 'cefr' : 'grade')
    setTeachingLanguage(tpl.teaching_language ?? teachingLanguages[0] ?? '')
    setSessions(tpl.session_names.map((n, i) => ({ name: n, session_date: dateOffset(i), start_time: tpl.session_default_time.slice(0, 5) })))
    setShowForm(true)
    setFormError(null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function handleSubmitClick() {
    if (!name.trim() || !teachingLanguage || targetLevels.length === 0) {
      setFormError(t.errorFields); return
    }
    for (const s of sessions) {
      if (!s.name.trim() || !s.session_date || !s.start_time) { setFormError(t.errorFields); return }
    }
    if (sessions.length > 1 && sessions[0].session_date) {
      const first = new Date(sessions[0].session_date + 'T12:00:00Z')
      const refYear = first.getUTCFullYear()
      const refMonth = first.getUTCMonth()
      for (const s of sessions.slice(1)) {
        if (!s.session_date) continue
        const d = new Date(s.session_date + 'T12:00:00Z')
        if (d.getUTCFullYear() !== refYear || d.getUTCMonth() !== refMonth) {
          setFormError(t.errorDateRange); return
        }
      }
    }
    setFormError(null)
    setShowConfirm(true)
  }

  async function handleCreate() {
    setShowConfirm(false)
    setCreating(true)
    try {
      const res = await fetch('/api/premade-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, name: name.trim(), subject, teaching_language: teachingLanguage, target_levels: targetLevels, duration_min: durationMin, sessions, timezone: getBrowserTz() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 422) {
          const isDuplicate = (data.error as string)?.toLowerCase().includes('same name')
          setFormError(isDuplicate ? t.duplicateCourse : t.maxReached)
        } else {
          setFormError(data.error || t.errorGeneric)
        }
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

  const hasCompleted = batches.some(b => b.status === 'completed')
  const filteredForDisplay = batches.filter(b => statusFilter.includes(b.status as 'active' | 'completed'))
  const activeBatches = filteredForDisplay.filter(b => b.status === 'active')
  const pastBatches = filteredForDisplay.filter(b => b.status !== 'active')

  // Group by subject × lang × level
  const groupMap = new Map<string, { subject: string; lang: string; levels: string[]; batches: PremadeBatch[] }>()
  for (const batch of [...activeBatches, ...pastBatches]) {
    const key = `${batch.subject}||${batch.teaching_language ?? ''}||${[...(batch.target_levels || [])].sort().join(',')}`
    if (!groupMap.has(key)) {
      groupMap.set(key, { subject: batch.subject, lang: batch.teaching_language ?? '', levels: batch.target_levels || [], batches: [] })
    }
    groupMap.get(key)!.batches.push(batch)
  }
  const premadeGroups = [...groupMap.values()]

  return (
    <div className="flex flex-col gap-4">
      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-gray-900">{t.confirmTitle}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{t.confirmBody}</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {(() => {
                const browserTz = getBrowserTz()
                const tzAbbr = getTzAbbr(new Date(), browserTz)
                return sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-[11px] flex-shrink-0">{i + 1}</span>
                    <span className="text-gray-700 font-medium truncate flex-1">{s.name || `Session ${i + 1}`}</span>
                    <span className="text-gray-500 flex-shrink-0">{s.session_date ? new Date(s.session_date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '-'}</span>
                    <span className="text-gray-500 flex-shrink-0">{s.start_time}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{tzAbbr}</span>
                  </div>
                ))
              })()}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors"
              >
                {t.confirmReview}
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t.confirmCreate}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates */}
      {templates.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-400">{t.templates}</span>
          <div className="flex flex-wrap gap-1.5">
            {templates.map(tpl => (
              <div key={tpl.id} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
                {tpl.teaching_language && (
                  <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${LANG_COLORS[tpl.teaching_language] ?? 'bg-gray-100 text-gray-500'}`}>
                    {LANG_LABELS[tpl.teaching_language] ?? tpl.teaching_language.toUpperCase()}
                  </span>
                )}
                <span className="text-gray-700 font-medium">{tpl.name}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400">{tpl.session_names.length} sessions</span>
                <button onClick={() => applyDbTemplate(tpl)} className="ml-1 text-blue-500 hover:text-blue-700 font-medium transition-colors">{t.applyTemplate}</button>
                <button onClick={() => deleteTemplate(tpl.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-0.5">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{t.title}</h2>
        {subjects.some(s => subjectFormats[s]?.includes('premade')) && (
          <button
            onClick={() => { if (showForm) { setShowForm(false); resetForm() } else { resetForm(); setShowForm(true) } }}
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
        <div ref={formRef} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4">
          {/* Row 1: name + subject + duration + language */}
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">{t.batchName}</label>
              <input
                type="text"
                list="premade-course-names"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Chemistry Basics"
                className="px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="premade-course-names">
                {[...new Set(batches.map(b => b.name))].map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.subject}</label>
              <select
                value={subject}
                onChange={e => {
                  setSubject(e.target.value)
                  setTargetLevels([])
                  setLevelMode('grade')
                }}
                className="px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.filter(s => subjectFormats[s]?.includes('premade') ?? true).map(s => <option key={s} value={s}>{s}</option>)}
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.language} <span className="text-red-400">*</span></label>
              <div className="flex gap-1.5 flex-wrap pt-0.5">
                {teachingLanguages.map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setTeachingLanguage(l)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      teachingLanguage === l
                        ? (LANG_COLORS[l] ?? 'bg-blue-500 text-white border-blue-500') + ' border-transparent'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {LANG_LABELS[l] ?? l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Target levels */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-500">{t.targetLevels} <span className="text-red-400">*</span></label>
              {isLang && (
                <div className="flex rounded-lg overflow-hidden border border-gray-200 text-[11px] font-medium">
                  <button type="button" onClick={() => { setLevelMode('grade'); setTargetLevels([]) }}
                    className={`px-2.5 py-1 transition-colors ${levelMode === 'grade' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                    Grades
                  </button>
                  <button type="button" onClick={() => { setLevelMode('cefr'); setTargetLevels([]) }}
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
                    min={i === 0 ? new Date().toISOString().slice(0, 10) : (sessions[0]?.session_date || undefined)}
                    max={i === 0 ? undefined : (sessions[0]?.session_date ? lastDayOfMonth(sessions[0].session_date) : undefined)}
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
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {!loading && hasCompleted && (
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
          {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-gray-200/70 animate-pulse" />)}
        </div>
      ) : premadeGroups.length === 0 ? (
        <p className="text-sm text-gray-400">{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {premadeGroups.map(group => (
            <div key={`${group.subject}||${group.lang}||${group.levels.sort().join(',')}`} className="flex flex-col gap-2">
              {/* Group header: Subject · LANG · Level */}
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
                onClick={() => {
                  const next = expanded === batch.id ? null : batch.id
                  setExpanded(next)
                  if (next) initSessionEdit(batch)
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[batch.status]}`}>
                    {t[batch.status as 'active' | 'completed' | 'cancelled']}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">{batch.name}</span>
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

              {expanded === batch.id && (() => {
                const edit = sessionEdits[batch.id]
                const inEdit = edit?.editMode ?? false
                return (
                  <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      {batch.premade_sessions
                        .slice()
                        .sort((a, b) => a.session_date.localeCompare(b.session_date))
                        .map((s, i) => (
                        <div key={s.id} className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-medium text-[10px] flex-shrink-0">
                            {i + 1}
                          </span>
                          {inEdit ? (
                            <input
                              type="text"
                              value={edit?.names[s.id] ?? s.name}
                              onChange={e => setSessionEdits(prev => ({
                                ...prev,
                                [batch.id]: { ...prev[batch.id], names: { ...prev[batch.id].names, [s.id]: e.target.value } }
                              }))}
                              className="flex-1 px-2 py-0.5 text-xs text-gray-900 border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          ) : (
                            <span className="font-medium text-gray-800 truncate flex-1">{s.name}</span>
                          )}
                          {s.session_start_utc ? (() => {
                            const { date, time, tzAbbr } = formatSessionUtc(s.session_start_utc)
                            return (
                              <>
                                <span className="flex-shrink-0">{date}</span>
                                <span className="flex-shrink-0">{time} <span className="text-gray-400">{tzAbbr}</span></span>
                              </>
                            )
                          })() : (
                            <>
                              <span className="flex-shrink-0">{formatDate(s.session_date)}</span>
                              <span className="flex-shrink-0">{s.start_time.slice(0, 5)}</span>
                            </>
                          )}
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.gcal_event_id ? 'bg-green-400' : 'bg-gray-300'}`} title={s.gcal_event_id ? 'GCal synced' : 'GCal pending'} />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {!inEdit ? (
                        <>
                          <button
                            onClick={() => {
                              initSessionEdit(batch)
                              setSessionEdits(prev => ({ ...prev, [batch.id]: { ...(prev[batch.id] ?? { names: Object.fromEntries(batch.premade_sessions.map(s => [s.id, s.name])), saving: false }), editMode: true } }))
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                          >
                            {t.editNames}
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => applyTemplate(batch)}
                            className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                          >
                            {t.useTemplate}
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => saveAsTemplate(batch)}
                            disabled={savingTemplate === batch.id}
                            className="text-xs text-gray-400 hover:text-emerald-600 font-medium transition-colors disabled:opacity-50"
                          >
                            {savingTemplate === batch.id ? t.savedTemplate : t.saveAsTemplate}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => saveSessionNames(batch.id)}
                            disabled={edit?.saving}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium disabled:opacity-50 transition-colors"
                          >
                            {edit?.saving ? t.savingNames : t.saveNames}
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => setSessionEdits(prev => ({ ...prev, [batch.id]: { ...prev[batch.id], editMode: false } }))}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {t.cancel}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })()}
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
