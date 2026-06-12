'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

type Format = 'individual' | 'pair' | 'group'
type LessonsCount = 1 | 4 | 8 | 12
type Lang = 'en' | 'et' | 'ru'
type TeachingLang = 'en' | 'et' | 'ru' | 'ky'

const FORMAT_INFO: Record<Format, Record<Lang, { label: string; students: string }>> = {
  individual: {
    en: { label: 'Individual', students: '1 student' },
    et: { label: 'Individuaalne', students: '1 õpilane' },
    ru: { label: 'Индивидуально', students: '1 ученик' },
  },
  pair: {
    en: { label: 'Pair', students: '2 students' },
    et: { label: 'Paaristund', students: '2 õpilast' },
    ru: { label: 'Парный', students: '2 ученика' },
  },
  group: {
    en: { label: 'Group', students: '4–6 students' },
    et: { label: 'Grupp', students: '4–6 õpilast' },
    ru: { label: 'Группа', students: '4–6 учеников' },
  },
}

const BASE_PRICES: Record<Format, Record<LessonsCount, number>> = {
  individual: { 1: 28, 4: 27, 8: 25, 12: 24 },
  pair:       { 1: 20, 4: 19, 8: 18, 12: 17 },
  group:      { 1: 15, 4: 14, 8: 14, 12: 13 },
}

const DISCOUNTS: Record<LessonsCount, string> = { 1: '', 4: '-5%', 8: '-10%', 12: '-15%' }
const LESSONS_OPTIONS: Record<Format, LessonsCount[]> = {
  individual: [1, 4, 8, 12],
  pair: [1, 4, 8],
  group: [4],
}

const LANG_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Kyrgyz'] as const
const OTHER_SUBJECTS = ['Math', 'Chemistry', 'Physics'] as const
const VALID_SUBJECTS = [...LANG_SUBJECTS, ...OTHER_SUBJECTS] as const
type Subject = typeof VALID_SUBJECTS[number]
const LANG_SUBJECT_SET = new Set<Subject>(['Russian', 'English', 'Estonian', 'Spanish', 'Kyrgyz'])

// Individual-only subjects (no group/pair formats)
const SOLO_ONLY_SUBJECTS = new Set<Subject>(['Math', 'Kyrgyz', 'Chemistry', 'Physics'])
function getAvailableFormats(subject: Subject): Format[] {
  return SOLO_ONLY_SUBJECTS.has(subject) ? ['individual'] : ['individual', 'pair', 'group']
}

const TG_COUNTRIES = new Set(['RU','BY','UA','KZ','KG','TJ','TM','UZ','AZ','AM','GE','MD','EE','LV','LT','PL','RO','BG','RS','HU','CZ','SK','HR','BA','ME','MK','AL'])

function isTgEligible(country_code: string | null, learning_lang: string | null): boolean {
  return learning_lang === 'ru' || (!!country_code && TG_COUNTRIES.has(country_code.toUpperCase()))
}

const GRADE_KEYS_PKG = ['kindergarten','1','2','3-4','5-6','7-8','9','10-12','A1','A2','B1','B2'] as const
type GradeKeyPkg = typeof GRADE_KEYS_PKG[number]
const GRADE_LABELS_PKG: Record<Lang, Record<GradeKeyPkg, string>> = {
  en: { 'kindergarten':'Kindergarten','1':'Grade 1','2':'Grade 2','3-4':'Grade 3–4','5-6':'Grade 5–6','7-8':'Grade 7–8','9':'Grade 9','10-12':'Grade 10–12','A1':'A1','A2':'A2','B1':'B1','B2':'B2' },
  et: { 'kindergarten':'Lasteaed','1':'1. klass','2':'2. klass','3-4':'3.–4. klass','5-6':'5.–6. klass','7-8':'7.–8. klass','9':'9. klass','10-12':'10.–12. klass','A1':'A1','A2':'A2','B1':'B1','B2':'B2' },
  ru: { 'kindergarten':'Детский сад','1':'1 класс','2':'2 класс','3-4':'3–4 класс','5-6':'5–6 класс','7-8':'7–8 класс','9':'9 класс','10-12':'10–12 класс','A1':'A1','A2':'A2','B1':'B1','B2':'B2' },
}
const SCHOOL_GRADES: GradeKeyPkg[] = ['kindergarten','1','2','3-4','5-6','7-8','9','10-12']
const CEFR_GRADES: GradeKeyPkg[] = ['A1','A2','B1','B2']

