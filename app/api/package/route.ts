import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { token, action, telegram_username } = await req.json()
  if (!token || action !== 'interest_8w_group') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: app, error } = await getSupabaseAdmin()
    .from('applications')
    .select('id, name, subject, lang, learning_lang, telegram_chat_id, telegram_username')
    .eq('ref_token', token)
    .eq('status', 'accepted')
    .single()

  if (error || !app) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  const updates: Record<string, unknown> = { interested_8w_group: true }
  if (telegram_username) updates.telegram_username = telegram_username.replace(/^@/, '')

  await getSupabaseAdmin().from('applications').update(updates).eq('id', app.id)

  const BOT = process.env.TELEGRAM_BOT_TOKEN
  const lang = app.learning_lang || app.lang || 'en'

  // Notify student directly if bot already started
  const chatId = (app as { telegram_chat_id?: number | null }).telegram_chat_id
  if (BOT && chatId) {
    const studentMsg: Record<string, string> = {
      en: `Got it! We'll notify you as soon as the 8-week group format launches.`,
      et: `Saime aru! Anname teile teada, kui 8-nädalane grupiformaat käivitub.`,
      ru: `Поняли! Сообщим вам, как только запустим формат группы на 8 недель.`,
    }
    await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: studentMsg[lang] ?? studentMsg.en }),
    }).catch(() => {})
  }

  // Notify admin
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (BOT && adminChatId) {
    const tgInfo = telegram_username ? ` · @${telegram_username.replace(/^@/, '')}` : chatId ? ' · bot active' : ''
    const msg = `⭐ <b>Group 8w interest</b>\n\n👤 <b>${app.name}</b>\n📚 ${app.subject} · ${lang.toUpperCase()}${tgInfo}\n\n<i>Interested in the 8-week group format</i>`
    await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(adminChatId), text: msg, parse_mode: 'HTML' }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}

const VALID_GRADES = ['kindergarten','1','2','3-4','5-6','7-8','9','10-12','A1','A2','B1','B2']

export async function PATCH(req: NextRequest) {
  const { token, communication_lang, grade } = await req.json()
  if (!token) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (communication_lang && ['en', 'et', 'ru'].includes(communication_lang)) {
    updates.communication_lang = communication_lang
  }
  if (grade && VALID_GRADES.includes(grade)) {
    updates.grade = grade
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin()
    .from('applications')
    .update(updates)
    .eq('ref_token', token)
    .eq('status', 'accepted')

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

const TIER_MULTIPLIERS: Record<string, number> = { eu: 1.30, us: 1.35, baltics: 1.00, cis: 0.60 }

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const { data, error } = await getSupabaseAdmin()
    .from('applications')
    .select('id, name, subject, grade, lang, learning_lang, country_code, status, price_tier, telegram_chat_id, telegram_username, communication_lang')
    .eq('ref_token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (data.status !== 'accepted') return NextResponse.json({ error: 'Token not active' }, { status: 403 })

  const { data: invoiceRows } = await getSupabaseAdmin()
    .from('invoices')
    .select('id, invoice_number, format, subject, lessons_count, total_amount, status, created_at, booking_token')
    .eq('application_id', data.id)
    .order('created_at', { ascending: false })

  const hasPendingInvoice = (invoiceRows ?? []).some(i => i.status === 'sent')

  const invoices = await Promise.all((invoiceRows ?? []).map(async (inv) => {
    let lessonsUsed: number | null = null
    if (inv.status === 'paid' && (inv.format === 'individual' || inv.format === 'pair')) {
      const { count } = await getSupabaseAdmin()
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('invoice_id', inv.id)
        .neq('status', 'cancelled')
      lessonsUsed = count ?? 0
    }
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      format: inv.format as string,
      subject: (inv as { subject?: string | null }).subject ?? null,
      lessons_count: inv.lessons_count,
      total_amount: inv.total_amount,
      status: inv.status as 'sent' | 'paid',
      created_at: inv.created_at as string,
      lessonsUsed,
      hasBookingToken: !!(inv as { booking_token?: string | null }).booking_token,
      booking_token: (inv as { booking_token?: string | null }).booking_token ?? null,
    }
  }))

  const tier = (data as { price_tier?: string | null }).price_tier || 'baltics'

  return NextResponse.json({
    name: data.name,
    subject: data.subject,
    grade: (data as { grade?: string | null }).grade ?? null,
    lang: ((data as { communication_lang?: string }).communication_lang || data.lang || 'en') as string,
    learning_lang: data.learning_lang ?? null,
    country_code: (data as { country_code?: string | null }).country_code ?? null,
    hasTgChatId: !!(data as { telegram_chat_id?: number | null }).telegram_chat_id,
    telegram_username: (data as { telegram_username?: string | null }).telegram_username ?? null,
    invoiceAlreadySent: hasPendingInvoice,
    invoicePaid: (invoiceRows ?? []).some(i => i.status === 'paid'),
    invoices,
    tierMultiplier: TIER_MULTIPLIERS[tier] ?? 1.00,
  })
}
