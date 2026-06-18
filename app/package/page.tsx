'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import TimezoneSelect from '@/components/TimezoneSelect'
import GroupInterestModal from '@/components/booking/GroupInterestModal'

type Format = 'individual' | 'pair' | 'group' | 'premade'
type LessonsCount = 1 | 4 | 6 | 7 | 8 | 12
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
  premade: {
    en: { label: 'Structured course', students: '3–6 students' },
    et: { label: 'Struktureeritud kursus', students: '3–6 õpilast' },
    ru: { label: 'Готовый курс', students: '3–6 учеников' },
  },
}

const BASE_PRICES: Record<Format, Partial<Record<LessonsCount, number>>> = {
  individual: { 1: 26, 4: 25, 8: 24, 12: 23 },
  pair:       { 1: 21, 4: 20, 8: 19, 12: 18 },
  group:      { 4: 15 },
  premade:    { 6: 18, 7: 18 },
}


const LESSONS_OPTIONS: Record<Format, LessonsCount[]> = {
  individual: [1, 4, 8, 12],
  pair: [1, 4, 8],
  group: [4],
  premade: [6, 7],
}
const FORMAT_ORDER: Format[] = ['individual', 'group', 'premade']

const DAYS: Record<Lang, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  et: ['Pühapäev', 'Esmaspäev', 'Teisipäev', 'Kolmapäev', 'Neljapäev', 'Reede', 'Laupäev'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
}

