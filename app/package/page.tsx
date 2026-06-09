'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Format = 'individual' | 'pair' | 'group'
type LessonsCount = 1 | 4 | 8 | 12

const FORMAT_INFO: Record<Format, { label: string; students: string; desc: string }> = {
  individual: { label: 'Individual', students: '1 student', desc: 'One-on-one lesson, fully personalised' },
  pair:       { label: 'Pair',       students: '2 students', desc: 'Learn together with a partner' },
  group:      { label: 'Group',      students: '4–6 students', desc: 'Small group, collaborative learning' },
}

const BASE_PRICES: Record<Format, Record<LessonsCount, number>> = {
  individual: { 1: 28, 4: 27, 8: 25, 12: 24 },
  pair:       { 1: 20, 4: 19, 8: 18, 12: 17 },
  group:      { 1: 15, 4: 14, 8: 14, 12: 13 },
}

const DISCOUNTS: Record<LessonsCount, string> = { 1: '', 4: '-5%', 8: '-10%', 12: '-15%' }
const LESSONS_OPTIONS: LessonsCount[] = [1, 4, 8, 12]

const T = {
  en: {
    loading: 'Loading...',
    invalidToken: 'This link is invalid or has already been used.',
    alreadySent: 'An invoice has already been sent for this application.',
    paid: 'Payment received. Check your email for your booking link.',
    title: (name: string, subject: string) => `Hi ${name}, choose your ${subject} package`,
    subtitle: 'Select a format and the number of lessons. You will receive an invoice by email.',
    format: 'Format',
    package: 'Package',
    lessons: (n: number) => n === 1 ? '1 lesson' : `${n} lessons`,
    popular: 'Popular',
    perLesson: '/lesson',
    perPerson: '/person',
    total: 'Total',
    confirm: 'Confirm and receive invoice',
    sending: 'Sending...',
    success: 'Invoice sent! Check your email.',
    personalLink: 'This link is personal — do not share it.',
  },
  et: {
    loading: 'Laadimine...',
    invalidToken: 'See link on vale või juba kasutatud.',
    alreadySent: 'Arve on juba saadetud selle avalduse jaoks.',
    paid: 'Makse saadud. Kontrolli oma e-posti broneeringulingi saamiseks.',
    title: (name: string, subject: string) => `Tere ${name}, vali oma ${subject} pakett`,
    subtitle: 'Vali formaat ja tundide arv. Saad arve e-posti teel.',
    format: 'Formaat',
    package: 'Pakett',
    lessons: (n: number) => n === 1 ? '1 tund' : `${n} tundi`,
    popular: 'Populaarne',
    perLesson: '/tund',
    perPerson: '/inimene',
    total: 'Kokku',
    confirm: 'Kinnita ja saa arve',
    sending: 'Saatmine...',
    success: 'Arve saadetud! Kontrolli oma e-posti.',
    personalLink: 'See link on isiklik — ära jaga seda.',
  },
  ru: {
    loading: 'Загрузка...',
    invalidToken: 'Эта ссылка недействительна или уже использована.',
    alreadySent: 'Счёт для этой заявки уже был отправлен.',
    paid: 'Оплата получена. Проверьте почту — там ссылка для бронирования.',
    title: (name: string, subject: string) => `Привет ${name}, выберите пакет для ${subject}`,
    subtitle: 'Выберите формат и количество уроков. Счёт придёт на почту.',
    format: 'Формат',
    package: 'Пакет',
    lessons: (n: number) => n === 1 ? '1 урок' : `${n} уроков`,
    popular: 'Популярно',
    perLesson: '/урок',
    perPerson: '/чел.',
    total: 'Итого',
    confirm: 'Подтвердить и получить счёт',
    sending: 'Отправка...',
    success: 'Счёт отправлен! Проверьте почту.',
    personalLink: 'Эта ссылка персональная — не передавайте её.',
  },
}

export default function PackagePage() {
  return (
    <Suspense fallback={<PageShell><p className="text-gray-500">Loading...</p></PageShell>}>
      <PackagePageInner />
    </Suspense>
  )
}