const T = {
  en: {
    loading: 'Loading...',
    invalidToken: 'This link is invalid or has already been used.',
    alreadySent: 'An invoice has already been sent for this application.',
    paid: 'Payment received. Check your email for your booking link.',
    title: (name: string) => `Hi ${name}, choose your package`,
    subtitle: 'Select a format and the number of lessons. You will receive an invoice by email.',
    course: 'Course',
    courseLabels: { Russian: 'Russian', English: 'English', Estonian: 'Estonian', Spanish: 'Spanish', Math: 'Math', Kyrgyz: 'Kyrgyz', Chemistry: 'Chemistry', Physics: 'Physics' } as Record<string, string>,
    grade: 'Grade / Level',
    gradeSection: 'Grade',
    levelSection: 'Level',
    gradeDefault: 'Not specified',
    teachingLang: 'Teaching language',
    langLabels: { en: 'English', et: 'Estonian', ru: 'Russian', ky: 'Kyrgyz' } as Record<string, string>,
    onlyAvailableIn: 'This course is available in:',
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
    tgTitle: 'Get updates on Telegram',
    tgDesc: 'Receive lesson reminders and messages from your teacher directly on Telegram.',
    tgCta: 'Connect to bot',
    invoicePending: 'You have a pending invoice. You can still select a new package.',
    comingSoon: 'Coming soon',
    interested: "I'm interested",
    interestedSent: 'Noted! We\'ll let you know.',
    notifyByEmail: 'Notify me by email',
    weeks: (n: number) => `${n} weeks`,
  },
  et: {
    loading: 'Laadimine...',
    invalidToken: 'See link on vale või juba kasutatud.',
    alreadySent: 'Arve on juba saadetud selle avalduse jaoks.',
    paid: 'Makse saadud. Kontrolli oma e-posti broneeringulingi saamiseks.',
    title: (name: string) => `Tere ${name}, vali oma pakett`,
    subtitle: 'Vali formaat ja tundide arv. Saad arve e-posti teel.',
    course: 'Kursus',
    courseLabels: { Russian: 'Vene keel', English: 'Inglise keel', Estonian: 'Eesti keel', Spanish: 'Hispaania keel', Math: 'Matemaatika', Kyrgyz: 'Kirgiisi keel', Chemistry: 'Keemia', Physics: 'Füüsika' } as Record<string, string>,
    grade: 'Klass / tase',
    gradeSection: 'Klass',
    levelSection: 'Tase',
    gradeDefault: 'Täpsustamata',
    teachingLang: 'Õppekeel',
    langLabels: { en: 'Inglise', et: 'Eesti', ru: 'Vene', ky: 'Kirgiisi' } as Record<string, string>,
    onlyAvailableIn: 'See kursus on saadaval keeltes:',
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
    tgTitle: 'Saa uuendusi Telegrami kaudu',
    tgDesc: 'Tunnimuistutused ja õpetaja sõnumid otse Telegrami.',
    tgCta: 'Ühenda botiga',
    invoicePending: 'Sul on ootel arve. Saad siiski uue paketi valida.',
    comingSoon: 'Tulemas',
    interested: 'Olen huvitatud',
    interestedSent: 'Märgitud! Anname teada.',
    notifyByEmail: 'Teavita mind e-postiga',
    weeks: (n: number) => `${n} nädalat`,
  },
  ru: {
    loading: 'Загрузка...',
    invalidToken: 'Эта ссылка недействительна или уже использована.',
    alreadySent: 'Счёт для этой заявки уже был отправлен.',
    paid: 'Оплата получена. Проверьте почту — там ссылка для бронирования.',
    title: (name: string) => `Привет ${name}, выберите пакет`,
    subtitle: 'Выберите формат и количество уроков. Счёт придёт на почту.',
    course: 'Курс',
    courseLabels: { Russian: 'Русский', English: 'Английский', Estonian: 'Эстонский', Spanish: 'Испанский', Math: 'Математика', Kyrgyz: 'Кыргызский', Chemistry: 'Химия', Physics: 'Физика' } as Record<string, string>,
    grade: 'Класс / уровень',
    gradeSection: 'Класс',
    levelSection: 'Уровень',
    gradeDefault: 'Не указан',
    teachingLang: 'Язык обучения',
    langLabels: { en: 'Английский', et: 'Эстонский', ru: 'Русский', ky: 'Кыргызский' } as Record<string, string>,
    onlyAvailableIn: 'Этот курс доступен на:',
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
    tgTitle: 'Получайте уведомления в Telegram',
    tgDesc: 'Напоминания об уроках и сообщения от учителя прямо в Telegram.',
    tgCta: 'Подключить бота',
    invoicePending: 'У вас есть неоплаченный счёт. Вы всё равно можете выбрать новый пакет.',
    comingSoon: 'Скоро',
    interested: 'Интересует',
    interestedSent: 'Записали! Сообщим вам.',
    notifyByEmail: 'Уведомить по email',
    weeks: (n: number) => `${n} недель`,
  },
}

