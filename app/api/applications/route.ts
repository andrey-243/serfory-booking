import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendPackageEmail, isTelegramEligible } from '@/lib/email'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Pricing tiers — server-side only, never exposed to client
const RICH_COUNTRIES = new Set([
  'AD','AT','BE','CH','CY','DE','DK','ES','FI','FR','GB','GR','IE','IS','IT',
  'LI','LU','MC','MT','NL','NO','PT','SE','SM','VA',
])

const POOR_COUNTRIES = new Set([
  // Africa
  'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ',
  'EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG',
  'MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SL','SO','ZA',
  'SS','SD','TZ','TG','TN','UG','ZM','ZW',
  // Poor Eastern
  'KG','TJ','TM','UZ','MN','AF','YE','SY',
])

const CIS_COUNTRIES = new Set(['RU','BY','UA','KZ','KG','TJ','TM','UZ','AZ','AM','GE','MD'])

export function computeCommunicationLang(lang: string, learning_lang: string | null, country_code: string | null): 'en' | 'et' | 'ru' {
  if (['en','et','ru'].includes(lang)) return lang as 'en' | 'et' | 'ru'
  if (learning_lang === 'ky' || learning_lang === 'ru') return 'ru'
  if (learning_lang === 'et') return 'et'
  if (learning_lang === 'en') return 'en'
  if (country_code) {
    const cc = country_code.toUpperCase()
    if (cc === 'EE') return 'et'
    if (CIS_COUNTRIES.has(cc)) return 'ru'
  }
  return 'en'
}