function PackagePageInner() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [appData, setAppData] = useState<{ name: string; subject: string; lang: string } | null>(null)
  const [status, setStatus] = useState<'loading' | 'invalid' | 'alreadySent' | 'paid' | 'ready' | 'sending' | 'done'>('loading')

  const [format, setFormat] = useState<Format>('individual')
  const [lessons, setLessons] = useState<LessonsCount>(8)

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    fetch(`/api/package?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setStatus('invalid'); return }
        if (d.invoicePaid) { setStatus('paid'); return }
        if (d.invoiceAlreadySent) { setStatus('alreadySent'); return }
        setAppData({ name: d.name, subject: d.subject, lang: d.lang })
        setStatus('ready')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  const lang = (['en', 'et', 'ru'].includes(appData?.lang ?? '') ? appData!.lang : 'en') as keyof typeof T
  const t = T[lang] ?? T.en

  const pricePerLesson = BASE_PRICES[format][lessons]
  const studentsCount = format === 'individual' ? 1 : format === 'pair' ? 2 : 5
  const total = pricePerLesson * lessons * studentsCount

  async function handleConfirm() {
    setStatus('sending')
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, format, lessons_count: lessons }),
    })
    if (res.ok) {
      setStatus('done')
    } else {
      setStatus('ready')
      alert('Something went wrong. Please try again.')
    }
  }

  if (status === 'loading') return <PageShell><p className="text-gray-500">{T.en.loading}</p></PageShell>
  if (status === 'invalid') return <PageShell><ErrorCard msg={T.en.invalidToken} /></PageShell>
  if (status === 'paid') return <PageShell><SuccessCard msg={t.paid} /></PageShell>
  if (status === 'alreadySent') return <PageShell><InfoCard msg={t.alreadySent} /></PageShell>
  if (status === 'done') return <PageShell><SuccessCard msg={t.success} /></PageShell>

  return (
    <PageShell>
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t.title(appData!.name, appData!.subject)}
        </h1>
        <p className="text-gray-500 mb-8 text-sm">{t.subtitle}</p>

        {/* Format selector */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">{t.format}</p>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(FORMAT_INFO) as Format[]).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  format === f
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900 text-sm">{FORMAT_INFO[f].label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{FORMAT_INFO[f].students}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Package selector */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">{t.package}</p>
          <div className="grid grid-cols-4 gap-3">
            {LESSONS_OPTIONS.map(n => {
              const price = BASE_PRICES[format][n]
              const isSelected = lessons === n
              const isPopular = n === 8
              return (
                <button
                  key={n}
                  onClick={() => setLessons(n)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-2 left-3 text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                      {t.popular}
                    </span>
                  )}
                  <p className="font-semibold text-gray-900 text-sm">{t.lessons(n)}</p>
                  {DISCOUNTS[n] && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">{DISCOUNTS[n]}</p>
                  )}
                  <p className="text-base font-bold text-gray-900 mt-1">{price}€</p>
                  <p className="text-[10px] text-gray-400">
                    {t.perLesson}{format !== 'individual' ? ` · ${t.perPerson}` : ''}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Total + CTA */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t.total}</p>
            <p className="text-2xl font-bold text-gray-900">{total}€</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {format !== 'individual' ? `${studentsCount} × ` : ''}{lessons} × {pricePerLesson}€
            </p>
          </div>
          <button
            onClick={handleConfirm}
            disabled={status === 'sending'}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {status === 'sending' ? t.sending : t.confirm}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">{t.personalLink}</p>
      </div>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#EEF2FF] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xl font-bold text-blue-600">Serfory</span>
        </div>
        {children}
      </div>
    </div>
  )
}

function ErrorCard({ msg }: { msg: string }) {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
      <p className="text-red-500 font-medium">{msg}</p>
    </div>
  )
}

function SuccessCard({ msg }: { msg: string }) {
  return (
    <div className="bg-white rounded-xl border border-green-200 p-6 text-center">
      <p className="text-green-600 font-medium">{msg}</p>
    </div>
  )
}

function InfoCard({ msg }: { msg: string }) {
  return (
    <div className="bg-white rounded-xl border border-blue-200 p-6 text-center">
      <p className="text-blue-600 font-medium">{msg}</p>
    </div>
  )
}
