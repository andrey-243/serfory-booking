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

const LANG_LABELS: Record<string, string> = { en: 'EN', ru: 'RU', et: 'ET', ky: 'KY' }
const LANG_COLORS: Record<string, string> = {
  en: 'bg-blue-100 text-blue-700',
  ru: 'bg-orange-100 text-orange-700',
  et: 'bg-green-100 text-green-700',
  ky: 'bg-purple-100 text-purple-700',
}

type Session = { id: string; session_date: string; start_time: string }

type Batch = {
  id: string
  subject: string
  teaching_language: string | null
  target_levels: string[]
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
  subjectFormats: Record<string, string[]>
  subjectLevels: Record<string, string[]>
  teachingLanguages: string[]
  lang: 'en' | 'ru' | 'et'
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
    spots: (n: number, max: number) => `${n}/${max} enrolled`,
    sessions: '4 sessions:',
    empty: 'No group batches yet.',
    maxReached: 'Max 5 future batches for this subject.',
    errorGeneric: 'Failed to create batch.',
    errorFields: 'Please fill all required fields.',
    saveAndActivate: 'Save & activate',
    activating: 'Activating…',
    errorActivate: 'Failed to activate.',
    editDates: 'Edit dates',
    cancelEdit: 'Cancel',
    confirmTitle: 'Confirm creation',
    confirmBody: 'Once created, this group cannot be deleted. Enrolled students will hold these slots permanently. Make sure all details are correct and that these time slots will be dedicated to this course.',
    confirmReview: 'Review',
    confirmCreate: 'Confirm & Create',
    disabledHint: 'Group format is disabled for this subject.',
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
    spots: (n: number, max: number) => `${n}/${max} записано`,
    sessions: '4 занятия:',
    empty: 'Групп пока нет.',
    maxReached: 'Максимум 5 будущих групп для этого предмета.',
    errorGeneric: 'Не удалось создать группу.',
    errorFields: 'Заполните все обязательные поля.',
    saveAndActivate: 'Сохранить и активировать',
    activating: 'Активация…',
    errorActivate: 'Не удалось активировать.',
    editDates: 'Изменить даты',
    cancelEdit: 'Отмена',
    confirmTitle: 'Подтвердить создание',
    confirmBody: 'После создания группу нельзя удалить. Записанные студенты займут эти слоты навсегда. Убедитесь, что все данные верны и эти временные слоты будут посвящены этому курсу.',
    confirmReview: 'Проверить',
    confirmCreate: 'Подтвердить и создать',
    disabledHint: 'Формат группы отключён для этого предмета.',
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
    spots: (n: number, max: number) => `${n}/${max} registreeritud`,
    sessions: '4 tundi:',
    empty: 'Gruppe pole veel.',
    maxReached: 'Maksimaalselt 5 tulevast gruppi selle aine jaoks.',
    errorGeneric: 'Grupi loomine ebaõnnestus.',
    errorFields: 'Täitke kõik kohustuslikud väljad.',
    saveAndActivate: 'Salvesta ja aktiveeri',
    activating: 'Aktiveerimine…',
    errorActivate: 'Aktiveerimine ebaõnnestus.',
    editDates: 'Muuda kuupäevi',
    cancelEdit: 'Tühista',
    confirmTitle: 'Kinnita loomine',
    confirmBody: 'Pärast loomist ei saa gruppi kustutada. Registreeritud õpilased hoiavad neid aegu jäädavalt. Veenduge, et kõik andmed on õiged ja need ajad on pühendatud sellele kursusele.',
    confirmReview: 'Vaata üle',
    confirmCreate: 'Kinnita ja loo',
    disabledHint: 'Grupi vorming on selle aine jaoks keelatud.',
  },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
}