function LoadingShell() {
  const [uiLang, setUiLang] = useState<Lang>('en')
  return <PageShell uiLang={uiLang} onLangChange={setUiLang}><p className="text-gray-500">Loading...</p></PageShell>
}

export default function PackagePage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <PackagePageInner />
    </Suspense>
  )
}

function PackagePageInner() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [appData, setAppData] = useState<{
    name: string; subject: string; grade: string | null; lang: Lang
    learning_lang: string | null; country_code: string | null
    hasTgChatId: boolean; telegram_username: string | null
  } | null>(null)
  const [status, setStatus] = useState<'loading' | 'invalid' | 'alreadySent' | 'paid' | 'ready' | 'sending' | 'done'>('loading')
  const [uiLang, setUiLang] = useState<Lang>('en')

  const [selectedSubject, setSelectedSubject] = useState<Subject>('Russian')
  const [selectedLearningLang, setSelectedLearningLang] = useState<TeachingLang>('en')
  const [availableLangs, setAvailableLangs] = useState<TeachingLang[]>(['en', 'et', 'ru', 'ky'])

  type TeacherMeta = { subjects?: string[]; teaching_languages?: string[]; subject_levels?: Record<string, string[]> | null }
  const [teacherCache, setTeacherCache] = useState<TeacherMeta[] | null>(null)
  useEffect(() => {
    fetch('/api/teachers')
      .then(r => r.json())
      .then(d => setTeacherCache(d.teachers ?? []))
      .catch(() => setTeacherCache([]))
  }, [])
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [availableGradesPkg, setAvailableGradesPkg] = useState<string[]>([...GRADE_KEYS_PKG])
  const [format, setFormat] = useState<Format>('individual')
  const [lessons, setLessons] = useState<LessonsCount>(8)
  const [hasPendingInvoice, setHasPendingInvoice] = useState(false)
  const [interest8w, setInterest8w] = useState<'idle' | 'ask' | 'sending' | 'done'>('idle')
  const [tgUsernameInput, setTgUsernameInput] = useState('')

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    fetch(`/api/package?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setStatus('invalid'); return }
        const lang = (['en', 'et', 'ru'].includes(d.lang) ? d.lang : 'en') as Lang
        setAppData({ name: d.name, subject: d.subject, grade: d.grade ?? null, lang, learning_lang: d.learning_lang ?? null, country_code: d.country_code ?? null, hasTgChatId: !!d.hasTgChatId, telegram_username: d.telegram_username ?? null })
        setUiLang(lang)
        if (VALID_SUBJECTS.includes(d.subject)) setSelectedSubject(d.subject as Subject)
        if (['en', 'et', 'ru', 'ky'].includes(d.learning_lang)) setSelectedLearningLang(d.learning_lang as TeachingLang)
        if (d.grade && (GRADE_KEYS_PKG as readonly string[]).includes(d.grade)) setSelectedGrade(d.grade)
        if (d.telegram_username) setTgUsernameInput(d.telegram_username)
        if (d.invoiceAlreadySent && !d.invoicePaid) setHasPendingInvoice(true)
        setStatus('ready')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  const t = T[uiLang]

  const pricePerLesson = BASE_PRICES[format][lessons]
  const studentsCount = format === 'individual' ? 1 : format === 'pair' ? 2 : 5
  const total = pricePerLesson * lessons * studentsCount

  const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'serforylearning_bot'
  const tgEligible = appData ? isTgEligible(appData.country_code, selectedLearningLang) : false

  // Reset format to individual when switching to solo-only subject
  useEffect(() => {
    if (!getAvailableFormats(selectedSubject).includes(format)) {
      setFormat('individual')
    }
  }, [selectedSubject])

  // Compute available grades from cache (no per-switch fetch)
  useEffect(() => {
    if (!teacherCache) return
    const union = new Set<string>()
    for (const t of teacherCache) {
      if (!t.subjects?.includes(selectedSubject)) continue
      for (const lvl of t.subject_levels?.[selectedSubject] ?? []) union.add(lvl)
    }
    setAvailableGradesPkg(union.size > 0 ? GRADE_KEYS_PKG.filter(k => union.has(k)) : [...GRADE_KEYS_PKG])
  }, [selectedSubject, teacherCache])

  useEffect(() => {
    if (selectedGrade && !availableGradesPkg.includes(selectedGrade)) setSelectedGrade('')
  }, [availableGradesPkg])

  // Compute available teaching languages from cache
  useEffect(() => {
    if (!teacherCache) return
    const LANG_NAME_TO_CODE: Record<string, TeachingLang> = { English: 'en', Estonian: 'et', Russian: 'ru', Kyrgyz: 'ky' }
    const langs = new Set<TeachingLang>()
    for (const t of teacherCache) {
      if (!t.subjects?.includes(selectedSubject)) continue
      for (const l of t.teaching_languages ?? []) {
        const code = LANG_NAME_TO_CODE[l]
        if (code) langs.add(code)
      }
    }
    const available = (['en', 'et', 'ru', 'ky'] as TeachingLang[]).filter(l => langs.has(l))
    setAvailableLangs(available.length > 0 ? available : ['en', 'et', 'ru', 'ky'])
  }, [selectedSubject, teacherCache])

  async function handleConfirm() {
    setStatus('sending')
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, format, lessons_count: lessons, subject: selectedSubject, learning_lang: selectedLearningLang }),
    })
    if (res.ok) {
      setStatus('done')
    } else {
      setStatus('ready')
      alert('Something went wrong. Please try again.')
    }
  }

  function handleInterest8wClick() {
    if (!appData) return
    // TG eligible but no chat_id yet → ask for username
    if (tgEligible && !appData.hasTgChatId) { setInterest8w('ask'); return }
    submitInterest8w()
  }

  async function submitInterest8w(tgUsername?: string) {
    setInterest8w('sending')
    await fetch('/api/package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'interest_8w_group', telegram_username: tgUsername || undefined }),
    }).catch(() => {})
    setInterest8w('done')
  }

  const handleLangChange = (l: Lang) => {
    setUiLang(l)
    if (token) fetch('/api/package', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, communication_lang: l }) }).catch(() => {})
  }

  const handleGradeChange = (key: string) => {
    const next = selectedGrade === key ? '' : key
    setSelectedGrade(next)
    if (token && next) fetch('/api/package', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, grade: next }) }).catch(() => {})
  }

  if (status === 'loading') return <PageShell uiLang={uiLang} onLangChange={setUiLang}><p className="text-gray-500">{T.en.loading}</p></PageShell>
  if (status === 'invalid') return <PageShell uiLang={uiLang} onLangChange={setUiLang}><ErrorCard msg={T.en.invalidToken} /></PageShell>
  if (status === 'done') return (
    <PageShell uiLang={uiLang} onLangChange={handleLangChange}>
      <SuccessCard msg={t.success} />
      {tgEligible && <TgBlock t={t} botUsername={BOT} />}
    </PageShell>
  )

  return (
    <PageShell uiLang={uiLang} onLangChange={handleLangChange}>
      <div className="w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t.title(appData!.name)}
        </h1>
        <p className="text-gray-500 mb-6 text-sm">{t.subtitle}</p>

        {/* Pending invoice banner */}
        {hasPendingInvoice && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
            {t.invoicePending}
          </div>
        )}

        {/* Row 1: Course + Teaching language */}
        <div className="mb-5 flex flex-wrap items-end gap-6">
          <div>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">{t.course}</p>
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-2">
                {LANG_SUBJECTS.map(s => (
                  <button key={s} onClick={() => setSelectedSubject(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedSubject === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    {t.courseLabels[s] ?? s}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {OTHER_SUBJECTS.map(s => (
                  <button key={s} onClick={() => setSelectedSubject(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedSubject === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    {t.courseLabels[s] ?? s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">{t.teachingLang}</p>
            <select
              value={selectedLearningLang}
              onChange={e => {
                const v = e.target.value as TeachingLang
                if (availableLangs.includes(v)) setSelectedLearningLang(v)
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {(['en', 'et', 'ru', 'ky'] as TeachingLang[]).map(l => (
                <option key={l} value={l} disabled={!availableLangs.includes(l)}>
                  {t.langLabels[l]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grade + Level side by side */}
        <div className="mb-8 flex flex-wrap gap-8 items-start">
          {/* School grades */}
          <div>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">{t.gradeSection}</p>
            <div className="flex flex-wrap gap-1.5">
              {SCHOOL_GRADES.map(key => {
                const avail = availableGradesPkg.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => avail && handleGradeChange(key)}
                    disabled={!avail}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      !avail
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        : selectedGrade === key
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {GRADE_LABELS_PKG[uiLang][key]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* CEFR levels — language courses only */}
          {LANG_SUBJECT_SET.has(selectedSubject) && (
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">{t.levelSection}</p>
              <div className="flex gap-1.5">
                {CEFR_GRADES.map(key => {
                  const avail = availableGradesPkg.includes(key)
                  return (
                    <button
                      key={key}
                      onClick={() => avail && handleGradeChange(key)}
                      disabled={!avail}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        !avail
                          ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                          : selectedGrade === key
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {key}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Format selector */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">{t.format}</p>
          <div className={`grid gap-3 grid-cols-${getAvailableFormats(selectedSubject).length}`}>
            {(Object.keys(FORMAT_INFO) as Format[]).filter(f => getAvailableFormats(selectedSubject).includes(f)).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  format === f ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900 text-sm">{FORMAT_INFO[f][uiLang].label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{FORMAT_INFO[f][uiLang].students}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Package selector */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">{t.package}</p>
          <div className={`grid gap-3 ${LESSONS_OPTIONS[format].length === 1 ? 'grid-cols-2' : LESSONS_OPTIONS[format].length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {LESSONS_OPTIONS[format].map(n => {
              const price = BASE_PRICES[format][n]
              const isSelected = lessons === n
              const isPopular = format !== 'group' && n === 8
              return (
                <button
                  key={n}
                  onClick={() => setLessons(n)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-2 left-3 text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                      {t.popular}
                    </span>
                  )}
                  <p className="font-semibold text-gray-900 text-sm">{format === 'group' ? t.weeks(n) : t.lessons(n)}</p>
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

            {/* Group 8w — coming soon */}
            {format === 'group' && (
              <div className="relative p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-left">
                <span className="absolute -top-2 left-3 text-[10px] font-bold bg-gray-400 text-white px-2 py-0.5 rounded-full">
                  {t.comingSoon}
                </span>
                <p className="font-semibold text-gray-400 text-sm">{t.weeks(8)}</p>
                <p className="text-base font-bold text-gray-300 mt-1">—</p>

                {interest8w === 'done' ? (
                  <p className="mt-2 text-[11px] text-green-600 font-medium">{t.interestedSent}</p>
                ) : interest8w === 'ask' ? (
                  <div className="mt-2 space-y-1.5">
                    {tgEligible ? (
                      <>
                        <input
                          value={tgUsernameInput}
                          onChange={e => setTgUsernameInput(e.target.value)}
                          placeholder="@username"
                          className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => submitInterest8w(tgUsernameInput || undefined)}
                            className="text-[11px] font-semibold text-blue-500 hover:text-blue-600"
                          >
                            {t.interested}
                          </button>
                          <span className="text-gray-300 text-[11px]">·</span>
                          <button
                            onClick={() => submitInterest8w()}
                            className="text-[11px] text-gray-400 hover:text-gray-600"
                          >
                            {t.notifyByEmail}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-gray-500">{t.notifyByEmail}</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleInterest8wClick}
                    disabled={interest8w === 'sending'}
                    className="mt-2 text-[11px] font-semibold text-blue-500 hover:text-blue-600 disabled:text-gray-400 transition-colors"
                  >
                    {interest8w === 'sending' ? '...' : t.interested}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Total + CTA */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between mb-4">
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

        {tgEligible && <TgBlock t={t} botUsername={BOT} />}

        <p className="text-xs text-gray-400 text-center mt-4">{t.personalLink}</p>
      </div>
    </PageShell>
  )
}

function TgBlock({ t, botUsername }: { t: typeof T['en']; botUsername: string }) {
  return (
    <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3 mb-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center mt-0.5">
        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sky-800 mb-1">{t.tgTitle}</p>
        <p className="text-xs text-sky-700 mb-3">{t.tgDesc}</p>
        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {t.tgCta}
        </a>
      </div>
    </div>
  )
}

function LangSwitcher({ current, onChange }: { current: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
      {(['en', 'et', 'ru'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase transition-all ${
            current === l ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function PageShell({ children, uiLang, onLangChange }: {
  children: React.ReactNode
  uiLang: Lang
  onLangChange: (l: Lang) => void
}) {
  return (
    <div className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a href="https://serfory.eu" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Serfory" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold text-blue-600">Serfory</span>
          </a>
          <LangSwitcher current={uiLang} onChange={onLangChange} />
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
    <div className="bg-white rounded-xl border border-green-200 p-6 text-center mb-4">
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
