import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendAcceptanceEmail } from '@/lib/email'

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

  const validSubjects = ['Russian', 'English', 'Estonian', 'Spanish', 'Math']
  if (!validSubjects.includes(subject)) {
    return NextResponse.json(
      { error: 'Invalid subject' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const price_tier = country_code ? getPriceTier(country_code) : 'normal'

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
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500, headers: CORS_HEADERS }
    )
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
    const minorLine = is_minor
      ? `\n👶 Minor — ${parent_name ?? ''}${parent_contact ? ` · ${parent_contact}` : ''}${parent_pref === 'telegram' && telegram_parent_username ? ` @${telegram_parent_username}` : ''}`
      : ''
    const msg = [
      `🦅 <b>New application</b>`,
      ``,
      `👤 <b>${name}</b>`,
      `📚 ${subject} · ${gradeNorm}${learning_lang ? ` · ${langLabel[learning_lang] ?? learning_lang}` : ''}`,
      `${prefIcon} ${phone}${tgSuffix} · ${email}${minorLine}`,
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
  const { id, status, parent_approved, telegram_username } = await req.json()

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status !== undefined) {
    if (!['pending', 'accepted', 'rejected'].includes(status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    updates.status = status
  }
  if (parent_approved !== undefined) updates.parent_approved = parent_approved
  if (telegram_username !== undefined) updates.telegram_username = telegram_username

  // Generate ref_token on accept
  let ref_token: string | null = null
  if (status === 'accepted') {
    ref_token = crypto.randomUUID()
    updates.ref_token = ref_token
    updates.token_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  const { data: app, error: fetchErr } = await getSupabaseAdmin()
    .from('applications')
    .select('name, email, lang, learning_lang, is_minor, parent_name, parent_email, parent_pref, subject, contact_pref, telegram_chat_id, telegram_parent_chat_id')
    .eq('id', id)
    .single()

  if (fetchErr || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const { error } = await getSupabaseAdmin()
    .from('applications')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

  // Dispatch acceptance notifications (email + Telegram) based on contact preferences
  if (status === 'accepted' && ref_token) {
    const preferred = (app.learning_lang || app.lang) as string
    const lang = (['en', 'et', 'ru'].includes(preferred) ? preferred : 'en') as 'en' | 'et' | 'ru'
    const link = `${process.env.NEXT_PUBLIC_BASE_URL}/booking?ref=${ref_token}`

    const TG_STUDENT: Record<string, string> = {
      en: `Hi ${app.name}! Your application has been accepted. Here's your booking link for ${app.subject}:\n\n${link}\n\nChoose your teacher and a time that works for you.`,
      et: `Tere ${app.name}! Teie avaldus on vastu võetud. Siin on teie broneeringulink ${app.subject} jaoks:\n\n${link}\n\nValige õpetaja ja teile sobiv aeg.`,
      ru: `Привет, ${app.name}! Ваша заявка принята. Вот ваша ссылка для бронирования ${app.subject}:\n\n${link}\n\nВыберите учителя и удобное время.`,
    }

    const parentName = app.parent_name || app.name
    const TG_PARENT: Record<string, string> = {
      en: `Hi! ${app.name}'s application for ${app.subject} has been accepted. Here's the booking link:\n\n${link}`,
      et: `Tere! ${app.name} avaldus ${app.subject} jaoks on vastu võetud. Siin on broneeringulink:\n\n${link}`,
      ru: `Здравствуйте, ${parentName}! Заявка ${app.name} на ${app.subject} принята. Вот ссылка для бронирования:\n\n${link}`,
    }

    const tgSend = async (chatId: number, text: string) => {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      })
    }

    // Student dispatch
    try {
      if (app.contact_pref === 'telegram' && app.telegram_chat_id) {
        await tgSend(app.telegram_chat_id, TG_STUDENT[lang] ?? TG_STUDENT.en)
      } else {
        // email (also fallback when TG pref but no chat_id yet)
        await sendAcceptanceEmail({ to: app.email, name: app.name, token: ref_token, lang, appId: id })
      }
    } catch (e) { console.error('Student notification failed:', e) }

    // Parent dispatch (only if minor)
    if (app.is_minor) {
      const parentPref = app.parent_pref as string | null
      try {
        if (parentPref === 'telegram' && app.telegram_parent_chat_id) {
          await tgSend(app.telegram_parent_chat_id, TG_PARENT[lang] ?? TG_PARENT.en)
        } else if (app.parent_email) {
          // email parent (also fallback when TG pref but no parent chat_id yet)
          await sendAcceptanceEmail({ to: app.parent_email, name: app.name, token: ref_token, lang, appId: id, isParent: true })
        }
      } catch (e) { console.error('Parent notification failed:', e) }
    }
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
      .select('name, email, phone, contact_pref, is_minor, parent_name, parent_contact, parent_email, parent_pref, price_tier, status')
      .eq('ref_token', ref)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    if (data.status !== 'accepted') return NextResponse.json({ error: 'Token not active' }, { status: 403 })

    // Return prefill data — price_tier stays internal (used by /api/teachers?ref=)
    const { price_tier: _, status: __, ...prefill } = data
    return NextResponse.json({ prefill })
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
