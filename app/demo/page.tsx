'use client'

import { useState } from 'react'

const COURSES = ['Russian', 'English', 'Estonian', 'Spanish', 'Math'] as const
const LANGS = ['Russian', 'Estonian', 'English'] as const

type Course = typeof COURSES[number]

// ─────────────────────────────────────────────
// Design A — 2 lignes séparées, labels discrets
// ─────────────────────────────────────────────
function DesignA() {
  const [course, setCourse] = useState<Course>('Russian')
  const [langs, setLangs] = useState<string[]>([])

  function toggleLang(l: string) {
    setLangs(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
  }

  return (
    <div className="space-y-2.5">
      {/* Row 1 — Subject */}
      <div className="flex items-center gap-2 flex-wrap">
        {COURSES.map(c => (
          <button
            key={c}
            onClick={() => setCourse(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              course === c
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400 hover:text-blue-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {/* Row 2 — Language */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">Taught in</span>
        <div className="flex gap-1.5">
          {LANGS.map(l => (
            <button
              key={l}
              onClick={() => toggleLang(l)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                langs.includes(l)
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Design B — Segment bar + dropdown langue
// ─────────────────────────────────────────────
function DesignB() {
  const [course, setCourse] = useState<Course>('Russian')
  const [lang, setLang] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Segmented bar */}
      <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 shadow-sm">
        {COURSES.map(c => (
          <button
            key={c}
            onClick={() => setCourse(c)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              course === c
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Language dropdown pill */}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors shadow-sm ${
            lang
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span>{lang || 'Taught in'}</span>
          <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute top-full mt-1.5 left-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10 min-w-[140px]">
            <button
              onClick={() => { setLang(''); setOpen(false) }}
              className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              All languages
            </button>
            {LANGS.map(l => (
              <button
                key={l}
                onClick={() => { setLang(l); setOpen(false) }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                  lang === l ? 'text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Design C — Toolbar avec séparateur vertical fort
// ─────────────────────────────────────────────
function DesignC() {
  const [course, setCourse] = useState<Course>('Russian')
  const [langs, setLangs] = useState<string[]>([])

  function toggleLang(l: string) {
    setLangs(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
  }

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-2.5 gap-4 shadow-sm w-fit">
      {/* Subject group */}
      <div className="flex items-center gap-1.5">
        {COURSES.map(c => (
          <button
            key={c}
            onClick={() => setCourse(c)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              course === c
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 flex-shrink-0" />

      {/* Language group */}
      <div className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        {LANGS.map(l => (
          <button
            key={l}
            onClick={() => toggleLang(l)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              langs.includes(l)
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Design D — Compact tags avec icônes distinctes
// ─────────────────────────────────────────────
function DesignD() {
  const [course, setCourse] = useState<Course>('Russian')
  const [langs, setLangs] = useState<string[]>([])

  function toggleLang(l: string) {
    setLangs(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Subject — style colored dots */}
      <div className="flex gap-1.5">
        {COURSES.map(c => (
          <button
            key={c}
            onClick={() => setCourse(c)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border-2 transition-all ${
              course === c
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Language — style underline / tab */}
      <div className="flex items-end gap-0 border-b-2 border-gray-200">
        {LANGS.map(l => (
          <button
            key={l}
            onClick={() => toggleLang(l)}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-0.5 ${
              langs.includes(l)
                ? 'border-gray-800 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#EEF2FF] p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <h1 className="text-xl font-bold text-gray-800">Filter designs — pick one</h1>

        {([
          { id: 'A', label: '2 lignes séparées — "Taught in" label', Component: DesignA },
          { id: 'B', label: 'Segment bar + dropdown langue', Component: DesignB },
          { id: 'C', label: 'Toolbar unifiée avec séparateur', Component: DesignC },
          { id: 'D', label: 'Pills + underline tabs pour la langue', Component: DesignD },
        ] as const).map(({ id, label, Component }) => (
          <div key={id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Design {id} — {label}
            </p>
            <Component />
          </div>
        ))}
      </div>
    </main>
  )
}
