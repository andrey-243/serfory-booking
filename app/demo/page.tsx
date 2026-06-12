'use client'

import { useState } from 'react'

type Variant = 'P1' | 'P2' | 'P3' | 'P4'

// ── Package page data ─────────────────────────────────────────────────────────

const PKG_LANG_COURSES = ['Russian', 'English', 'Estonian', 'Spanish', 'Kyrgyz']
const PKG_OTHER_COURSES = ['Math', 'Chemistry', 'Physics']
const PKG_SCHOOL = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3–4', 'Grade 5–6', 'Grade 7–8', 'Grade 9', 'Grade 10–12']
const PKG_CEFR = ['A1', 'A2', 'B1', 'B2']
const PKG_LANGS = ['English', 'Estonian', 'Russian', 'Kyrgyz']
const PKG_FORMATS = [
  { label: 'Individual', sub: '1 student' },
  { label: 'Pair',       sub: '2 students' },
  { label: 'Group',      sub: '4–6 students' },
]
const PKG_PACKS = [
  { lessons: 1,  disc: '',     price: 25 },
  { lessons: 4,  disc: '-5%',  price: 24 },
  { lessons: 8,  disc: '-10%', price: 23, popular: true },
  { lessons: 12, disc: '-15%', price: 21 },
]

// ── Shared sub-components ─────────────────────────────────────────────────────

function PkgPill({ label, active, small }: { label: string; active?: boolean; small?: boolean }) {
  const size = small
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-1.5 text-sm'
  return (
    <span className={`${size} rounded-lg font-medium border whitespace-nowrap ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}>
      {label}
    </span>
  )
}

function PkgHeader({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
      <p className="text-gray-400 text-sm mt-1">{desc}</p>
    </div>
  )
}

function PkgFormatCards({ selected }: { selected: string }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {PKG_FORMATS.map(f => (
        <div key={f.label} className={`p-4 rounded-xl border-2 text-left ${f.label === selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <p className="font-semibold text-sm text-gray-900">{f.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{f.sub}</p>
        </div>
      ))}
    </div>
  )
}

function PkgPackCards() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {PKG_PACKS.map(p => (
        <div key={p.lessons} className={`relative p-4 rounded-xl border-2 ${p.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          {p.popular && <span className="absolute -top-2 left-3 text-[10px] font-bold bg-blue-500 text-white px-2 py-px rounded-full">Popular</span>}
          <p className="font-semibold text-sm text-gray-900">{p.lessons === 1 ? '1 lesson' : `${p.lessons} lessons`}</p>
          {p.disc && <p className="text-xs text-green-600 font-medium">{p.disc}</p>}
          <p className="text-xl font-bold text-gray-900 mt-1">{p.price}€</p>
          <p className="text-xs text-gray-400">/lesson</p>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [variant, setVariant] = useState<Variant>('P1')

  const VARIANTS: { id: Variant; label: string; desc: string }[] = [
    { id: 'P1', label: 'Package P1', desc: 'Toolbar' },
    { id: 'P2', label: 'Package P2', desc: 'Sidebar' },
    { id: 'P3', label: 'Package P3', desc: 'Banner' },
    { id: 'P4', label: 'Package P4', desc: 'Summary sidebar' },
  ]

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Package page — Design proposals</h1>
        </div>
        <div className="flex gap-2 mb-8 flex-wrap">
          {VARIANTS.map(v => (
            <button key={v.id} onClick={() => setVariant(v.id)}
              className={`px-4 py-2 rounded-xl border text-left transition-all ${variant === v.id ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
              <p className="text-sm font-bold">{v.label}</p>
              <p className={`text-xs mt-0.5 ${variant === v.id ? 'text-blue-100' : 'text-gray-400'}`}>{v.desc}</p>
            </button>
          ))}
        </div>
        {variant === 'P1' && <PackageP1 />}
        {variant === 'P2' && <PackageP2 />}
        {variant === 'P3' && <PackageP3 />}
        {variant === 'P4' && <PackageP4 />}
      </div>
    </main>
  )
}

