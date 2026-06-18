import nodemailer from 'nodemailer'

const TG_ELIGIBLE_COUNTRIES = new Set([
  // CIS
  'RU','BY','UA','KZ','KG','TJ','TM','UZ','AZ','AM','GE','MD',
  // Baltic
  'EE','LV','LT',
  // Eastern Europe
  'PL','RO','BG','RS','HU','CZ','SK','HR','BA','ME','MK','AL',
])

export function isTelegramEligible(countryCode: string | null | undefined, learningLang: string | null | undefined): boolean {
  if (learningLang === 'ru' || learningLang === 'ky') return true
  if (countryCode && TG_ELIGIBLE_COUNTRIES.has(countryCode.toUpperCase())) return true
  return false
}

const transporter = nodemailer.createTransport({
  host: process.env.OVH_SMTP_HOST,
  port: Number(process.env.OVH_SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.OVH_SMTP_USER,
    pass: process.env.OVH_SMTP_PASS,
  },
})

const BOOKING_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://booking.serfory.eu'

const MESSAGES = {
  en: {
    subject: 'Your Serfory application has been accepted!',
    body: (name: string, link: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Welcome to Serfory, ${name}! 🎉</h2>
        <p style="color:#6b7280;margin-bottom:24px">Your application has been reviewed and accepted. You can now book your first lesson.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Book my first lesson →</a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">This link is personal. Do not share it.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
    botCtaStudent: (botLink: string) =>
      `<div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:10px;border:1px solid #bae6fd">
        <p style="margin:0 0 10px;font-size:13px;color:#0369a1;font-weight:600">📱 Receive updates on Telegram</p>
        <p style="margin:0 0 12px;font-size:13px;color:#374151">Get lesson reminders, payment notifications, and messages from your teacher directly on Telegram.</p>
        <a href="${botLink}" style="display:inline-block;background:#0ea5e9;color:#fff;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none">Connect on Telegram →</a>
      </div>`,
    botCtaParent: (botLink: string) =>
      `<div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:10px;border:1px solid #bae6fd">
        <p style="margin:0 0 10px;font-size:13px;color:#0369a1;font-weight:600">📱 Follow your child's lessons on Telegram</p>
        <p style="margin:0 0 12px;font-size:13px;color:#374151">Receive lesson reminders, payment notifications and updates about your child directly on Telegram.</p>
        <a href="${botLink}" style="display:inline-block;background:#0ea5e9;color:#fff;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none">Connect on Telegram →</a>
      </div>`,
  },
  et: {
    subject: 'Sinu Serfory avaldus on vastu võetud!',
    body: (name: string, link: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Tere tulemast Serforysse, ${name}! 🎉</h2>
        <p style="color:#6b7280;margin-bottom:24px">Sinu avaldus on läbi vaadatud ja vastu võetud. Nüüd saad oma esimese tunni broneerida.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Broneeri esimene tund →</a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">See link on isiklik. Ära jaga seda.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
    botCtaStudent: (botLink: string) =>
      `<div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:10px;border:1px solid #bae6fd">
        <p style="margin:0 0 10px;font-size:13px;color:#0369a1;font-weight:600">📱 Saa uuendusi Telegrami kaudu</p>
        <p style="margin:0 0 12px;font-size:13px;color:#374151">Tunnimuistutused, makseteated ja õpetaja sõnumid otse Telegrami.</p>
        <a href="${botLink}" style="display:inline-block;background:#0ea5e9;color:#fff;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none">Ühenda Telegramiga →</a>
      </div>`,
    botCtaParent: (botLink: string) =>
      `<div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:10px;border:1px solid #bae6fd">
        <p style="margin:0 0 10px;font-size:13px;color:#0369a1;font-weight:600">📱 Jälgi lapse tunde Telegramis</p>
        <p style="margin:0 0 12px;font-size:13px;color:#374151">Saa tunnimuistutused, makseteated ja uuendused lapse kohta otse Telegrami.</p>
        <a href="${botLink}" style="display:inline-block;background:#0ea5e9;color:#fff;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none">Ühenda Telegramiga →</a>
      </div>`,
  },
  ru: {
    subject: 'Ваша заявка в Serfory принята!',
    body: (name: string, link: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Добро пожаловать в Serfory, ${name}! 🎉</h2>
        <p style="color:#6b7280;margin-bottom:24px">Ваша заявка рассмотрена и принята. Теперь вы можете записаться на первый урок.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Записаться на первый урок →</a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">Эта ссылка персональная. Не передавайте её другим.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
    botCtaStudent: (botLink: string) =>
      `<div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:10px;border:1px solid #bae6fd">
        <p style="margin:0 0 10px;font-size:13px;color:#0369a1;font-weight:600">📱 Получайте уведомления в Telegram</p>
        <p style="margin:0 0 12px;font-size:13px;color:#374151">Напоминания об уроках, уведомления об оплате и сообщения от учителя прямо в Telegram.</p>
        <a href="${botLink}" style="display:inline-block;background:#0ea5e9;color:#fff;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none">Подключиться в Telegram →</a>
      </div>`,
    botCtaParent: (botLink: string) =>
      `<div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:10px;border:1px solid #bae6fd">
        <p style="margin:0 0 10px;font-size:13px;color:#0369a1;font-weight:600">📱 Следите за уроками ребёнка в Telegram</p>
        <p style="margin:0 0 12px;font-size:13px;color:#374151">Напоминания об уроках, уведомления об оплате и обновления о вашем ребёнке прямо в Telegram.</p>
        <a href="${botLink}" style="display:inline-block;background:#0ea5e9;color:#fff;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none">Подключиться в Telegram →</a>
      </div>`,
  },
}

const PACKAGE_MESSAGES = {
  en: {
    subject: 'Your Serfory application has been accepted!',
    body: (name: string, link: string, subject: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Welcome to Serfory, ${name}!</h2>
        <p style="color:#6b7280;margin-bottom:8px">Your application for <strong>${subject}</strong> has been reviewed and accepted.</p>
        <p style="color:#6b7280;margin-bottom:24px">Choose your lesson package to get started. You'll receive an invoice by email.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Choose my package →</a>
        <!--BOT-->
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">This link is personal. Do not share it.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
  et: {
    subject: 'Sinu Serfory avaldus on vastu võetud!',
    body: (name: string, link: string, subject: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Tere tulemast Serforysse, ${name}!</h2>
        <p style="color:#6b7280;margin-bottom:8px">Sinu avaldus <strong>${subject}</strong> jaoks on läbi vaadatud ja vastu võetud.</p>
        <p style="color:#6b7280;margin-bottom:24px">Vali tunnipakett alustamiseks. Saad arve e-posti teel.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Vali pakett →</a>
        <!--BOT-->
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">See link on isiklik. Ära jaga seda.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
  ru: {
    subject: 'Ваша заявка в Serfory принята!',
    body: (name: string, link: string, subject: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Добро пожаловать в Serfory, ${name}!</h2>
        <p style="color:#6b7280;margin-bottom:8px">Ваша заявка на <strong>${subject}</strong> рассмотрена и принята.</p>
        <p style="color:#6b7280;margin-bottom:24px">Выберите пакет уроков. Вы получите счёт на оплату по электронной почте.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Выбрать пакет →</a>
        <!--BOT-->
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">Эта ссылка персональная. Не передавайте её другим.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
}

export async function sendPackageEmail({
  to, name, token, lang, subject: courseSubject, appId, showTelegram = false,
}: {
  to: string
  name: string
  token: string
  lang: 'en' | 'et' | 'ru'
  subject: string
  appId?: string
  showTelegram?: boolean
}) {
  const l = PACKAGE_MESSAGES[lang] ?? PACKAGE_MESSAGES.en
  const link = `${BOOKING_URL}/package?token=${token}`
  const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'serforybot'
  const botBlock = showTelegram && appId
    ? MESSAGES[lang].botCtaStudent(`https://t.me/${BOT}?start=s_${appId}`)
    : ''
  const htmlBody = l.body(name, link, courseSubject).replace('<!--BOT-->', botBlock)
  await transporter.sendMail({
    from: `"Serfory Learning" <${process.env.OVH_SMTP_USER}>`,
    to,
    subject: l.subject,
    html: htmlBody,
  })
}

const BOOKING_LINK_MESSAGES = {
  en: {
    subject: 'Your invoice is paid. Book your lesson now!',
    body: (name: string, link: string, subject: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Payment confirmed, ${name}!</h2>
        <p style="color:#6b7280;margin-bottom:24px">Your payment for <strong>${subject}</strong> has been received. You can now book your lessons.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Book my lessons →</a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">This link is personal. Do not share it.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
  et: {
    subject: 'Arve on makstud. Broneeri oma tunnid!',
    body: (name: string, link: string, subject: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Makse kinnitatud, ${name}!</h2>
        <p style="color:#6b7280;margin-bottom:24px">Sinu makse <strong>${subject}</strong> eest on laekunud. Nüüd saad oma tunnid broneerida.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Broneeri tunnid →</a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">See link on isiklik. Ära jaga seda.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
  ru: {
    subject: 'Счёт оплачен. Бронируй уроки!',
    body: (name: string, link: string, subject: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Оплата подтверждена, ${name}!</h2>
        <p style="color:#6b7280;margin-bottom:24px">Ваш платёж за <strong>${subject}</strong> получен. Теперь вы можете забронировать уроки.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Забронировать уроки →</a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">Эта ссылка персональная. Не передавайте её другим.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
}

const CANCELLATION_MESSAGES = {
  en: {
    subject: 'Your lesson has been cancelled',
    tg: (teacher: string, subject: string, date: string, link: string) =>
      `❌ Your ${subject} lesson with ${teacher} on ${date} has been cancelled.\n\nYou can book a new slot here:\n${link}`,
    body: (name: string, teacher: string, subject: string, date: string, link: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Lesson cancelled</h2>
        <p style="color:#6b7280;margin-bottom:8px">Hi ${name},</p>
        <p style="color:#6b7280;margin-bottom:24px">Your <strong>${subject}</strong> lesson with <strong>${teacher}</strong> on <strong>${date}</strong> has been cancelled.</p>
        <p style="color:#6b7280;margin-bottom:24px">Your lesson credit has been returned. You can book a new slot at any time.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Book a new slot →</a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">This link is personal. Do not share it.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
  et: {
    subject: 'Sinu tund on tühistatud',
    tg: (teacher: string, subject: string, date: string, link: string) =>
      `❌ Sinu ${subject} tund õpetajaga ${teacher} kuupäeval ${date} on tühistatud.\n\nSaa broneerida uue aja siit:\n${link}`,
    body: (name: string, teacher: string, subject: string, date: string, link: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Tund tühistatud</h2>
        <p style="color:#6b7280;margin-bottom:8px">Tere, ${name},</p>
        <p style="color:#6b7280;margin-bottom:24px">Sinu <strong>${subject}</strong> tund õpetajaga <strong>${teacher}</strong> kuupäeval <strong>${date}</strong> on tühistatud.</p>
        <p style="color:#6b7280;margin-bottom:24px">Tunni krediit on tagastatud. Saad igal ajal uue aja broneerida.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Broneeri uus aeg →</a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">See link on isiklik. Ära jaga seda.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
  ru: {
    subject: 'Ваш урок отменён',
    tg: (teacher: string, subject: string, date: string, link: string) =>
      `❌ Ваш урок по ${subject} с ${teacher} ${date} отменён.\n\nЗабронируйте новое время здесь:\n${link}`,
    body: (name: string, teacher: string, subject: string, date: string, link: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Урок отменён</h2>
        <p style="color:#6b7280;margin-bottom:8px">Здравствуйте, ${name},</p>
        <p style="color:#6b7280;margin-bottom:24px">Ваш урок по <strong>${subject}</strong> с <strong>${teacher}</strong> <strong>${date}</strong> был отменён.</p>
        <p style="color:#6b7280;margin-bottom:24px">Кредит урока возвращён. Вы можете забронировать новое время в любой момент.</p>
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Забронировать новое время →</a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">Эта ссылка персональная. Не передавайте её другим.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
}

export async function sendLessonCancelledEmail({
  to, name, teacher, subject, date, link, lang,
}: {
  to: string
  name: string
  teacher: string
  subject: string
  date: string
  link: string
  lang: 'en' | 'et' | 'ru'
}) {
  const l = CANCELLATION_MESSAGES[lang] ?? CANCELLATION_MESSAGES.en
  await transporter.sendMail({
    from: `"Serfory Learning" <${process.env.OVH_SMTP_USER}>`,
    to,
    subject: l.subject,
    html: l.body(name, teacher, subject, date, link),
  })
}

export function lessonCancelledTgText(
  lang: 'en' | 'et' | 'ru',
  teacher: string, subject: string, date: string, link: string
): string {
  const l = CANCELLATION_MESSAGES[lang] ?? CANCELLATION_MESSAGES.en
  return l.tg(teacher, subject, date, link)
}

export function botCtaStudentBlock(lang: 'en' | 'et' | 'ru', botLink: string): string {
  return (MESSAGES[lang] ?? MESSAGES.en).botCtaStudent(botLink)
}

export async function sendBookingLinkEmail({
  to, name, link, lang, subject: courseSubject, appId, showTelegram = false,
}: {
  to: string
  name: string
  link: string
  lang: 'en' | 'et' | 'ru'
  subject: string
  appId?: string
  showTelegram?: boolean
}) {
  const l = BOOKING_LINK_MESSAGES[lang] ?? BOOKING_LINK_MESSAGES.en
  const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'serforybot'
  const botBlock = showTelegram && appId
    ? botCtaStudentBlock(lang, `https://t.me/${BOT}?start=s_${appId}`)
    : ''
  const html = l.body(name, link, courseSubject).replace(
    '<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">',
    `${botBlock}<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">`
  )
  await transporter.sendMail({
    from: `"Serfory Learning" <${process.env.OVH_SMTP_USER}>`,
    to,
    subject: l.subject,
    html,
  })
}

const GROUP_BATCH_OPENED_MESSAGES = {
  en: {
    subject: (s: string) => `A new group ${s} course is available for you!`,
    body: (name: string, teacherName: string, courseSubject: string, level: string, teachingLangLabel: string, sessionLines: string, link: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Good news, ${name}!</h2>
        <p style="color:#6b7280;margin-bottom:8px">You requested a group <strong>${courseSubject}</strong> course (${level}, taught in ${teachingLangLabel}).</p>
        <p style="color:#6b7280;margin-bottom:16px"><strong>${teacherName}</strong> has just opened a group matching your request.</p>
        <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #bbf7d0">
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#166534">Sessions</p>
          ${sessionLines}
        </div>
        <a href="${link}" style="display:inline-block;background:#10b981;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Book my group course</a>
        <p style="margin-top:16px;font-size:12px;color:#9ca3af">This link is personal. Do not share it.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
  et: {
    subject: (s: string) => `Uus grupp ${s} kursus on teile saadaval!`,
    body: (name: string, teacherName: string, courseSubject: string, level: string, teachingLangLabel: string, sessionLines: string, link: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Head uudist, ${name}!</h2>
        <p style="color:#6b7280;margin-bottom:8px">Soovisite grupikursust ainest <strong>${courseSubject}</strong> (${level}, õpetamiskeel: ${teachingLangLabel}).</p>
        <p style="color:#6b7280;margin-bottom:16px"><strong>${teacherName}</strong> avas just teie soovidele vastava grupikursuse.</p>
        <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #bbf7d0">
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#166534">Tunnid</p>
          ${sessionLines}
        </div>
        <a href="${link}" style="display:inline-block;background:#10b981;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Broneeri grupitund</a>
        <p style="margin-top:16px;font-size:12px;color:#9ca3af">See link on isiklik. Ära jaga seda.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
  ru: {
    subject: (s: string) => `Открылась групповая запись по предмету ${s}!`,
    body: (name: string, teacherName: string, courseSubject: string, level: string, teachingLangLabel: string, sessionLines: string, link: string) => `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Хорошие новости, ${name}!</h2>
        <p style="color:#6b7280;margin-bottom:8px">Вы запрашивали групповой курс по предмету <strong>${courseSubject}</strong> (${level}, язык: ${teachingLangLabel}).</p>
        <p style="color:#6b7280;margin-bottom:16px"><strong>${teacherName}</strong> только что открыл группу, которая соответствует вашему запросу.</p>
        <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #bbf7d0">
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#166534">Занятия</p>
          ${sessionLines}
        </div>
        <a href="${link}" style="display:inline-block;background:#10b981;color:#fff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none">Записаться в группу</a>
        <p style="margin-top:16px;font-size:12px;color:#9ca3af">Эта ссылка персональная. Не передавайте её другим.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
      </div>
    `,
  },
}

const LANG_LABELS_EMAIL: Record<string, Record<string, string>> = {
  en: { en: 'English', ru: 'Russian', et: 'Estonian', ky: 'Kyrgyz' },
  et: { en: 'inglise keeles', ru: 'vene keeles', et: 'eesti keeles', ky: 'kirgiisi keeles' },
  ru: { en: 'английском', ru: 'русском', et: 'эстонском', ky: 'кыргызском' },
}

export async function sendGroupBatchOpenedEmail({
  to, name, teacherName, courseSubject, level, teachingLang, sessionDates, packageLink, lang,
}: {
  to: string
  name: string
  teacherName: string
  courseSubject: string
  level: string
  teachingLang: string
  sessionDates: string[]
  packageLink: string
  lang: 'en' | 'et' | 'ru'
}) {
  const l = GROUP_BATCH_OPENED_MESSAGES[lang] ?? GROUP_BATCH_OPENED_MESSAGES.en
  const teachingLangLabel = (LANG_LABELS_EMAIL[lang] ?? LANG_LABELS_EMAIL.en)[teachingLang] ?? teachingLang.toUpperCase()
  const sessionLines = sessionDates
    .map(d => `<p style="margin:0 0 4px;font-size:13px;color:#374151">${d}</p>`)
    .join('')
  const html = l.body(name, teacherName, courseSubject, level, teachingLangLabel, sessionLines, packageLink)
  await transporter.sendMail({
    from: `"Serfory Learning" <${process.env.OVH_SMTP_USER}>`,
    to,
    subject: l.subject(courseSubject),
    html,
  })
}

export async function sendAcceptanceEmail({
  to,
  name,
  token,
  lang,
  appId,
  isParent = false,
  showTelegram = false,
}: {
  to: string
  name: string
  token: string
  lang: 'en' | 'et' | 'ru'
  appId?: string
  isParent?: boolean
  showTelegram?: boolean
}) {
  const l = MESSAGES[lang] ?? MESSAGES.en
  const link = `${BOOKING_URL}/booking?ref=${token}`

  const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'serforybot'
  const startPrefix = isParent ? 'p_' : 's_'
  const botBlock = showTelegram && appId
    ? (isParent ? l.botCtaParent : l.botCtaStudent)(`https://t.me/${BOT}?start=${startPrefix}${appId}`)
    : ''

  // Insert bot CTA before the closing div
  const htmlBody = l.body(name, link).replace(
    '<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">',
    `${botBlock}<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">`
  )

  await transporter.sendMail({
    from: `"Serfory Learning" <${process.env.OVH_SMTP_USER}>`,
    to,
    subject: l.subject,
    html: htmlBody,
  })
}
