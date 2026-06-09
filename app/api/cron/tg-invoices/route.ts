import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isTelegramEligible } from '@/lib/email'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

const TG_INVOICE_MSG: Record<string, (name: string, subject: string, total: number, iban: string) => string> = {
  en: (name, subject, total, iban) =>
    `Hi ${name}! Your invoice for ${subject} is ready.\n\nTotal: ${total}€\nIBAN: ${iban}\n\nOnce payment is confirmed, you'll receive your booking link.`,
  et: (name, subject, total, iban) =>
    `Tere ${name}! Sinu ${subject} arve on valmis.\n\nKokku: ${total}€\nIBAN: ${iban}\n\nPärast makse kinnitust saad broneeringulingi.`,
  ru: (name, subject, total, iban) =>
    `Привет, ${name}! Ваш счёт за ${subject} готов.\n\nИтого: ${total}€\nIBAN: ${iban}\n\nПосле подтверждения оплаты вы получите ссылку для бронирования.`,
}

const IBAN = 'EE702200221095085563'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find invoices older than 30 min, not yet sent via TG
  const threshold = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data: invoices, error } = await getSupabaseAdmin()
    .from('invoices')
    .select(`
      id, total_amount, tg_sent_at,
      applications(name, email, subject, lang, learning_lang, country_code, telegram_chat_id)
    `)
    .eq('status', 'sent')
    .is('tg_sent_at', null)
    .lte('created_at', threshold)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!invoices?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const inv of invoices) {
    const app = Array.isArray(inv.applications) ? inv.applications[0] : inv.applications
    if (!app?.telegram_chat_id) continue
    if (!isTelegramEligible(app.country_code, app.learning_lang)) continue

    const preferred = (app.learning_lang || app.lang || 'en') as string
    const lang = (['en', 'et', 'ru'].includes(preferred) ? preferred : 'en') as keyof typeof TG_INVOICE_MSG
    const msgFn = TG_INVOICE_MSG[lang] ?? TG_INVOICE_MSG.en
    const text = msgFn(app.name, app.subject, inv.total_amount, IBAN)

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: app.telegram_chat_id, text }),
    }).catch(() => null)

    if (res?.ok) {
      await getSupabaseAdmin()
        .from('invoices')
        .update({ tg_sent_at: new Date().toISOString() })
        .eq('id', inv.id)
      sent++
    }
  }

  return NextResponse.json({ sent })
}
