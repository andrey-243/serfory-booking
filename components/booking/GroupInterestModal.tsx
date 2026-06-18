'use client'

import { useState } from 'react'

const ALL_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Math', 'Chemistry', 'Physics', 'Kyrgyz']
const LANG_SUBJECTS = new Set(['Russian', 'English', 'Estonian', 'Spanish', 'Kyrgyz'])
const ALL_GRADES = ['kindergarten', '1', '2', '3-4', '5-6', '7-8', '9', '10-12']
const CEFR = ['A1', 'A2', 'B1', 'B2']
const TEACHING_LANGS = ['en', 'ru', 'et', 'ky'] as const
type TeachingLang = 'en' | 'ru' | 'et' | 'ky'

type Lang = 'en' | 'et' | 'ru'

const T = {
  en: {
    title: 'Request a group course',
    desc: "Can't find a group that fits? Tell us what you need.",
    subject: 'Subject',
    lang: 'Teaching language',
    level: 'Level',
    grade: 'Grade',
    submit: 'Send request',
    sending: 'Sending...',
    successTitle: 'Request sent!',
    successDesc: "We'll let you know when a matching group opens.",
    done: 'Done',
    langLabels: { en: 'English', ru: 'Russian', et: 'Estonian', ky: 'Kyrgyz' },
    gradeLabels: {
      kindergarten: 'Kindergarten', '1': 'Grade 1', '2': 'Grade 2',
      '3-4': 'Grade 3-4', '5-6': 'Grade 5-6', '7-8': 'Grade 7-8',
      '9': 'Grade 9', '10-12': 'Grade 10-12',
    },
    subjectLabels: {
      Russian: 'Russian', English: 'English', Estonian: 'Estonian', Spanish: 'Spanish',
      Math: 'Math', Chemistry: 'Chemistry', Physics: 'Physics', Kyrgyz: 'Kyrgyz',
    },
  },
  ru: {
    title: 'Запросить групповой курс',
    desc: 'Не нашли подходящую группу? Расскажите, что вам нужно.',
    subject: 'Предмет',
    lang: 'Язык обучения',
    level: 'Уровень',
    grade: 'Класс',
    submit: 'Отправить запрос',
    sending: 'Отправка...',
    successTitle: 'Запрос отправлен!',
    successDesc: 'Сообщим вам, когда откроется подходящая группа.',
    done: 'Готово',
    langLabels: { en: 'Английский', ru: 'Русский', et: 'Эстонский', ky: 'Кыргызский' },
    gradeLabels: {
      kindergarten: 'Детский сад', '1': '1 класс', '2': '2 класс',
      '3-4': '3-4 класс', '5-6': '5-6 класс', '7-8': '7-8 класс',
      '9': '9 класс', '10-12': '10-12 класс',
    },
    subjectLabels: {
      Russian: 'Русский', English: 'Английский', Estonian: 'Эстонский', Spanish: 'Испанский',
      Math: 'Математика', Chemistry: 'Химия', Physics: 'Физика', Kyrgyz: 'Кыргызский',
    },
  },
  et: {
    title: 'Taotle grupikursust',
    desc: 'Ei leidnud sobivat gruppi? Rääkige meile, mida vajate.',
    subject: 'Aine',
    lang: 'Õppekeel',
    level: 'Tase',
    grade: 'Klass',
    submit: 'Saada taotlus',
    sending: 'Saatmine...',
    successTitle: 'Taotlus saadetud!',
    successDesc: 'Anname teada, kui sobiv grupp avaneb.',
    done: 'Valmis',
    langLabels: { en: 'Inglise', ru: 'Vene', et: 'Eesti', ky: 'Kirgiisi' },
    gradeLabels: {
      kindergarten: 'Lasteaed', '1': '1. klass', '2': '2. klass',
      '3-4': '3.-4. klass', '5-6': '5.-6. klass', '7-8': '7.-8. klass',
      '9': '9. klass', '10-12': '10.-12. klass',
    },
    subjectLabels: {
      Russian: 'Vene keel', English: 'Inglise keel', Estonian: 'Eesti keel', Spanish: 'Hispaania keel',
      Math: 'Matemaatika', Chemistry: 'Keemia', Physics: 'Füüsika', Kyrgyz: 'Kirgiisi keel',
    },
  },
}

type Props = {
  onClose: () => void
  defaultSubject: string
  defaultLang: string
  uiLang: Lang
  refToken: string
}

function PeopleIcon() {
  return (
    <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

export default function GroupInterestModal({ onClose, defaultSubject, defaultLang, uiLang, refToken }: Props) {
  const t = T[uiLang]
  const [subject, setSubject] = useState(ALL_SUBJECTS.includes(defaultSubject) ? defaultSubject : ALL_SUBJECTS[0])
  const [lang, setLang] = useState<TeachingLang>(
    (['en', 'ru', 'et', 'ky'] as string[]).includes(defaultLang) ? defaultLang as TeachingLang : 'en'
  )
  const [level, setLevel] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')

  const isLangSubject = LANG_SUBJECTS.has(subject)
  const levels = isLangSubject ? CEFR : ALL_GRADES

  function handleSubjectChange(s: string) {
    setSubject(s)
    setLevel('')
  }

  async function handleSubmit() {
    if (!level || status === 'sending') return
    setStatus('sending')
    try {
      await fetch('/api/group-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refToken, subject, teaching_language: lang, level }),
      })
      setStatus('done')
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PeopleIcon />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{t.successTitle}</h3>
          <p className="text-sm text-gray-400 mb-6">{t.successDesc}</p>
          <button onClick={onClose} className="px-8 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors">
            {t.done}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t.title}</h3>
            <p className="text-sm text-gray-400 mt-0.5">{t.desc}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none ml-4">×</button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide block mb-1.5">{t.subject}</label>
            <select
              value={subject}
              onChange={e => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {ALL_SUBJECTS.map(s => (
                <option key={s} value={s}>{(t.subjectLabels as Record<string, string>)[s] ?? s}</option>
              ))}
            </select>
          </div>

          {/* Teaching language */}
          <div>
            <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide block mb-1.5">{t.lang}</label>
            <div className="flex gap-2">
              {TEACHING_LANGS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    lang === l ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {(t.langLabels as Record<string, string>)[l]}
                </button>
              ))}
            </div>
          </div>

          {/* Level / Grade */}
          <div>
            <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide block mb-1.5">
              {isLangSubject ? t.level : t.grade}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {levels.map(lv => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLevel(lv)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    level === lv ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {isLangSubject ? lv : ((t.gradeLabels as Record<string, string>)[lv] ?? lv)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!level || status === 'sending'}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
          >
            {status === 'sending' ? t.sending : t.submit}
          </button>
        </div>
      </div>
    </div>
  )
}