const LANG_SUBJECTS = ['Russian', 'English', 'Estonian', 'Spanish', 'Kyrgyz'] as const
const OTHER_SUBJECTS = ['Math', 'Chemistry', 'Physics'] as const
const VALID_SUBJECTS = [...LANG_SUBJECTS, ...OTHER_SUBJECTS] as const
type Subject = typeof VALID_SUBJECTS[number]
const LANG_SUBJECT_SET = new Set<Subject>(['Russian', 'English', 'Estonian', 'Spanish', 'Kyrgyz'])

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
    personalLink: 'This link is personal. Do not share it.',
    tgTitle: 'Get updates on Telegram',
    tgDesc: 'Receive lesson reminders and messages from your teacher directly on Telegram.',
    tgCta: 'Connect to bot',
    invoicePending: 'You have a pending invoice. You can still select a new package.',
    yourPackages: 'Your packages',
    lessonsToBook: (n: number) => n === 1 ? '1 lesson to book' : `${n} lessons to book`,
    readyToEnroll: 'Ready to enroll',
    invoicePendingLabel: 'Invoice pending',
    availableCourses: 'Available courses',
    comingSoon: 'Coming soon',
    interested: "I'm interested",
    interestedSent: 'Noted! We\'ll let you know.',
    notifyByEmail: 'Notify me by email',
    weeks: (n: number) => `${n} weeks`,
    yourOrder: 'Your order',
    invoiceNote: 'Invoice sent to your email',
    availableSessions: 'Available sessions',
    spotsLeft: (n: number) => n === 1 ? '1 spot left' : `${n} spots left`,
    sessions: 'sessions',
    minAbbr: 'min',
    vsIndividual: 'vs individual',
    tooManyPending: 'You already have 3 unpaid invoices. Please pay the existing ones first.',
    errorGeneric: 'Something went wrong. Please try again.',
    wrongLang: 'Wrong language',
    wrongLevel: 'Wrong level',
    selectGradeHint: 'Select a grade or level to continue.',
    groupInterestText: "Can't find a group that fits?",
    groupInterestCta: 'Request one',
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
    personalLink: 'See link on isiklik. Ära jaga seda.',
    tgTitle: 'Saa uuendusi Telegrami kaudu',
    tgDesc: 'Tunnimuistutused ja õpetaja sõnumid otse Telegrami.',
    tgCta: 'Ühenda botiga',
    invoicePending: 'Sul on ootel arve. Saad siiski uue paketi valida.',
    yourPackages: 'Sinu paketid',
    lessonsToBook: (n: number) => n === 1 ? '1 tund broneerida' : `${n} tundi broneerida`,
    readyToEnroll: 'Valmis registreeruma',
    invoicePendingLabel: 'Arve ootel',
    availableCourses: 'Saadaolevad kursused',
    comingSoon: 'Tulemas',
    interested: 'Olen huvitatud',
    interestedSent: 'Märgitud! Anname teada.',
    notifyByEmail: 'Teavita mind e-postiga',
    weeks: (n: number) => `${n} nädalat`,
    yourOrder: 'Sinu tellimus',
    invoiceNote: 'Arve saadetakse e-postile',
    availableSessions: 'Saadaolevad sessioonid',
    spotsLeft: (n: number) => n === 1 ? '1 koht vaba' : `${n} kohta vaba`,
    sessions: 'sessiooni',
    minAbbr: 'min',
    vsIndividual: 'vs individuaalne',
    tooManyPending: 'Sul on juba 3 tasumata arvet. Maksa esmalt olemasolevad.',
    errorGeneric: 'Midagi läks valesti. Palun proovi uuesti.',
    wrongLang: 'Vale keel',
    wrongLevel: 'Vale tase',
    selectGradeHint: 'Jätkamiseks vali klass või tase.',
    groupInterestText: 'Ei leia sobivat gruppi?',
    groupInterestCta: 'Taotle',
  },
  ru: {
    loading: 'Загрузка...',
    invalidToken: 'Эта ссылка недействительна или уже использована.',
    alreadySent: 'Счёт для этой заявки уже был отправлен.',
    paid: 'Оплата получена. Проверьте почту: там ссылка для бронирования.',
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
    personalLink: 'Эта ссылка персональная. Не передавайте её.',
    tgTitle: 'Получайте уведомления в Telegram',
    tgDesc: 'Напоминания об уроках и сообщения от учителя прямо в Telegram.',
    tgCta: 'Подключить бота',
    invoicePending: 'У вас есть неоплаченный счёт. Вы всё равно можете выбрать новый пакет.',
    yourPackages: 'Ваши пакеты',
    lessonsToBook: (n: number) => n === 1 ? '1 урок к бронированию' : `${n} уроков к бронированию`,
    readyToEnroll: 'Готово к записи',
    invoicePendingLabel: 'Счёт не оплачен',
    availableCourses: 'Доступные курсы',
    comingSoon: 'Скоро',
    interested: 'Интересует',
    interestedSent: 'Записали! Сообщим вам.',
    notifyByEmail: 'Уведомить по email',
    weeks: (n: number) => `${n} недель`,
    yourOrder: 'Ваш заказ',
    invoiceNote: 'Счёт будет отправлен на email',
    availableSessions: 'Доступные занятия',
    spotsLeft: (n: number) => `Мест: ${n}`,
    sessions: 'занятий',
    minAbbr: 'мин',
    vsIndividual: 'vs индивидуально',
    tooManyPending: 'У вас уже 3 неоплаченных счёта. Сначала оплатите существующие.',
    errorGeneric: 'Что-то пошло не так. Попробуйте снова.',
    wrongLang: 'Другой язык',
    wrongLevel: 'Другой уровень',
    selectGradeHint: 'Выберите класс или уровень, чтобы продолжить.',
    groupInterestText: 'Не нашли подходящую группу?',
    groupInterestCta: 'Запросить',
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

function getBrowserTz(): string { return Intl.DateTimeFormat().resolvedOptions().timeZone }
function getTzAbbr(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? tz
}
function fmtSessionUtc(utcIso: string, locale: string, tz?: string): { date: string; time: string; tzAbbr: string } {
  const zone = tz ?? getBrowserTz()
  const d = new Date(utcIso)
  return {
    date: d.toLocaleDateString(locale, { timeZone: zone, day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false }),
    tzAbbr: getTzAbbr(d, zone),
  }
}

function isDeadlinePassed(session1: { session_start_utc: string | null; session_date: string; start_time: string }, tz: string): boolean {
  const now = new Date()
  const s1 = session1.session_start_utc
    ? new Date(session1.session_start_utc)
    : new Date(`${session1.session_date}T${session1.start_time}`)
  if (s1 <= now) return true
  const localHour = parseInt(
    new Intl.DateTimeFormat('en', { timeZone: tz, hour: 'numeric', hour12: false }).format(s1), 10
  )
  const deadline = localHour >= 17
    ? new Date(s1.getTime() - (localHour - 9) * 3600000)
    : new Date(s1.getTime() - (localHour + 1) * 3600000)
  return now > deadline
}

function PackagePageInner() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  type InvoiceInfo = {
    id: string; invoice_number: number; format: string; subject: string | null
    lessons_count: number; total_amount: number; status: 'sent' | 'paid'
    created_at: string; lessonsUsed: number | null; hasBookingToken: boolean
    booking_token: string | null
  }

  const [appData, setAppData] = useState<{
    name: string; subject: string; grade: string | null; lang: Lang
    learning_lang: string | null; country_code: string | null
    hasTgChatId: boolean; telegram_username: string | null
    tierMultiplier: number
  } | null>(null)
  const [invoiceList, setInvoiceList] = useState<InvoiceInfo[]>([])
  const [status, setStatus] = useState<'loading' | 'invalid' | 'alreadySent' | 'paid' | 'ready' | 'sending' | 'done'>('loading')
  const [uiLang, setUiLang] = useState<Lang>('en')
  const [selectedTz, setSelectedTz] = useState<string>(() => getBrowserTz())

  const [selectedSubject, setSelectedSubject] = useState<Subject>('Russian')
  const [selectedLearningLang, setSelectedLearningLang] = useState<TeachingLang>('en')
  const [availableLangs, setAvailableLangs] = useState<TeachingLang[]>(['en', 'et', 'ru', 'ky'])

  type TeacherMeta = {
    id?: string
    name?: string
    subjects?: string[]
    teaching_languages?: string[]
    subject_levels?: Record<string, string[]> | null
    subject_formats?: Record<string, string[]> | null
  }
  type PremadeSession = { id: string; name: string; session_date: string; start_time: string; session_start_utc: string | null }
  type PremadeBatch = {
    id: string; teacher_id: string; name: string; subject: string; duration_min: number
    teaching_language: string | null; target_levels: string[]
    max_students: number; enrollment_count: number
    premade_sessions: PremadeSession[]
  }
  const [teacherCache, setTeacherCache] = useState<TeacherMeta[] | null>(null)
  useEffect(() => {
    fetch('/api/teachers')
      .then(r => r.json())
      .then(d => setTeacherCache(d.teachers ?? []))
      .catch(() => setTeacherCache([]))
  }, [])

  const [premadeBatches, setPremadeBatches] = useState<PremadeBatch[]>([])
  useEffect(() => {
    setPremadeBatches([])
    fetch(`/api/premade-batches?subject=${encodeURIComponent(selectedSubject)}`)
      .then(r => r.json())
      .then(d => setPremadeBatches(d.batches ?? []))
      .catch(() => setPremadeBatches([]))
  }, [selectedSubject])

  type GroupSession = { id: string; session_date: string; start_time: string; session_start_utc: string | null }
  type GroupBatch = {
    id: string; teacher_id: string; subject: string; teaching_language: string
    day_of_week: number; start_time: string; duration_minutes: number
    max_students: number; enrollment_count: number; group_slot_sessions: GroupSession[]
  }
  const [groupBatches, setGroupBatches] = useState<GroupBatch[]>([])
  useEffect(() => {
    setGroupBatches([])
    fetch(`/api/group-slots?subject=${encodeURIComponent(selectedSubject)}`)
      .then(r => r.json())
      .then(d => setGroupBatches(d.batches ?? []))
      .catch(() => setGroupBatches([]))
  }, [selectedSubject])

  const [availableSubjectsForLang, setAvailableSubjectsForLang] = useState<Set<Subject>>(new Set(VALID_SUBJECTS))
  useEffect(() => {
    if (!teacherCache) return
    const available = new Set<Subject>()
    for (const tc of teacherCache) {
      if (!tc.teaching_languages?.includes(selectedLearningLang)) continue
      for (const s of tc.subjects ?? []) {
        if ((VALID_SUBJECTS as readonly string[]).includes(s)) available.add(s as Subject)
      }
    }
    setAvailableSubjectsForLang(available.size > 0 ? available : new Set(VALID_SUBJECTS))
  }, [selectedLearningLang, teacherCache])

  useEffect(() => {
    if (!availableSubjectsForLang.has(selectedSubject)) {
      const first = VALID_SUBJECTS.find(s => availableSubjectsForLang.has(s))
      if (first) setSelectedSubject(first)
    }
  }, [availableSubjectsForLang])

  const [availableFormats, setAvailableFormats] = useState<Format[]>(FORMAT_ORDER)
  useEffect(() => {
    if (!teacherCache) return
    const union = new Set<string>()
    for (const tc of teacherCache) {
      if (!tc.subjects?.includes(selectedSubject)) continue
      if (!tc.teaching_languages?.includes(selectedLearningLang)) continue
      for (const f of tc.subject_formats?.[selectedSubject] ?? []) union.add(f)
    }
    // Premade: show format if any batch with non-passed deadline exists (non-matching lang shown grayed)
    const premadeAvailable = premadeBatches.some(b => {
      const s1 = b.premade_sessions[0]
      return s1 && !isDeadlinePassed(s1, selectedTz)
    })
    if (!premadeAvailable) union.delete('premade')
    // Group: only show format if a batch with matching lang AND non-passed deadline exists
    const groupAvailable = groupBatches.some(b => {
      if (b.teaching_language !== selectedLearningLang) return false
      const s1 = b.group_slot_sessions[0]
      return s1 && !isDeadlinePassed(s1, selectedTz)
    })
    if (!groupAvailable) union.delete('group')
    setAvailableFormats(union.size > 0 ? FORMAT_ORDER.filter(f => union.has(f)) : ['individual'])
  }, [selectedSubject, selectedLearningLang, teacherCache, premadeBatches, groupBatches, selectedTz])
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [availableGradesPkg, setAvailableGradesPkg] = useState<string[]>([...GRADE_KEYS_PKG])
  const [format, setFormat] = useState<Format>('individual')
  const [lessons, setLessons] = useState<LessonsCount>(8)
  const [hasPendingInvoice, setHasPendingInvoice] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showGroupInterest, setShowGroupInterest] = useState(false)
  const [interest8w, setInterest8w] = useState<'idle' | 'ask' | 'sending' | 'done'>('idle')
  const [tgUsernameInput, setTgUsernameInput] = useState('')

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    fetch(`/api/package?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setStatus('invalid'); return }
        const lang = (['en', 'et', 'ru'].includes(d.lang) ? d.lang : 'en') as Lang
        setAppData({ name: d.name, subject: d.subject, grade: d.grade ?? null, lang, learning_lang: d.learning_lang ?? null, country_code: d.country_code ?? null, hasTgChatId: !!d.hasTgChatId, telegram_username: d.telegram_username ?? null, tierMultiplier: d.tierMultiplier ?? 1.0 })
        setUiLang(lang)
        if (VALID_SUBJECTS.includes(d.subject)) setSelectedSubject(d.subject as Subject)
        if (['en', 'et', 'ru', 'ky'].includes(d.learning_lang)) setSelectedLearningLang(d.learning_lang as TeachingLang)
        if (d.grade && (GRADE_KEYS_PKG as readonly string[]).includes(d.grade)) setSelectedGrade(d.grade)
        if (d.telegram_username) setTgUsernameInput(d.telegram_username)
        if (d.invoiceAlreadySent && !d.invoicePaid) setHasPendingInvoice(true)
        if (d.invoices) setInvoiceList(d.invoices)
        setStatus('ready')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  const t = T[uiLang]

  // Premade: show all for subject (deadline filter), lang matching determines selectability
  const validPremadeBatches = premadeBatches.filter(b => {
    const s1 = b.premade_sessions[0]
    return s1 && !isDeadlinePassed(s1, selectedTz)
  })
  const filteredGroupBatches = groupBatches.filter(b => {
    const s1 = b.group_slot_sessions[0]
    const langOk = teacherCache ? !!teacherCache.find(t => t.id === b.teacher_id)?.teaching_languages?.includes(selectedLearningLang) : true
    return langOk && s1 && !isDeadlinePassed(s1, selectedTz)
  })

  const tierMultiplier = appData?.tierMultiplier ?? 1.0
  const applyTier = (base: number) => Math.ceil(base * tierMultiplier)

  const getPackPrices = (fmt: Format): number[] =>
    LESSONS_OPTIONS[fmt].reduce((acc, n, i) => {
      const raw = applyTier(BASE_PRICES[fmt][n] ?? 0)
      const price = i === 0 ? raw : Math.min(raw, acc[i - 1] - 1)
      return [...acc, Math.max(price, 1)]
    }, [] as number[])

  const pricePerLesson = (() => {
    const prices = getPackPrices(format)
    const idx = LESSONS_OPTIONS[format].indexOf(lessons)
    return idx >= 0 ? prices[idx] : applyTier(BASE_PRICES[format][lessons] ?? 0)
  })()

  const total = pricePerLesson * lessons

  const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'serforylearning_bot'
  const tgEligible = appData ? (isTgEligible(appData.country_code, selectedLearningLang) || uiLang === 'ru') : false

  // Reset format when switching subject (DB-driven)
  useEffect(() => {
    if (!availableFormats.includes(format)) setFormat('individual')
  }, [availableFormats])

  // Reset lessons when format changes (e.g. premade only has 6/7)
  useEffect(() => {
    const opts = LESSONS_OPTIONS[format]
    if (!opts.includes(lessons)) setLessons(opts.includes(8) ? 8 : opts[0])
  }, [format])

  // Compute available grades from cache (no per-switch fetch)
  useEffect(() => {
    if (!teacherCache) return
    const union = new Set<string>()
    for (const t of teacherCache) {
      if (!t.subjects?.includes(selectedSubject)) continue
      if (!t.teaching_languages?.includes(selectedLearningLang)) continue
      for (const lvl of t.subject_levels?.[selectedSubject] ?? []) union.add(lvl)
    }
    setAvailableGradesPkg(union.size > 0 ? GRADE_KEYS_PKG.filter(k => union.has(k)) : [...GRADE_KEYS_PKG])
  }, [selectedSubject, selectedLearningLang, teacherCache])

  useEffect(() => {
    if (selectedGrade && !availableGradesPkg.includes(selectedGrade)) setSelectedGrade('')
  }, [availableGradesPkg])

  // Compute available teaching languages globally (across all subjects)
  useEffect(() => {
    if (!teacherCache) return
    const langs = new Set<TeachingLang>()
    for (const t of teacherCache) {
      for (const l of t.teaching_languages ?? []) langs.add(l as TeachingLang)
    }
    const available = (['en', 'et', 'ru', 'ky'] as TeachingLang[]).filter(l => langs.has(l))
    setAvailableLangs(available.length > 0 ? available : ['en', 'et', 'ru', 'ky'])
  }, [teacherCache])

  async function handleConfirm() {
    setStatus('sending')
    setErrorMsg(null)
    const body = { token, format, lessons_count: lessons, subject: selectedSubject, learning_lang: selectedLearningLang }
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setStatus('done')
    } else {
      const data = await res.json().catch(() => ({}))
      setStatus('ready')
      setErrorMsg(res.status === 429 ? t.tooManyPending : (data.error || t.errorGeneric))
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
    <PageShell uiLang={uiLang} onLangChange={handleLangChange} timezone={selectedTz} onTimezoneChange={setSelectedTz}>
      {showGroupInterest && token && (
        <GroupInterestModal
          onClose={() => setShowGroupInterest(false)}
          defaultSubject={selectedSubject}
          defaultLang={selectedLearningLang}
          uiLang={uiLang}
          refToken={token}
        />
      )}
      <div className="w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title(appData!.name)}</h1>
        <p className="text-gray-500 mb-6 text-sm">{t.subtitle}</p>

        {(() => {
          const sentInvs = invoiceList.filter(inv => inv.status === 'sent')
          const paidInvs = invoiceList.filter(inv => {
            if (inv.status !== 'paid') return false
            if (inv.format === 'individual' || inv.format === 'pair') return (inv.lessonsUsed ?? 0) < inv.lessons_count
            return inv.hasBookingToken
          })
          if (sentInvs.length === 0 && paidInvs.length === 0) return null

          // Group paid by format
          const paidByFmt = new Map<string, InvoiceInfo[]>()
          for (const inv of paidInvs) {
            if (!paidByFmt.has(inv.format)) paidByFmt.set(inv.format, [])
            paidByFmt.get(inv.format)!.push(inv)
          }
          const fmtOrder = ['individual', 'pair', 'group', 'premade']
          const paidGroups = fmtOrder.filter(f => paidByFmt.has(f)).map(f => ({ fmt: f, invs: paidByFmt.get(f)! }))

          return (
            <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">{t.yourPackages}</p>
              <div className="space-y-2">
                {/* Paid - 1 row per format, chips per invoice */}
                {paidGroups.map(({ fmt, invs }) => {
                  const fmtInfo = FORMAT_INFO[fmt as Format]
                  const formatLabel = fmtInfo ? fmtInfo[uiLang].label : fmt
                  return (
                    <div key={fmt} className="flex items-start gap-2 min-w-0">
                      <span className="shrink-0 text-xs font-semibold text-gray-500 pt-0.5 min-w-[80px]">{formatLabel}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {invs.map(inv => {
                          const dateStr = new Date(inv.created_at).toLocaleDateString(
                            uiLang === 'et' ? 'et-EE' : uiLang === 'ru' ? 'ru-RU' : 'en-GB',
                            { day: 'numeric', month: 'short' }
                          )
                          const subjectLabel = inv.subject ?? appData?.subject ?? ''
                          const remaining = (fmt === 'individual' || fmt === 'pair')
                            ? inv.lessons_count - (inv.lessonsUsed ?? 0)
                            : null
                          const label = remaining !== null
                            ? `${subjectLabel} · ${remaining}/${inv.lessons_count} · ${dateStr}`
                            : `${subjectLabel} · ${dateStr}`
                          if (inv.booking_token) {
                            return (
                              <a key={inv.id} href={`/booking?session=${inv.booking_token}`}
                                className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-colors">
                                {label}
                              </a>
                            )
                          }
                          return (
                            <span key={inv.id} className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-100">
                              {label}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {/* Sent - 1 row per invoice */}
                {sentInvs.map(inv => {
                  const fmtInfo = FORMAT_INFO[inv.format as Format]
                  const formatLabel = fmtInfo ? fmtInfo[uiLang].label : inv.format
                  const dateStr = new Date(inv.created_at).toLocaleDateString(
                    uiLang === 'et' ? 'et-EE' : uiLang === 'ru' ? 'ru-RU' : 'en-GB',
                    { day: 'numeric', month: 'short' }
                  )
                  return (
                    <div key={inv.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {t.invoicePendingLabel}
                        </span>
                        <span className="text-sm text-gray-700 truncate">{formatLabel} · {inv.total_amount}€</span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">#{inv.invoice_number} · {dateStr}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        <div className="flex gap-6 items-start">
          {/* Left panel */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Card 1: Course + Teaching lang + Grade + Level */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-start gap-8">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">{t.course}</p>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-2">
                      {LANG_SUBJECTS.map(s => {
                        const avail = availableSubjectsForLang.has(s)
                        return (
                          <button key={s} onClick={() => avail && setSelectedSubject(s)} disabled={!avail}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                              !avail ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : selectedSubject === s ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}>
                            {t.courseLabels[s] ?? s}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {OTHER_SUBJECTS.map(s => {
                        const avail = availableSubjectsForLang.has(s)
                        return (
                          <button key={s} onClick={() => avail && setSelectedSubject(s)} disabled={!avail}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                              !avail ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : selectedSubject === s ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}>
                            {t.courseLabels[s] ?? s}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">{t.teachingLang}</p>
                  <select
                    value={selectedLearningLang}
                    onChange={e => setSelectedLearningLang(e.target.value as TeachingLang)}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {(['en', 'et', 'ru', 'ky'] as TeachingLang[]).map(l => (
                      <option key={l} value={l} disabled={!availableLangs.includes(l)}>{t.langLabels[l]}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Grade + Level */}
              <div className="flex flex-wrap items-start gap-x-8 gap-y-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">{t.gradeSection}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SCHOOL_GRADES.map(key => {
                      const avail = availableGradesPkg.includes(key)
                      return (
                        <button key={key} onClick={() => avail && handleGradeChange(key)} disabled={!avail}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            !avail ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            : selectedGrade === key ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                          }`}>
                          {GRADE_LABELS_PKG[uiLang][key]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {LANG_SUBJECT_SET.has(selectedSubject) && (
                  <div>
                    <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">{t.levelSection}</p>
                    <div className="flex gap-1.5">
                      {CEFR_GRADES.map(key => {
                        const avail = availableGradesPkg.includes(key)
                        return (
                          <button key={key} onClick={() => avail && handleGradeChange(key)} disabled={!avail}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              !avail ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : selectedGrade === key ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}>
                            {key}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Format + Package */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-3">{t.format}</p>
              <div className={`grid gap-3 grid-cols-${availableFormats.length}`}>
                {(() => {
                  const indivPack1 = getPackPrices('individual')[0]
                  return FORMAT_ORDER.filter(f => availableFormats.includes(f)).map(f => {
                    const fPrice = f === 'group' ? getPackPrices('group')[0]
                      : f === 'premade' ? getPackPrices('premade')[0]
                      : indivPack1
                    const discountVs1on1 = f !== 'individual' && indivPack1 > 0
                      ? Math.round((1 - fPrice / indivPack1) * 100)
                      : 0
                    return (
                      <button key={f} onClick={() => setFormat(f)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${format === f ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <p className="font-semibold text-gray-900 text-sm">{FORMAT_INFO[f][uiLang].label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{FORMAT_INFO[f][uiLang].students}</p>
                        {discountVs1on1 > 0 && <p className="text-xs text-green-600 font-semibold mt-1">-{discountVs1on1}% {t.vsIndividual}</p>}
                      </button>
                    )
                  })
                })()}
              </div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mt-6 mb-3">{t.package}</p>
              {format === 'premade' ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t.availableCourses}</p>
                  {validPremadeBatches.length === 0 && (
                    <p className="text-xs text-gray-400">{t.comingSoon}</p>
                  )}
                  {validPremadeBatches.map(batch => {
                    const fmtDate = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    const spotsLeft = batch.max_students - batch.enrollment_count
                    const teacherName = teacherCache?.find(tc => tc.id === batch.teacher_id)?.name
                    const langMatches = batch.teaching_language === selectedLearningLang
                    const levelMatches = !selectedGrade || (batch.target_levels ?? []).includes(selectedGrade)
                    const isClickable = langMatches && levelMatches
                    return (
                      <div
                        key={batch.id}
                        className={`w-full p-4 rounded-xl border text-left ${
                          isClickable
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-100 bg-gray-50 opacity-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-semibold text-sm ${isClickable ? 'text-gray-900' : 'text-gray-400'}`}>{batch.name}</p>
                              {!langMatches && batch.teaching_language && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 font-medium uppercase">{batch.teaching_language} · {t.wrongLang}</span>
                              )}
                              {langMatches && !levelMatches && selectedGrade && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">{(batch.target_levels ?? []).join(', ')} · {t.wrongLevel}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{batch.premade_sessions.length} {t.sessions} · {batch.duration_min}{t.minAbbr}{teacherName ? ` · ${teacherName}` : ''}</p>
                            <div className="mt-2 space-y-0.5">
                              {batch.premade_sessions.map((s, i) => {
                                const locale = uiLang === 'et' ? 'et-EE' : uiLang === 'ru' ? 'ru-RU' : 'en-GB'
                                const fmt = s.session_start_utc ? fmtSessionUtc(s.session_start_utc, locale, selectedTz) : null
                                return (
                                  <p key={s.id} className="text-xs text-gray-400">
                                    {i + 1}. {s.name} · {fmt ? <>{fmt.date} {fmt.time} <span className="text-gray-300">{fmt.tzAbbr}</span></> : <>{fmtDate(s.session_date)} {s.start_time.slice(0, 5)}</>}
                                  </p>
                                )
                              })}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-bold text-base ${isClickable ? 'text-gray-900' : 'text-gray-400'}`}>{applyTier(batch.premade_sessions.length * 18)}€</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{t.spotsLeft(spotsLeft)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : format === 'group' ? (
              <div className="flex gap-4 items-start">
                {/* Package options - left column */}
                <div className="flex flex-col gap-3 w-[160px] shrink-0">
                  {LESSONS_OPTIONS[format].map(n => {
                    const price = applyTier(BASE_PRICES[format][n] ?? 0)
                    const isSelected = lessons === n
                    return (
                      <button key={n} onClick={() => setLessons(n)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <p className="font-semibold text-gray-900 text-sm">{t.weeks(n)}</p>
                        <p className="text-base font-bold text-gray-900 mt-1">{price}€</p>
                        <p className="text-[10px] text-gray-400">{t.perLesson} · {t.perPerson}</p>
                      </button>
                    )
                  })}
                  <div className="relative p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-left">
                    <span className="absolute -top-2 left-3 text-[10px] font-bold bg-gray-400 text-white px-2 py-0.5 rounded-full">{t.comingSoon}</span>
                    <p className="font-semibold text-gray-400 text-sm">{t.weeks(8)}</p>
                    <p className="text-base font-bold text-gray-300 mt-1">-</p>
                    {interest8w === 'done' ? (
                      <p className="mt-2 text-[11px] text-green-600 font-medium">{t.interestedSent}</p>
                    ) : interest8w === 'ask' ? (
                      <div className="mt-2 space-y-1.5">
                        {tgEligible ? (
                          <>
                            <input value={tgUsernameInput} onChange={e => setTgUsernameInput(e.target.value)}
                              placeholder="@username"
                              className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1 outline-none focus:border-blue-400" />
                            <div className="flex gap-1.5">
                              <button onClick={() => submitInterest8w(tgUsernameInput || undefined)}
                                className="text-[11px] font-semibold text-blue-500 hover:text-blue-600">{t.interested}</button>
                              <span className="text-gray-300 text-[11px]">·</span>
                              <button onClick={() => submitInterest8w()}
                                className="text-[11px] text-gray-400 hover:text-gray-600">{t.notifyByEmail}</button>
                            </div>
                          </>
                        ) : (
                          <p className="text-[11px] text-gray-500">{t.notifyByEmail}</p>
                        )}
                      </div>
                    ) : (
                      <button onClick={handleInterest8wClick} disabled={interest8w === 'sending'}
                        className="mt-2 text-[11px] font-semibold text-blue-500 hover:text-blue-600 disabled:text-gray-400 transition-colors">
                        {interest8w === 'sending' ? '...' : t.interested}
                      </button>
                    )}
                  </div>
                </div>
                {/* Available sessions - right column */}
                {filteredGroupBatches.length > 0 && (
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t.availableSessions}</p>
                    {filteredGroupBatches.map(b => {
                      const fmtDate = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      const spotsLeft = b.max_students - b.enrollment_count
                      const teacherName = teacherCache?.find(tc => tc.id === b.teacher_id)?.name
                      return (
                        <div key={b.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm">
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              {(() => {
                                const locale = uiLang === 'et' ? 'et-EE' : uiLang === 'ru' ? 'ru-RU' : 'en-GB'
                                const firstUtc = b.group_slot_sessions[0]?.session_start_utc
                                const fmt = firstUtc ? fmtSessionUtc(firstUtc, locale, selectedTz) : null
                                return (
                                  <p className="font-medium text-gray-800 text-sm">
                                    {DAYS[uiLang][b.day_of_week]} · {fmt ? <>{fmt.time} <span className="text-gray-400 font-normal text-xs">{fmt.tzAbbr}</span></> : b.start_time.slice(0, 5)} · {b.duration_minutes}{t.minAbbr}
                                  </p>
                                )
                              })()}
                              {teacherName && <p className="text-xs text-blue-500 font-medium mt-0.5">{teacherName}</p>}
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                                {b.group_slot_sessions.map(s => {
                                  const locale = uiLang === 'et' ? 'et-EE' : uiLang === 'ru' ? 'ru-RU' : 'en-GB'
                                  const fmt = s.session_start_utc ? fmtSessionUtc(s.session_start_utc, locale, selectedTz) : null
                                  return (
                                    <span key={s.id} className="text-xs text-gray-400">
                                      {fmt ? <>{fmt.date} {fmt.time} <span className="text-gray-300">{fmt.tzAbbr}</span></> : fmtDate(s.session_date)}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 shrink-0">{t.spotsLeft(spotsLeft)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              ) : (
              <div className={`grid gap-3 ${
                LESSONS_OPTIONS[format].length <= 2 ? 'grid-cols-2'
                : LESSONS_OPTIONS[format].length === 3 ? 'grid-cols-3'
                : 'grid-cols-4'
              }`}>
                {(() => {
                  const packPrices = getPackPrices(format)
                  const price1 = packPrices[0]
                  return LESSONS_OPTIONS[format].map((n, i) => {
                    const price = packPrices[i]
                    const isSelected = lessons === n
                    const isPopular = format === 'individual' && n === 8
                    const discount = format === 'individual' && price1 > 0 && price < price1
                      ? Math.round((1 - price / price1) * 100)
                      : 0
                    return (
                      <button key={n} onClick={() => setLessons(n)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        {isPopular && (
                          <span className="absolute -top-2 left-3 text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">{t.popular}</span>
                        )}
                        <p className="font-semibold text-gray-900 text-sm">{t.lessons(n)}</p>
                        {discount > 0 && <p className="text-xs text-green-600 font-medium mt-0.5">-{discount}%</p>}
                        <p className="text-base font-bold text-gray-900 mt-1">{price}€</p>
                        <p className="text-[10px] text-gray-400">{t.perLesson}{format !== 'individual' ? ` · ${t.perPerson}` : ''}</p>
                      </button>
                    )
                  })
                })()}
              </div>
              )}

              {/* G1: group interest trigger */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs text-gray-400">{t.groupInterestText}</span>
                <button
                  type="button"
                  onClick={() => setShowGroupInterest(true)}
                  className="text-xs text-blue-500 hover:text-blue-700 font-semibold underline underline-offset-2 transition-colors"
                >
                  {t.groupInterestCta}
                </button>
              </div>
            </div>

          </div>

          {/* Right sidebar - sticky order summary */}
          <div className="w-72 shrink-0 sticky top-8 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.yourOrder}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.course}</span>
                  <span className="font-medium text-gray-800">{t.courseLabels[selectedSubject] ?? selectedSubject}</span>
                </div>
                {selectedGrade && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{CEFR_GRADES.includes(selectedGrade as GradeKeyPkg) ? t.levelSection : t.gradeSection}</span>
                    <span className="font-medium text-gray-800">{GRADE_LABELS_PKG[uiLang][selectedGrade as GradeKeyPkg]}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.format}</span>
                  <span className="font-medium text-gray-800">{FORMAT_INFO[format][uiLang].label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.package}</span>
                  <span className="font-medium text-gray-800">{format === 'group' ? t.weeks(lessons) : t.lessons(lessons)}</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                <span className="text-xs text-gray-500">{t.total}</span>
                <span className="text-xl font-bold text-gray-900">{total > 0 ? `${total}€` : '-'}</span>
              </div>
              <button onClick={handleConfirm} disabled={status === 'sending' || !selectedGrade}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors">
                {status === 'sending' ? t.sending : t.confirm}
              </button>
              {!selectedGrade && <p className="text-xs text-amber-600 text-center leading-snug">{t.selectGradeHint}</p>}
              {errorMsg && <p className="text-xs text-red-600 text-center leading-snug">{errorMsg}</p>}
              <p className="text-[10px] text-center text-gray-400">{t.invoiceNote}</p>
              <div className="border-t border-gray-100 pt-3 flex items-start gap-1.5">
                <svg className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                </svg>
                <p className="text-[10px] text-gray-400 leading-snug">{t.personalLink}</p>
              </div>
            </div>
            {tgEligible && <TgBlock t={t} botUsername={BOT} />}
          </div>
        </div>
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

function PageShell({ children, uiLang, onLangChange, timezone, onTimezoneChange }: {
  children: React.ReactNode
  uiLang: Lang
  onLangChange: (l: Lang) => void
  timezone?: string
  onTimezoneChange?: (tz: string) => void
}) {
  return (
    <div className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a href="https://serfory.eu" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Serfory" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold text-blue-600">Serfory</span>
          </a>
          <div className="flex items-center gap-3">
            {timezone && onTimezoneChange && (
              <div className="bg-white border border-gray-200 rounded-lg px-2.5 py-1">
                <TimezoneSelect value={timezone} onChange={onTimezoneChange} />
              </div>
            )}
            <LangSwitcher current={uiLang} onChange={onLangChange} />
          </div>
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