function getPriceTier(countryCode: string): 'rich' | 'normal' | 'poor' {
  const code = countryCode.toUpperCase()
  if (RICH_COUNTRIES.has(code)) return 'rich'
  if (POOR_COUNTRIES.has(code)) return 'poor'
  return 'normal'
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    name,
    email,
    phone,
    country_code,
    is_minor,
    parent_name,
    parent_contact,
    parent_email,
    parent_pref,
    subject,
    grade,
    learning_lang,
    contact_pref,
    telegram_username,
    telegram_parent_username,
    lang,
  } = body

  if (!name || !email || !phone || !subject || !grade || !contact_pref || !lang) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const validSubjects = ['Russian', 'English', 'Estonian', 'Spanish', 'Math', 'Kyrgyz']
  if (!validSubjects.includes(subject)) {
    return NextResponse.json(
      { error: 'Invalid subject' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const price_tier = country_code ? getPriceTier(country_code) : 'normal'

  // Schedule auto-accept: 5–15 min from now (instant if AUTO_ACCEPT_INSTANT=true)
  // Windows (Europe/Paris): Mon–Fri 6h–20h, Sat–Sun 8h–14h
  const TZ = 'Europe/Paris'
  const instant = process.env.AUTO_ACCEPT_INSTANT === 'true'
  const delayMs = instant ? 0 : (5 + Math.floor(Math.random() * 11)) * 60 * 1000
  let scheduledAt = new Date(Date.now() + delayMs)

  function getParisFields(d: Date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hour: 'numeric', minute: 'numeric',
      weekday: 'short', hour12: false,
    }).formatToParts(d)
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
    const hour = parseInt(get('hour'))
    const day = get('weekday') // 'Mon','Tue',...
    const isWeekend = day === 'Sat' || day === 'Sun'
    return { hour, isWeekend }
  }

  function nextWindowStart(d: Date): Date {
    const { hour, isWeekend } = getParisFields(d)
    const openHour = isWeekend ? 8 : 6
    const closeHour = isWeekend ? 14 : 20
    if (hour >= openHour && hour < closeHour) return d // already in window

    // Advance to next open slot
    const next = new Date(d)
    if (hour >= closeHour) {
      // Past closing: move to next day opening
      next.setDate(next.getDate() + 1)
    }
    // Set to openHour in Paris time by iterating (DST-safe)
    next.setMinutes(0, 0, 0)
    // Find UTC offset at that day by trying hours until Paris hour matches
    for (let h = 0; h < 24; h++) {
      next.setUTCHours(h)
      const { hour: ph, isWeekend: iwe } = getParisFields(next)
      const target = iwe ? 8 : 6
      if (ph === target) break
    }
    // Re-check: if it's a weekend and openHour is 8 but we need to re-check
    const rechk = getParisFields(next)
    if (rechk.hour >= (rechk.isWeekend ? 14 : 20)) {
      return nextWindowStart(new Date(next.getTime() + 60 * 60 * 1000))
    }
    return next
  }

  scheduledAt = nextWindowStart(scheduledAt)

  const ref_token = crypto.randomUUID()

  const { data, error } = await getSupabaseAdmin()
    .from('applications')
    .insert({
      name,
      email,
      phone,
      country_code: country_code || null,
      is_minor: is_minor ?? false,
      parent_name: is_minor ? (parent_name || null) : null,
      parent_contact: is_minor ? (parent_contact || null) : null,
      parent_email: is_minor ? (parent_email || null) : null,
      parent_pref: is_minor ? (parent_pref || null) : null,
      subject,
      grade,
      learning_lang: learning_lang || null,
      contact_pref,
      telegram_username: telegram_username || null,
      telegram_parent_username: telegram_parent_username || null,
      lang,
      price_tier,
      communication_lang: computeCommunicationLang(lang, learning_lang, country_code || null),
      status: 'accepted',
      ref_token,
      scheduled_accept_at: scheduledAt.toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500, headers: CORS_HEADERS }
    )
  }

  // Auto-send package email immediately for test emails (no cron needed)
  const testPatterns = (process.env.TEST_EMAIL_PATTERNS || 'andrey.bondaryev,lerussedu24').split(',').map(p => p.trim().toLowerCase())
  const emailLocal = email.split('@')[0].toLowerCase()
  const isTestEmail = testPatterns.some(p => emailLocal.includes(p.replace(/[^a-z0-9]/g, '').slice(0, 6)))
  if (isTestEmail) {
    const preferred = (learning_lang || lang) as string
    const emailLang = computeCommunicationLang(lang, learning_lang, country_code || null)
    const tgEligible = isTelegramEligible(country_code, learning_lang)
    try {
      await sendPackageEmail({ to: email, name, token: ref_token, lang: emailLang, subject, appId: data.id, showTelegram: tgEligible })
      await getSupabaseAdmin().from('applications').update({ package_email_sent_at: new Date().toISOString() }).eq('id', data.id)
    } catch (e) { console.error('Test auto-send failed:', e) }
  }

  // Notify admin group
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId) {
    const langLabel: Record<string, string> = { en: 'EN', et: 'ET', ru: 'RU' }
    const GRADE_NORMALIZE: Record<string, string> = {
      'Детский сад': 'Kindergarten', 'Kindergarten': 'Kindergarten',
      '1 класс': 'Grade 1',  '1. klass': 'Grade 1',  'Grade 1': 'Grade 1',
      '2 класс': 'Grade 2',  '2. klass': 'Grade 2',  'Grade 2': 'Grade 2',
      '3 класс': 'Grade 3',  '3. klass': 'Grade 3',  'Grade 3': 'Grade 3',
      '4 класс': 'Grade 4',  '4. klass': 'Grade 4',  'Grade 4': 'Grade 4',
      '5 класс': 'Grade 5',  '5. klass': 'Grade 5',  'Grade 5': 'Grade 5',
      '6 класс': 'Grade 6',  '6. klass': 'Grade 6',  'Grade 6': 'Grade 6',
      '7 класс': 'Grade 7',  '7. klass': 'Grade 7',  'Grade 7': 'Grade 7',
      '8 класс': 'Grade 8',  '8. klass': 'Grade 8',  'Grade 8': 'Grade 8',
      '9 класс': 'Grade 9',  '9. klass': 'Grade 9',  'Grade 9': 'Grade 9',
      '10 класс': 'Grade 10', '10. klass': 'Grade 10', 'Grade 10': 'Grade 10',
      '11 класс': 'Grade 11', '11. klass': 'Grade 11', 'Grade 11': 'Grade 11',
      '12 класс': 'Grade 12', '12. klass': 'Grade 12', 'Grade 12': 'Grade 12',
      'Взрослый': 'Adult', 'Täiskasvanu': 'Adult', 'Adult': 'Adult',
    }
    const gradeNorm = GRADE_NORMALIZE[grade] ?? grade
    const prefIcon = contact_pref === 'telegram' ? '📱' : '✉️'
    const tgSuffix = contact_pref === 'telegram' && telegram_username ? ` @${telegram_username}` : ''
    const msg = [
      `🦅 <b>New application</b>`,
      ``,
      `👤 <b>${name}</b>`,
      `📚 ${subject} · ${gradeNorm}${learning_lang ? ` · ${langLabel[learning_lang] ?? learning_lang}` : ''}`,
      `${prefIcon} ${phone}${tgSuffix} · ${email}`,
      ``,
      `<a href="https://booking.serfory.eu/admin">Open admin →</a>`,
    ].join('\n')
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(adminChatId), text: msg, parse_mode: 'HTML', disable_web_page_preview: true }),
    }).catch(() => {})
  }

  return NextResponse.json({ id: data.id }, { status: 201, headers: CORS_HEADERS })
}