export default function GroupSlotsTeacher({ teacherId, subjects, subjectFormats, subjectLevels, teachingLanguages, lang }: Props) {
  const t = LABELS[lang]
  const gl = GRADE_LABELS[lang]

  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const [formSubject, setFormSubject] = useState(() => subjects.find(s => subjectFormats[s]?.includes('group')) ?? subjects[0] ?? '')
  const [formLang, setFormLang] = useState(teachingLanguages[0] ?? '')
  const [formLevels, setFormLevels] = useState<string[]>([])
  const [levelMode, setLevelMode] = useState<'grade' | 'cefr'>('grade')
  const [formDate, setFormDate] = useState(today)
  const [formTime, setFormTime] = useState('17:00')

  // Prelock edit state
  const [prelockEdits, setPrelockEdits] = useState<Record<string, { start_date: string; start_time: string; activating: boolean; error: string | null; editMode: boolean }>>({})

  const isLang = LANG_SUBJECTS.includes(formSubject)
  const availableLevels = isLang ? (levelMode === 'cefr' ? CEFR_LEVELS : ALL_GRADES) : ALL_GRADES
  const availableLangs = teachingLanguages

  function toggleLevel(level: string) {
    setFormLevels(prev => prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level])
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

  function handleOpenForm() {
    resetForm()
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

  async function handleCreate() {
    setShowConfirm(false)
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
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(res.status === 422 ? t.maxReached : (data.error || t.errorGeneric))
        return
      }
      setShowForm(false)
      resetForm()
      loadBatches()
    } catch {
      setFormError(t.errorGeneric)
    } finally {
      setCreating(false)
    }
  }

  function initPrelockEdit(batch: Batch) {
    setPrelockEdits(prev => ({
      ...prev,
      [batch.id]: prev[batch.id] ?? { start_date: batch.start_date, start_time: batch.start_time, activating: false, error: null, editMode: false },
    }))
  }

  async function handleActivate(batchId: string) {
    const edit = prelockEdits[batchId]
    if (!edit) return
    setPrelockEdits(prev => ({ ...prev, [batchId]: { ...prev[batchId], activating: true, error: null } }))
    try {
      const res = await fetch('/api/group-slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: batchId, start_date: edit.start_date, start_time: edit.start_time, activate: true }),
      })
      if (!res.ok) {
        const d = await res.json()
        setPrelockEdits(prev => ({ ...prev, [batchId]: { ...prev[batchId], activating: false, error: d.error || t.errorActivate } }))
        return
      }
      setExpanded(null)
      loadBatches()
    } catch {
      setPrelockEdits(prev => ({ ...prev, [batchId]: { ...prev[batchId], activating: false, error: t.errorActivate } }))
    }
  }

  const futureBatches = batches.filter(b => b.status !== 'completed' && b.status !== 'cancelled')
  const pastBatches = batches.filter(b => b.status === 'completed' || b.status === 'cancelled')

  const groupEnabledForSubject = (s: string) => subjectFormats[s]?.includes('group') ?? false
  const anyGroupEnabled = subjects.some(s => groupEnabledForSubject(s))

  return (
    <div className="flex flex-col gap-4">
      {/* Confirmation modal */}
      {showConfirm && (() => {
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
                    <span className="text-gray-400">{formTime}</span>
                  </div>
                ))}
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
          {/* Row 1: subject + language */}
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
                <option value="">—</option>
                {availableLangs.map(l => <option key={l} value={l}>{LANG_LABELS[l] ?? l}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: date + time */}
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

          {/* Target levels */}
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

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-gray-200/70 animate-pulse" />)}
        </div>
      ) : futureBatches.length === 0 && pastBatches.length === 0 ? (
        <p className="text-sm text-gray-400">{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {[...futureBatches, ...pastBatches].map(batch => {
            const edit = prelockEdits[batch.id]
            const isPrelock = batch.status === 'prelock'
            return (
              <div key={batch.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    const next = expanded === batch.id ? null : batch.id
                    setExpanded(next)
                    if (next && isPrelock) initPrelockEdit(batch)
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {/* No prelock label — only show status for active/completed/cancelled */}
                    {!isPrelock && STATUS_COLORS[batch.status] && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[batch.status]}`}>
                        {t[batch.status as keyof typeof t] as string}
                      </span>
                    )}
                    {isPrelock && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                        <svg className="w-3 h-3 inline-block mr-0.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        {edit?.editMode ? t.editDates : '·'}
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-900">{batch.subject}</span>
                    {batch.teaching_language && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${LANG_COLORS[batch.teaching_language] ?? 'bg-gray-100 text-gray-500'}`}>
                        {LANG_LABELS[batch.teaching_language] ?? batch.teaching_language}
                      </span>
                    )}
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

                {expanded === batch.id && isPrelock && (() => {
                  if (!edit) return null
                  return (
                    <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-gray-500">{t.startDate}</label>
                          <input
                            type="date"
                            min={today}
                            value={edit.start_date}
                            onChange={e => setPrelockEdits(prev => ({ ...prev, [batch.id]: { ...prev[batch.id], start_date: e.target.value } }))}
                            className="px-3 py-1.5 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-gray-500">{t.startTime}</label>
                          <input
                            type="time"
                            value={edit.start_time}
                            onChange={e => setPrelockEdits(prev => ({ ...prev, [batch.id]: { ...prev[batch.id], start_time: e.target.value } }))}
                            className="px-3 py-1.5 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {edit.error && <p className="text-xs text-red-600">{edit.error}</p>}
                      <button
                        onClick={() => handleActivate(batch.id)}
                        disabled={edit.activating || !edit.start_date || !edit.start_time}
                        className="self-start px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                      >
                        {edit.activating ? t.activating : t.saveAndActivate}
                      </button>
                    </div>
                  )
                })()}

                {expanded === batch.id && !isPrelock && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    {batch.target_levels?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {batch.target_levels.map(l => (
                          <span key={l} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{l}</span>
                        ))}
                      </div>
                    )}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
