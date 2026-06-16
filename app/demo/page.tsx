'use client'

import { useState } from 'react'

// ── Mock data ──────────────────────────────────────────────────────────────────

const DEMAND_MOCK = [
  { subject: 'English',  lang: 'ru', level: 'B1', count: 4 },
  { subject: 'Estonian', lang: 'ru', level: 'A1', count: 3 },
  { subject: 'Estonian', lang: 'en', level: 'A2', count: 2 },
  { subject: 'English',  lang: 'ru', level: 'A2', count: 1 },
]

const MOCK_GROUPS = [
  { id: '1', subject: 'Estonian', lang: 'ru', level: 'A2', time: '15:00', sessions: ['Mon 23 Jun', 'Mon 30 Jun', 'Mon 7 Jul', 'Mon 14 Jul'], enrolled: 4, max: 6 },
  { id: '2', subject: 'English',  lang: 'ru', level: 'B1', time: '11:00', sessions: ['Fri 27 Jun', 'Fri 4 Jul', 'Fri 11 Jul', 'Fri 18 Jul'], enrolled: 2, max: 6 },
]

const MOCK_PREMADE = [
  { id: '1', name: 'Estonian for Beginners', subject: 'Estonian', lang: 'ru', level: 'A1', sessions: ['Mon 23 Jun 10:00', 'Wed 25 Jun 10:00', 'Mon 30 Jun 10:00', 'Wed 2 Jul 10:00'], enrolled: 5, max: 6 },
]

const LANG_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Kyrgyz']
const OTHER_SUBJECTS = ['Math', 'Chemistry', 'Physics']
const SCHOOL_GRADES = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3–4', 'Grade 5–6', 'Grade 7–8', 'Grade 9', 'Grade 10–12']
const CEFR = ['A1', 'A2', 'B1', 'B2']

const SUBJECT_COLORS: Record<string, string> = {
  Russian: 'bg-orange-100 text-orange-700', English: 'bg-blue-100 text-blue-700',
  Estonian: 'bg-green-100 text-green-700',  Spanish: 'bg-rose-100 text-rose-700',
  Math: 'bg-purple-100 text-purple-700',    Kyrgyz: 'bg-violet-100 text-violet-700',
  Physics: 'bg-sky-100 text-sky-700',       Chemistry: 'bg-teal-100 text-teal-700',
}
const LANG_COLORS: Record<string, string> = {
  en: 'bg-blue-100 text-blue-700', ru: 'bg-orange-100 text-orange-700',
  et: 'bg-green-100 text-green-700', ky: 'bg-violet-100 text-violet-700',
}

// ── Icons (from prod teacher page) ────────────────────────────────────────────

function IconOverview() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}
function IconGroups() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
}
function IconSettings() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
}
function IconPeople() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function IconTrend() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
}

// ── Group interest modal (shared) ─────────────────────────────────────────────