export async function PATCH(req: NextRequest) {
  const { id, status, telegram_username, parent_name, parent_contact, parent_email } = await req.json()

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status !== undefined) {
    if (!['pending', 'accepted', 'rejected'].includes(status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    updates.status = status
  }
  if (telegram_username !== undefined) updates.telegram_username = telegram_username
  if (parent_name !== undefined) updates.parent_name = parent_name
  if (parent_contact !== undefined) updates.parent_contact = parent_contact
  if (parent_email !== undefined) updates.parent_email = parent_email

  // Generate ref_token on accept
  let ref_token: string | null = null
  if (status === 'accepted') {
    ref_token = crypto.randomUUID()
    updates.ref_token = ref_token
    updates.token_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  const { data: app, error: fetchErr } = await getSupabaseAdmin()
    .from('applications')
    .select('name, email, lang, learning_lang, country_code, subject, communication_lang')
    .eq('id', id)
    .single()

  if (fetchErr || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const { error } = await getSupabaseAdmin()
    .from('applications')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

  if (status === 'accepted' && ref_token) {
    const lang = (app.communication_lang ?? 'en') as 'en' | 'et' | 'ru'
    const tgEligible = isTelegramEligible(app.country_code, app.learning_lang)
    try {
      await sendPackageEmail({ to: app.email, name: app.name, token: ref_token, lang, subject: app.subject, appId: id, showTelegram: tgEligible })
    } catch (e) { console.error('Student notification failed:', e) }
  }

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const ref = searchParams.get('ref')

  // Public: resolve ref token for booking pre-fill
  if (ref) {
    const { data, error } = await getSupabaseAdmin()
      .from('applications')
      .select('id, name, email, phone, contact_pref, subject, learning_lang, price_tier, status')
      .eq('ref_token', ref)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    if (data.status !== 'accepted') return NextResponse.json({ error: 'Token not active' }, { status: 403 })

    // Fetch format from latest paid invoice
    const { data: invoice } = await getSupabaseAdmin()
      .from('invoices')
      .select('format')
      .eq('application_id', data.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { price_tier: _, status: __, id: _id, ...prefill } = data
    return NextResponse.json({ prefill, bookingFormat: invoice?.format ?? null })
  }

  // Admin only: list all applications
  const session = req.cookies.get('session')?.value
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabaseAdmin()
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  return NextResponse.json({ applications: data })
}
