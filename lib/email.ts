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
  },
}

export async function sendAcceptanceEmail({
  to,
  name,
  token,
  lang,
}: {
  to: string
  name: string
  token: string
  lang: 'en' | 'et' | 'ru'
}) {
  const l = MESSAGES[lang] ?? MESSAGES.en
  const link = `${BOOKING_URL}/booking?ref=${token}`

  await transporter.sendMail({
    from: `"Serfory Learning" <${process.env.OVH_SMTP_USER}>`,
    to,
    subject: l.subject,
    html: l.body(name, link),
  })
}
