'use client'

import { useState } from 'react'

export type DemandRow = {
  subject: string
  teaching_language: string
  level: string
  count: number
}

const SUBJECT_COLORS: Record<string, string> = {
  Russian: 'bg-orange-100 text-orange-700', English: 'bg-blue-100 text-blue-700',
  Estonian: 'bg-green-100 text-green-700',  Spanish: 'bg-rose-100 text-rose-700',
  Math: 'bg-purple-100 text-purple-700',    Kyrgyz: 'bg-violet-100 text-violet-700',
  Physics: 'bg-sky-100 text-sky-700',       Chemistry: 'bg-teal-100 text-teal-700',
}

const LANG_COLORS: Record<string, string> = {
  en: 'bg-blue-100 text-blue-700', ru: 'bg-orange-100 text-orange-700',
  et: 'bg-green-100 text-green-700', ky: 'bg-purple-100 text-purple-700',
}

const LANG_LABELS: Record<string, string> = { en: 'EN', ru: 'RU', et: 'ET', ky: 'KY' }

const T = {
  en: {
    title: 'Group demand',
    createBatch: '+ Create batch',
    students: (n: number) => n === 1 ? '1 student' : `${n} students`,
    empty: 'No pending group requests for your subjects.',
    loading: 'Loading…',
  },
  ru: {
    title: 'Запросы на группы',
    createBatch: '+ Создать группу',
    students: (n: number) => n === 1 ? '1 ученик' : `${n} учеников`,
    empty: 'Нет запросов на группы по вашим предметам.',
    loading: 'Загрузка…',
  },
  et: {
    title: 'Grupinõudlus',
    createBatch: '+ Loo grupp',
    students: (n: number) => n === 1 ? '1 õpilane' : `${n} õpilast`,
    empty: 'Teie ainete kohta pole grupipäringuid.',
    loading: 'Laadimine…',
  },
}

type Props = {
  demands: DemandRow[]
  loading: boolean
  lang: 'en' | 'ru' | 'et'
  onCreateBatch: (subject: string, teachingLang: string, level: string) => void
}

export default function DemandSection({ demands, loading, lang, onCreateBatch }: Props) {
  const [open, setOpen] = useState(true)
  const t = T[lang]

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 mb-1">
        <p className="text-sm text-gray-400">{t.loading}</p>
      </div>
    )
  }

  if (demands.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden mb-1">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-amber-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {demands.reduce((sum, d) => sum + d.count, 0)}
          </span>
          <h3 className="font-semibold text-gray-800 text-sm">{t.title}</h3>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-amber-100 divide-y divide-gray-100">
          {demands.map(row => (
            <div
              key={`${row.subject}||${row.teaching_language}||${row.level}`}
              className="flex items-center gap-3 px-5 py-3"
            >
              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${SUBJECT_COLORS[row.subject] ?? 'bg-gray-100 text-gray-600'}`}>
                {row.subject}
              </span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${LANG_COLORS[row.teaching_language] ?? 'bg-gray-100 text-gray-500'}`}>
                {LANG_LABELS[row.teaching_language] ?? row.teaching_language.toUpperCase()}
              </span>
              <span className="text-xs font-medium text-gray-600 flex-shrink-0">{row.level}</span>
              <span className="text-xs text-gray-400 flex-1">{t.students(row.count)}</span>
              <button
                onClick={() => onCreateBatch(row.subject, row.teaching_language, row.level)}
                className="flex-shrink-0 text-xs font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-400 rounded-lg px-2.5 py-1 hover:bg-emerald-50 transition-colors"
              >
                {t.createBatch}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
