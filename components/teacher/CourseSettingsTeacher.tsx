'use client'

import { useState } from 'react'

const LANG_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Kyrgyz']
const ALL_GRADES = ['kindergarten', '1', '2', '3-4', '5-6', '7-8', '9', '10-12']
const CEFR = ['A1', 'A2', 'B1', 'B2']
const ALL_TEACHING_LANGS = ['en', 'ru', 'et', 'ky']
const FORMATS = ['group', 'premade'] as const

const GRADE_LABELS: Record<string, Record<string, string>> = {
  en: {
    kindergarten: 'Kinder', '1': 'Gr 1', '2': 'Gr 2', '3-4': 'Gr 3–4',
    '5-6': 'Gr 5–6', '7-8': 'Gr 7–8', '9': 'Gr 9', '10-12': 'Gr 10–12',
    A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2',
  },
  ru: {
    kindergarten: 'Сад', '1': '1 кл', '2': '2 кл', '3-4': '3–4 кл',
    '5-6': '5–6 кл', '7-8': '7–8 кл', '9': '9 кл', '10-12': '10–12 кл',
    A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2',
  },
  et: {
    kindergarten: 'Lasteaed', '1': '1. kl', '2': '2. kl', '3-4': '3.–4. kl',
    '5-6': '5.–6. kl', '7-8': '7.–8. kl', '9': '9. kl', '10-12': '10.–12. kl',
    A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2',
  },
}

const T = {
  en: {
    title: 'My teaching profile',
    desc: 'Set which subjects you teach, in which languages, at what levels, and in which formats (1-on-1, pair, group, structured course).',
    teachingLangs: 'Languages I teach in',
    formats: 'Session formats',
    levels: 'Grades & levels',
    individual: 'Individual',
    alwaysOn: 'always on',
    save: 'Save',
    saving: 'Saving…',
    saved: '✓ Saved',
    langLabels: { en: 'EN', ru: 'RU', et: 'ET', ky: 'KY' },
    formatLabels: { pair: 'Pair', group: 'Group', premade: 'Structured course' },
  },
  ru: {
    title: 'Мой профиль преподавателя',
    desc: 'Укажите, какие предметы вы преподаёте, на каких языках, для каких уровней и в каких форматах (индивидуально, пара, группа, курс).',
    teachingLangs: 'Языки преподавания',
    formats: 'Форматы занятий',
    levels: 'Классы и уровни',
    individual: 'Индивидуально',
    alwaysOn: 'всегда',
    save: 'Сохранить',
    saving: 'Сохранение…',
    saved: '✓ Сохранено',
    langLabels: { en: 'EN', ru: 'RU', et: 'ET', ky: 'KY' },
    formatLabels: { pair: 'Пара', group: 'Группа', premade: 'Курс' },
  },
  et: {
    title: 'Minu õpetajaprofiil',
    desc: 'Määrake, milliseid aineid õpetate, mis keeltes, mis tasemetel ja mis vormingutes (individuaalne, paar, grupp, kursus).',
    teachingLangs: 'Õpetamiskeeled',
    formats: 'Tunni vormingud',
    levels: 'Klassid ja tasemed',
    individual: 'Individuaalne',
    alwaysOn: 'alati',
    save: 'Salvesta',
    saving: 'Salvestamine…',
    saved: '✓ Salvestatud',
    langLabels: { en: 'EN', ru: 'RU', et: 'ET', ky: 'KY' },
    formatLabels: { pair: 'Paar', group: 'Grupp', premade: 'Kursus' },
  },
}

type Props = {
  teacherId: string
  subjects: string[]
  initialTeachingLanguages: string[]
  initialSubjectFormats: Record<string, string[]>
  initialSubjectLevels: Record<string, string[]>
  lang: 'en' | 'ru' | 'et'
  onSaved?: () => void
}