function GroupInterestModal({ onClose }: { onClose: () => void }) {
  const allSubjects = [...LANG_SUBJECTS, ...OTHER_SUBJECTS]
  const LANGS = ['ru', 'et', 'en', 'ky'] as const
  const LANG_LABELS = { ru: 'Russian', et: 'Estonian', en: 'English', ky: 'Kyrgyz' }

  const [subject, setSubject] = useState('English')
  const [lang, setLang] = useState('ru')
  const [level, setLevel] = useState('')
  const [contact, setContact] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const isLangSubject = LANG_SUBJECTS.includes(subject)
  const levels = isLangSubject ? CEFR : ['Grade 5–6', 'Grade 7–8', 'Grade 9', 'Grade 10–12']
  const tgEligible = lang === 'ru' || subject === 'Russian'

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Got it!</h3>
          <p className="text-sm text-gray-400 mb-6">We'll notify you when a matching group opens.</p>
          <button onClick={onClose} className="px-8 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Request a group course</h3>
            <p className="text-sm text-gray-400 mt-0.5">We'll notify you when a matching group opens.</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none ml-4">×</button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide block mb-1.5">Subject</label>
            <select value={subject} onChange={e => { setSubject(e.target.value); setLevel('') }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200">
              <optgroup label="Languages">{LANG_SUBJECTS.map(s => <option key={s}>{s}</option>)}</optgroup>
              <optgroup label="Sciences">{OTHER_SUBJECTS.map(s => <option key={s}>{s}</option>)}</optgroup>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide block mb-1.5">Teaching language</label>
            <div className="flex gap-2">
              {LANGS.map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${lang === l ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide block mb-1.5">{isLangSubject ? 'Level' : 'Grade'}</label>
            <div className="flex flex-wrap gap-1.5">
              {levels.map(lv => (
                <button key={lv} onClick={() => setLevel(lv)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${level === lv ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                  {lv}
                </button>
              ))}
            </div>
          </div>
          <div>
            {tgEligible ? (
              <>
                <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide block mb-1.5">Telegram username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
                  <input value={contact} onChange={e => setContact(e.target.value)} placeholder="your_username"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </>
            ) : (
              <>
                <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide block mb-1.5">Email</label>
                <input value={contact} onChange={e => setContact(e.target.value)} placeholder="your@email.com" type="email"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </>
            )}
          </div>
          <button onClick={() => { if (level && contact) setSubmitted(true) }} disabled={!level || !contact}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors">
            Send request
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Demand section (teacher) ───────────────────────────────────────────────────

function DemandRows({ compact }: { compact?: boolean }) {
  const total = DEMAND_MOCK.reduce((s, d) => s + d.count, 0)
  return (
    <div className={`${compact ? '' : 'bg-amber-50 border border-amber-200 rounded-xl p-4'}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconTrend />
            <span className="text-sm font-semibold text-amber-900">Group demand</span>
            <span className="text-[10px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">{total} requests</span>
          </div>
          <span className="text-[10px] text-amber-600">Students waiting for a group</span>
        </div>
      )}
      <div className="space-y-1.5">
        {DEMAND_MOCK.map((d, i) => (
          <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${compact ? 'bg-amber-50 border-amber-100' : 'bg-white border-amber-100'}`}>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${SUBJECT_COLORS[d.subject] ?? 'bg-gray-100 text-gray-600'}`}>{d.subject}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${LANG_COLORS[d.lang] ?? 'bg-gray-100 text-gray-500'}`}>{d.lang.toUpperCase()}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{d.level}</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">{d.count}</span>
              <span className="text-[11px] text-gray-400">students</span>
              <button className="text-[11px] px-2.5 py-1 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors">+ Create batch</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Mock GroupSlotsTeacher panel ───────────────────────────────────────────────

function MockGroupSlotsPanel({ withDemand }: { withDemand?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 text-sm">Group sessions</h3>
        <button className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors">+ New group</button>
      </div>
      {withDemand && (
        <div className="mb-4">
          <DemandRows compact />
        </div>
      )}
      <div className="space-y-3">
        {MOCK_GROUPS.map(g => (
          <div key={g.id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${SUBJECT_COLORS[g.subject]}`}>{g.subject}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${LANG_COLORS[g.lang]}`}>{g.lang.toUpperCase()}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{g.level}</span>
              </div>
              <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">active</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {g.sessions.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium border border-emerald-100">{s} · {g.time}</span>)}
            </div>
            <p className="text-[11px] text-gray-400">{g.enrolled}/{g.max} enrolled</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Mock PremadeBatchesTeacher panel ──────────────────────────────────────────

function MockPremadePanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 text-sm">Premade courses</h3>
        <button className="text-xs px-3 py-1.5 bg-violet-500 text-white rounded-lg font-semibold hover:bg-violet-600 transition-colors">+ New course</button>
      </div>
      <div className="space-y-3">
        {MOCK_PREMADE.map(p => (
          <div key={p.id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${SUBJECT_COLORS[p.subject]}`}>{p.subject}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${LANG_COLORS[p.lang]}`}>{p.lang.toUpperCase()}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{p.level}</span>
                </div>
              </div>
              <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">active</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {p.sessions.map((s, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-violet-50 text-violet-600 font-medium">{i + 1}. {s}</span>)}
            </div>
            <p className="text-[11px] text-gray-400">{p.enrolled}/{p.max} enrolled</p>
          </div>
        ))}
        <button className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors">+ New course</button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Category = 'package' | 'dashboard'
type PkgVariant = 'G1' | 'G2'
type DshVariant = 'D1' | 'D2'

export default function DemoPage() {
  const [category, setCategory] = useState<Category>('package')
  const [pkgVariant, setPkgVariant] = useState<PkgVariant>('G1')
  const [dshVariant, setDshVariant] = useState<DshVariant>('D1')

  const PKG_VARIANTS = [
    { id: 'G1' as PkgVariant, label: 'G1', desc: 'Inline text trigger' },
    { id: 'G2' as PkgVariant, label: 'G2', desc: 'Dashed card below' },
  ]
  const DSH_VARIANTS = [
    { id: 'D1' as DshVariant, label: 'D1', desc: 'Inside Groups panel' },
    { id: 'D2' as DshVariant, label: 'D2', desc: 'Full-width above grid' },
  ]

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Group interest feature</h1>
          <div className="flex gap-2">
            {([{ id: 'package', label: 'Package page' }, { id: 'dashboard', label: 'Teacher dashboard' }] as { id: Category; label: string }[]).map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${category === c.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {category === 'package' && (
          <>
            <div className="flex gap-2 mb-6">
              {PKG_VARIANTS.map(v => (
                <button key={v.id} onClick={() => setPkgVariant(v.id)}
                  className={`px-4 py-2 rounded-xl border text-left transition-all ${pkgVariant === v.id ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
                  <p className="text-sm font-bold">{v.label}</p>
                  <p className={`text-xs mt-0.5 ${pkgVariant === v.id ? 'text-blue-100' : 'text-gray-400'}`}>{v.desc}</p>
                </button>
              ))}
            </div>
            {pkgVariant === 'G1' && <PackageG1 />}
            {pkgVariant === 'G2' && <PackageG2 />}
          </>
        )}

        {category === 'dashboard' && (
          <>
            <div className="flex gap-2 mb-6">
              {DSH_VARIANTS.map(v => (
                <button key={v.id} onClick={() => setDshVariant(v.id)}
                  className={`px-4 py-2 rounded-xl border text-left transition-all ${dshVariant === v.id ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
                  <p className="text-sm font-bold">{v.label}</p>
                  <p className={`text-xs mt-0.5 ${dshVariant === v.id ? 'text-blue-100' : 'text-gray-400'}`}>{v.desc}</p>
                </button>
              ))}
            </div>
            {dshVariant === 'D1' && <TeacherD1 />}
            {dshVariant === 'D2' && <TeacherD2 />}
          </>
        )}
      </div>
    </main>
  )
}

// ── Package page shell (mirrors prod layout) ───────────────────────────────────

function PackageShell({ children, sidebarExtra }: { children: React.ReactNode; sidebarExtra?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#EEF2FF] py-10 px-8 rounded-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hi Andrey, choose your package</h1>
        <p className="text-gray-400 text-sm mt-1">Select a format and the number of lessons. You will receive an invoice by email.</p>
      </div>
      <div className="flex gap-6 items-start">
        {/* Left panel */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Card 1: Course + Teaching lang + Grade + Level */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-8">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Course</p>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-2">
                    {LANG_SUBJECTS.map((s, i) => (
                      <button key={s} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${i === 1 ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}>{s}</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {OTHER_SUBJECTS.map(s => (
                      <button key={s} className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-white text-gray-600 border-gray-200">{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Teaching language</p>
                <select defaultValue="ru" className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="en">English</option>
                  <option value="et">Estonian</option>
                  <option value="ru">Russian</option>
                  <option value="ky">Kyrgyz</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-x-8 gap-y-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Grade</p>
                <div className="flex flex-wrap gap-1.5">
                  {SCHOOL_GRADES.map(g => <button key={g} className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-white text-gray-600 border-gray-200">{g}</button>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Level</p>
                <div className="flex gap-1.5">
                  {CEFR.map((k, i) => <button key={k} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${i === 1 ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}>{k}</button>)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 + feature injection */}
          {children}
        </div>

        {/* Right sidebar (w-72 sticky, mirrors prod) */}
        <div className="w-72 shrink-0 sticky top-8 space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your order</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Course</span><span className="font-medium text-gray-800">English</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Level</span><span className="font-medium text-gray-800">A2</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Format</span><span className="font-medium text-gray-800">Individual</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Package</span><span className="font-medium text-gray-800">8 lessons</span></div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
              <span className="text-xs text-gray-500">Total</span>
              <span className="text-xl font-bold text-gray-900">200€</span>
            </div>
            <button className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors">Confirm and receive invoice</button>
            <p className="text-[10px] text-center text-gray-400">Invoice sent to your email</p>
            <div className="border-t border-gray-100 pt-3 flex items-start gap-1.5">
              <svg className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
              <p className="text-[10px] text-gray-400 leading-snug">This link is personal. Do not share it.</p>
            </div>
          </div>
          {sidebarExtra}
        </div>
      </div>
    </div>
  )
}

// ── Card 2: Format + Pack (shared) ────────────────────────────────────────────

function Card2({ footer }: { footer?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Format</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Individual', sub: '1 student', active: true },
          { label: 'Group', sub: '4–6 students', green: true },
          { label: 'Structured course', sub: '3–6 students', violet: true },
        ].map(f => (
          <button key={f.label} className={`p-4 rounded-xl border-2 text-left transition-all ${f.active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <p className="font-semibold text-gray-900 text-sm">{f.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{f.sub}</p>
            {f.green && <p className="text-xs text-green-600 font-semibold mt-1">-41% vs individual</p>}
            {f.violet && <p className="text-xs text-green-600 font-semibold mt-1">-31% vs individual</p>}
          </button>
        ))}
      </div>
      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mt-6 mb-3">Package</p>
      <div className="grid grid-cols-4 gap-3">
        {[
          { n: 1,  price: 34 },
          { n: 4,  price: 33 },
          { n: 8,  price: 31, popular: true },
          { n: 12, price: 30 },
        ].map(p => (
          <div key={p.n} className={`relative p-4 rounded-xl border-2 ${p.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            {p.popular && <span className="absolute -top-2 left-3 text-[10px] font-bold bg-blue-500 text-white px-2 py-px rounded-full">Popular</span>}
            <p className="font-semibold text-sm text-gray-900">{p.n === 1 ? '1 lesson' : `${p.n} lessons`}</p>
            <p className="text-base font-bold text-gray-900 mt-1">{p.price}€</p>
            <p className="text-[10px] text-gray-400">/lesson</p>
          </div>
        ))}
      </div>
      {footer}
    </div>
  )
}

// ── G1 - Inline text trigger (inside Card 2) ──────────────────────────────────

function PackageG1() {
  const [open, setOpen] = useState(false)
  return (
    <PackageShell>
      {open && <GroupInterestModal onClose={() => setOpen(false)} />}
      <Card2
        footer={
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5">
            <span className="text-gray-400"><IconPeople /></span>
            <span className="text-xs text-gray-400">Looking for a group course that's not listed?</span>
            <button onClick={() => setOpen(true)} className="text-xs text-blue-500 hover:text-blue-700 font-semibold underline underline-offset-2 transition-colors">
              Request one
            </button>
          </div>
        }
      />
    </PackageShell>
  )
}

// ── G2 - Dashed card below Card 2 ────────────────────────────────────────────

function PackageG2() {
  const [open, setOpen] = useState(false)
  return (
    <PackageShell>
      {open && <GroupInterestModal onClose={() => setOpen(false)} />}
      <Card2 />
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border-2 border-dashed border-gray-200 bg-white/60 hover:border-blue-300 hover:bg-blue-50/40 transition-all group">
        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors text-gray-400 group-hover:text-blue-500">
          <IconPeople />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">Want a specific group course?</p>
          <p className="text-xs text-gray-400 mt-0.5">Tell us what you're looking for. We'll open it when there's enough demand.</p>
        </div>
        <span className="ml-auto text-xs font-semibold text-gray-400 group-hover:text-blue-500 whitespace-nowrap transition-colors">Request →</span>
      </button>
    </PackageShell>
  )
}

// ── Teacher dashboard shell (mirrors prod layout) ─────────────────────────────

type NavSection = 'overview' | 'courses' | 'settings'

function TeacherShell({
  nav, setNav, demandBadge, coursesContent,
}: {
  nav: NavSection
  setNav: (n: NavSection) => void
  demandBadge?: number
  coursesContent: React.ReactNode
}) {
  const NAV = [
    { id: 'overview'  as NavSection, label: 'Overview',  icon: <IconOverview /> },
    { id: 'courses'   as NavSection, label: 'Courses',   icon: <IconGroups /> },
    { id: 'settings'  as NavSection, label: 'Settings',  icon: <IconSettings /> },
  ]

  return (
    <div className="bg-[#EEF2FF] rounded-2xl overflow-hidden" style={{ minHeight: 740 }}>
      <div className="flex min-h-[740px]">
        {/* Sidebar (w-56, mirrors prod) */}
        <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col">
          <div className="px-5 py-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3">
              <span className="font-semibold text-blue-700 text-lg">EK</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm">Elizabeth Kivonen</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {['Estonian', 'English'].map(s => (
                <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${SUBJECT_COLORS[s]}`}>{s}</span>
              ))}
            </div>
          </div>
          <nav className="flex-1 py-3">
            {NAV.map(item => (
              <button key={item.id} onClick={() => setNav(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${nav === item.id ? 'bg-blue-50 text-blue-600 font-semibold border-r-2 border-blue-500' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
                <span className="shrink-0">{item.icon}</span>
                {item.label}
                {item.id === 'courses' && demandBadge !== undefined && demandBadge > 0 && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${nav === 'courses' ? 'bg-amber-100 text-amber-700' : 'bg-amber-100 text-amber-700'}`}>
                    {demandBadge}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                <span className="text-[11px] text-gray-400">Google Calendar</span>
              </div>
              <button className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                Reconnect
              </button>
            </div>
            <button className="block text-xs text-gray-400 hover:text-gray-600 transition-colors">Sign out</button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar (mirrors prod) */}
          <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{NAV.find(n => n.id === nav)?.label}</h2>
            <div className="flex items-center gap-3">
              <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold shadow-sm">
                {['EN', 'RU', 'ET'].map((l, i) => (
                  <button key={l} className={`px-3 py-1.5 uppercase transition-colors ${i === 0 ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-600'}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-8">
            {nav === 'overview' && (
              <div className="space-y-5 max-w-3xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Next lesson</p>
                    <p className="text-sm font-bold text-gray-900">Masha Petrova</p>
                    <p className="text-xs text-gray-400 mt-0.5">English · Mon 23 Jun at 10:00</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Next 7 days</p>
                    <p className="text-2xl font-bold text-blue-600">6</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">1:1 <span className="font-semibold text-gray-700">4</span> · Group <span className="font-semibold text-emerald-600">2</span></p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm font-semibold text-gray-800 mb-3">Upcoming 1:1 lessons</p>
                  <div className="divide-y divide-gray-100">
                    {[
                      { name: 'Masha Petrova',  subj: 'English',  date: 'Mon 23 Jun · 10:00' },
                      { name: 'Andrei Sokolov', subj: 'Estonian', date: 'Tue 24 Jun · 14:00' },
                      { name: 'Liisa Tamm',     subj: 'Estonian', date: 'Wed 25 Jun · 11:00' },
                    ].map(b => (
                      <div key={b.name} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{b.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium mr-1 ${SUBJECT_COLORS[b.subj]}`}>{b.subj}</span>
                            {b.date}
                          </p>
                        </div>
                        <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">active</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {nav === 'courses' && coursesContent}
            {nav === 'settings' && (
              <div className="grid grid-cols-2 gap-5 max-w-3xl">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-4">Outside these hours, no bookings are proposed to students.</p>
                  <div className="space-y-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => {
                      const on = i < 5
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <div className={`relative inline-flex h-5 w-9 rounded-full flex-shrink-0 ${on ? 'bg-blue-500' : 'bg-gray-200'}`}>
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform mt-0.5 ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                          <span className="w-24 text-sm text-gray-700">{day}</span>
                          {on ? <span className="text-xs text-gray-500">09:00 – 18:00</span> : <span className="text-xs text-gray-400">Unavailable</span>}
                        </div>
                      )
                    })}
                  </div>
                  <button className="mt-4 px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">Save</button>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-800 text-sm mb-4">Course settings</h3>
                  <div className="space-y-3">
                    {['Estonian', 'English'].map(s => (
                      <div key={s} className="p-3 rounded-xl border border-gray-200">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${SUBJECT_COLORS[s]}`}>{s}</span>
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {['Individual', 'Pair', 'Group', 'Premade'].map(f => <span key={f} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-medium">{f}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── D1 - Demand inside Groups panel ──────────────────────────────────────────
// The demand section appears at the top of the Groups white card (inside the 50/50 grid).
// Teacher sees it when they open Courses. Contextual: right next to where they create batches.

function TeacherD1() {
  const [nav, setNav] = useState<NavSection>('courses')
  const total = DEMAND_MOCK.reduce((s, d) => s + d.count, 0)

  return (
    <TeacherShell
      nav={nav}
      setNav={setNav}
      demandBadge={total}
      coursesContent={
        <div className="grid grid-cols-2 gap-5 items-start">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {/* Demand injected at the top of this panel */}
            <div className="mb-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-600"><IconTrend /></div>
                <span className="text-sm font-semibold text-gray-800">Group demand</span>
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{total} requests</span>
              </div>
              <DemandRows compact />
            </div>
            <MockGroupSlotsPanel />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <MockPremadePanel />
          </div>
        </div>
      }
    />
  )
}

// ── D2 - Full-width demand section above the 50/50 grid ───────────────────────
// The demand section is a collapsible card above Groups + Premade.
// More prominent, visible from the first second you open Courses.
// Badge in the sidebar nav indicates pending demand.

function TeacherD2() {
  const [nav, setNav] = useState<NavSection>('courses')
  const [demandOpen, setDemandOpen] = useState(true)
  const total = DEMAND_MOCK.reduce((s, d) => s + d.count, 0)

  return (
    <TeacherShell
      nav={nav}
      setNav={setNav}
      demandBadge={total}
      coursesContent={
        <div className="space-y-5">
          {/* Full-width demand card, collapsible */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setDemandOpen(!demandOpen)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <IconTrend />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Student demand</p>
                  <p className="text-[11px] text-gray-400">{total} students are waiting for a group course</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full">{total} requests</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${demandOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {demandOpen && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                <DemandRows />
              </div>
            )}
          </div>

          {/* 50/50 grid below (same as prod Courses tab) */}
          <div className="grid grid-cols-2 gap-5 items-start">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <MockGroupSlotsPanel />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <MockPremadePanel />
            </div>
          </div>
        </div>
      }
    />
  )
}
