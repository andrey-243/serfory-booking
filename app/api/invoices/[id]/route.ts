import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendBookingLinkEmail, isTelegramEligible } from '@/lib/email'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

const TG_BOOKING_MSG: Record<string, (name: string, subject: string, link: string) => string> = {
  en: (name, subject, link) => `Payment confirmed! Book your ${subject} lessons here:\n${link}`,
  et: (name, subject, link) => `Makse kinnitatud! Broneeri oma ${subject} tunnid siit:\n${link}`,
  ru: (name, subject, link) => `Оплата подтверждена! Бронируй уроки ${subject} здесь:\n${link}`,
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = req.cookies.get('session')?.value
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  if (body.status !== 'paid') return NextResponse.json({ error: 'Only status=paid allowed' }, { status: 400 })

  // Fetch invoice + application
  const { data: invoice, error } = await getSupabaseAdmin()
    .from('invoices')
    .select(`
      id, status,
      applications(id, name, email, subject, ref_token, lang, learning_lang, country_code, telegram_chat_id)
    `)
    .eq('id', id)
    .single()

  if (error || !invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (invoice.status === 'paid') return NextResponse.json({ ok: true })

  const app = Array.isArray(invoice.applications) ? invoice.applications[0] : invoice.applications
  if (!app?.ref_token) return NextResponse.json({ error: 'Missing ref_token' }, { status: 500 })

  // Mark as paid
  const { error: updateErr } = await getSupabaseAdmin()
    .from('invoices')
    .update({ status: 'paid' })
    .eq('id', id)

  if (updateErr) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

  const preferred = (app.learning_lang || app.lang || 'en') as string
  const lang = (['en', 'et', 'ru'].includes(preferred) ? preferred : 'en') as 'en' | 'et' | 'ru'
  const bookingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/booking?ref=${app.ref_token}`
  const tgEligible = isTelegramEligible(app.country_code, app.learning_lang)

  // Send booking link via email
  try {
    await sendBookingLinkEmail({
      to: app.email,
      name: app.name,
      token: app.ref_token,
      lang,
      subject: app.subject,
    })
  } catch (e) {
    console.error('Booking link email failed:', e)
  }

  // Send via TG if eligible and chat_id present
  if (tgEligible && app.telegram_chat_id) {
    const msgFn = TG_BOOKING_MSG[lang] ?? TG_BOOKING_MSG.en
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: app.telegram_chat_id, text: msgFn(app.name, app.subject, bookingLink) }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