export default function CourseSettingsTeacher({
  teacherId,
  subjects,
  initialTeachingLanguages,
  initialSubjectFormats,
  initialSubjectLevels,
  lang,
  onSaved,
}: Props) {
  const t = T[lang]
  const gl = GRADE_LABELS[lang]

  const [teachingLangs, setTeachingLangs] = useState<string[]>(initialTeachingLanguages ?? [])
  const [subjectFormats, setSubjectFormats] = useState<Record<string, string[]>>(
    () => {
      const init: Record<string, string[]> = {}
      for (const s of subjects) {
        init[s] = initialSubjectFormats?.[s] ?? ['individual']
      }
      return init
    }
  )
  const [subjectLevels, setSubjectLevels] = useState<Record<string, string[]>>(
    () => {
      const init: Record<string, string[]> = {}
      for (const s of subjects) {
        init[s] = initialSubjectLevels?.[s] ?? []
      }
      return init
    }
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

  function toggleTeachingLang(l: string) {
    setTeachingLangs(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
    setSaved(false)
  }

  function toggleFormat(subject: string, fmt: string) {
    setSubjectFormats(prev => {
      const cur = prev[subject] ?? ['individual']
      const next = cur.includes(fmt) ? cur.filter(f => f !== fmt) : [...cur, fmt]
      if (!next.includes('individual')) next.unshift('individual')
      return { ...prev, [subject]: next }
    })
    setSaved(false)
  }

  function toggleLevel(subject: string, level: string) {
    setSubjectLevels(prev => {
      const cur = prev[subject] ?? []
      const next = cur.includes(level) ? cur.filter(l => l !== level) : [...cur, level]
      return { ...prev, [subject]: next }
    })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: teacherId,
          teaching_languages: teachingLangs,
          subject_formats: subjectFormats,
          subject_levels: subjectLevels,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{t.title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
      </div>

      {/* Teaching languages */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.teachingLangs}</span>
        <div className="flex gap-2">
          {ALL_TEACHING_LANGS.map(l => (
            <button
              key={l}
              type="button"
              onClick={() => toggleTeachingLang(l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                teachingLangs.includes(l)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
              }`}
            >
              {t.langLabels[l as keyof typeof t.langLabels]}
            </button>
          ))}
        </div>
      </div>

      {/* Per-subject settings - collapsible */}
      <div className="flex flex-col gap-2">
        {subjects.map(subject => {
          const isLang = LANG_SUBJECTS.includes(subject)
          const levels = isLang ? [...ALL_GRADES, ...CEFR] : ALL_GRADES
          const fmts = subjectFormats[subject] ?? ['individual']
          const lvls = subjectLevels[subject] ?? []
          const open = expandedSubject === subject

          return (
            <div key={subject} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Header - clickable */}
              <button
                type="button"
                onClick={() => setExpandedSubject(open ? null : subject)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">{subject}</span>
                  <span className="text-xs text-gray-400">
                    {fmts.filter(f => f !== 'individual').length > 0
                      ? fmts.map(f => f === 'individual' ? '1:1' : t.formatLabels[f as keyof typeof t.formatLabels]).join(' · ')
                      : '1:1'}
                    {lvls.length > 0 && ` · ${lvls.length} levels`}
                  </span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open && (
                <div className="border-t border-gray-100 px-4 py-4 flex flex-col gap-4 bg-gray-50/40">
                  {/* Formats */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t.formats}</span>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white opacity-60 cursor-not-allowed select-none">
                        <span className="w-3.5 h-3.5 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="text-sm text-gray-600">{t.individual}</span>
                        <span className="text-[10px] text-gray-400">({t.alwaysOn})</span>
                      </div>
                      {FORMATS.map(fmt => {
                        const on = fmts.includes(fmt)
                        return (
                          <button key={fmt} type="button" onClick={() => toggleFormat(subject, fmt)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                              on ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                            }`}>
                            {on && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            {t.formatLabels[fmt]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Grades / levels */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{t.levels}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {levels.map(level => {
                        const on = lvls.includes(level)
                        return (
                          <button key={level} type="button" onClick={() => toggleLevel(subject, level)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                              on ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}>
                            {gl[level] ?? level}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="self-start px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
      >
        {saving ? t.saving : saved ? t.saved : t.save}
      </button>
    </div>
  )
}