// ── P1 — Toolbar compact ──────────────────────────────────────────────────────

function PackageP1() {
  return (
    <div className="min-h-screen bg-[#EEF2FF] p-8 rounded-2xl">
      <div className="max-w-3xl mx-auto">
        <PkgHeader name="Hi Andrey, choose your package" desc="Select a format and number of lessons. You'll receive an invoice by email." />
        {/* Toolbar card */}
        <div className="mb-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
          {/* Row 1: Course (flex-1) | Teaching lang — top-aligned */}
          <div className="flex items-start gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Course</p>
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">{PKG_LANG_COURSES.map((s, i) => <PkgPill key={s} label={s} active={i === 1} small />)}</div>
                <div className="flex flex-wrap gap-1.5">{PKG_OTHER_COURSES.map(s => <PkgPill key={s} label={s} small />)}</div>
              </div>
            </div>
            <div className="shrink-0">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Teaching language</p>
              <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700">
                <option>English</option><option>Estonian</option><option>Russian</option>
              </select>
            </div>
          </div>
          {/* Row 2: Grade + Level — both pills, same size */}
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Grade</p>
              <div className="flex flex-wrap gap-1.5">{PKG_SCHOOL.map(g => <PkgPill key={g} label={g} small />)}</div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Level</p>
              <div className="flex gap-1.5">{PKG_CEFR.map((k, i) => <PkgPill key={k} label={k} active={i === 1} small />)}</div>
            </div>
          </div>
        </div>
        {/* Format + Package card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
          <div>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Format</p>
            <PkgFormatCards selected="Individual" />
          </div>
          <div className="border-t border-gray-100 pt-5">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Package</p>
            <PkgPackCards />
          </div>
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Total <span className="font-bold text-gray-900">200€</span></p>
            <button className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm">Confirm and receive invoice</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── P2 — Sidebar ──────────────────────────────────────────────────────────────

function PackageP2() {
  return (
    <div className="min-h-screen bg-[#EEF2FF] p-8 rounded-2xl">
      <div className="max-w-4xl mx-auto">
        <PkgHeader name="Hi Andrey, choose your package" desc="Select a format and number of lessons. You'll receive an invoice by email." />
        {/* Both panels stretch to the same height */}
        <div className="flex gap-5 items-stretch">
          {/* Left sidebar */}
          <div className="w-56 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Course</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-1">Languages</p>
                  <div className="flex flex-wrap gap-1">{PKG_LANG_COURSES.map((s, i) => <PkgPill key={s} label={s} active={i === 1} small />)}</div>
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-1">Sciences</p>
                  <div className="flex flex-wrap gap-1">{PKG_OTHER_COURSES.map(s => <PkgPill key={s} label={s} small />)}</div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Teaching language</p>
              <select className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">
                <option>English</option>{PKG_LANGS.slice(1).map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            {/* Grade — 2-column grid to reduce height */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Grade</p>
              <div className="grid grid-cols-2 gap-1">{PKG_SCHOOL.map(g => <PkgPill key={g} label={g} small />)}</div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Level</p>
              <div className="flex gap-1">{PKG_CEFR.map((k, i) => <PkgPill key={k} label={k} active={i === 1} small />)}</div>
            </div>
          </div>
          {/* Right panel — stretches to sidebar height, content distributed */}
          <div className="flex-1 flex flex-col">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col flex-1 justify-between">
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Format</p>
                <PkgFormatCards selected="Individual" />
              </div>
              <div className="border-t border-gray-100 pt-5">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Package</p>
                <PkgPackCards />
              </div>
              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">Total <span className="font-bold text-gray-900">200€</span></p>
                <button className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm">Confirm and receive invoice</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── P3 — Compact banner ───────────────────────────────────────────────────────

function PackageP3() {
  return (
    <div className="min-h-screen bg-[#EEF2FF] py-10 px-8 rounded-2xl">
      <div className="max-w-4xl mx-auto">
        <PkgHeader name="Hi Andrey, choose your package" desc="Select a format and number of lessons. You'll receive an invoice by email." />
        {/* Setup banner */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 space-y-4">
          {/* Row 1: Course (flex-1) | Teaching lang (shrink-0, natural width) */}
          <div className="flex items-start gap-8">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Course</p>
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">{PKG_LANG_COURSES.map((s, i) => <PkgPill key={s} label={s} active={i === 1} />)}</div>
                <div className="flex flex-wrap gap-1.5">{PKG_OTHER_COURSES.map(s => <PkgPill key={s} label={s} />)}</div>
              </div>
            </div>
            <div className="shrink-0">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Teaching language</p>
              <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
                <option>English</option>{PKG_LANGS.slice(1).map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          {/* Row 2: Grade + Level — same size (both small) */}
          <div className="flex flex-wrap items-start gap-x-8 gap-y-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Grade</p>
              <div className="flex flex-wrap gap-1.5">{PKG_SCHOOL.map(g => <PkgPill key={g} label={g} small />)}</div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Level</p>
              <div className="flex gap-1.5">{PKG_CEFR.map((k, i) => <PkgPill key={k} label={k} active={i === 1} small />)}</div>
            </div>
          </div>
        </div>
        {/* Format + Package + CTA — full width of card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Format</p>
          <PkgFormatCards selected="Individual" />
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Package</p>
            <PkgPackCards />
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Total <span className="font-bold text-gray-900 text-base">200€</span></p>
            <button className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm">Confirm and receive invoice</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── P4 — Summary sidebar ──────────────────────────────────────────────────────

function PackageP4() {
  return (
    <div className="min-h-screen bg-[#EEF2FF] py-10 px-8 rounded-2xl">
      <PkgHeader name="Hi Andrey, choose your package" desc="Select a format and number of lessons. You'll receive an invoice by email." />
      <div className="flex gap-6 items-start">
        {/* Left: 2 cards */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Card 1: Course (70%) + Lang (30%), then Grade + Level side by side */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="grid grid-cols-[7fr_3fr] gap-6 items-start">
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Course</p>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">{PKG_LANG_COURSES.map((s, i) => <PkgPill key={s} label={s} active={i === 1} />)}</div>
                  <div className="flex flex-wrap gap-1.5">{PKG_OTHER_COURSES.map(s => <PkgPill key={s} label={s} />)}</div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Teaching language</p>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
                  <option>English</option>{PKG_LANGS.slice(1).map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            {/* Grade + Level — same as P3 */}
            <div className="flex flex-wrap items-start gap-x-8 gap-y-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Grade</p>
                <div className="flex flex-wrap gap-1.5">{PKG_SCHOOL.map(g => <PkgPill key={g} label={g} small />)}</div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Level</p>
                <div className="flex gap-1.5">{PKG_CEFR.map((k, i) => <PkgPill key={k} label={k} active={i === 1} small />)}</div>
              </div>
            </div>
          </div>
          {/* Card 2: Format + Package */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">Format</p>
            <PkgFormatCards selected="Individual" />
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mt-6 mb-3">Package</p>
            <PkgPackCards />
          </div>
        </div>
        {/* Right: sticky order summary — w-72 (~20% wider than w-60) */}
        <div className="w-72 shrink-0 sticky top-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your order</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Course</span>
                <span className="font-medium text-gray-800">English</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Level</span>
                <span className="font-medium text-gray-800">A2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Format</span>
                <span className="font-medium text-gray-800">Individual</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Package</span>
                <span className="font-medium text-gray-800">8 lessons</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
              <span className="text-xs text-gray-500">Total</span>
              <span className="text-xl font-bold text-gray-900">200€</span>
            </div>
            <button className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm">
              Confirm and receive invoice
            </button>
            <p className="text-[10px] text-center text-gray-400">Invoice sent to your email</p>
            <div className="border-t border-gray-100 pt-3 flex items-start gap-1.5">
              <svg className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
              <p className="text-[10px] text-gray-400 leading-snug">This link is personal — please don&apos;t share it with others.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
