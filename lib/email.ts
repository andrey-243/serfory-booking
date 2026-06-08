import nodemailer from 'nodemailer'

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

export async function sendAcceptanceEmail({
  to,
  name,
  token,
  lang,
  appId,
  isParent = false,
}: {
  to: string
  name: string
  token: string
  lang: 'en' | 'et' | 'ru'
  appId?: string
  isParent?: boolean
}) {
  const l = MESSAGES[lang] ?? MESSAGES.en
  const link = `${BOOKING_URL}/booking?ref=${token}`

  const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'serforybot'
  const startPrefix = isParent ? 'p_' : 's_'
  const botBlock = appId
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
