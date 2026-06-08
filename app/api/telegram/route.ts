import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

const REPLY: Record<string, (name: string, subject: string, link: string) => string> = {
  en: (name, subject, link) =>
    `Hi ${name}! Here's your booking link for ${subject}:\n\n${link}\n\nChoose your teacher and a time that works for you.`,
  et: (name, subject, link) =>
    `Tere ${name}! Siin on teie broneeringulink ${subject} jaoks:\n\n${link}\n\nValige õpetaja ja teile sobiv aeg.`,
  ru: (name, subject, link) =>
    `Привет, ${name}! Вот ваша ссылка для бронирования ${subject}:\n\n${link}\n\nВыберите учителя и удобное время.`,
}

const PENDING_REPLY: Record<string, (name: string) => string> = {
  en: (name) => `Hi ${name}! We received your application and are reviewing it. Once accepted, your booking link will appear here automatically.`,
  et: (name) => `Tere ${name}! Saime teie avalduse kätte ja vaatame selle läbi. Pärast kinnitamist ilmub teie broneeringulink siia automaatselt.`,
  ru: (name) => `Привет, ${name}! Мы получили вашу заявку и рассматриваем её. После принятия ваша ссылка для бронирования появится здесь автоматически.`,
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const message = body?.message
  if (!message) return NextResponse.json({ ok: true })

  const chatId: number = message.chat.id
  const text: string = message.text || ''

  if (!text.startsWith('/start')) return NextResponse.json({ ok: true })

  const raw = text.replace('/start', '').trim()
  if (!raw) return NextResponse.json({ ok: true })

  // Prefix: s_<id> = student, p_<id> = parent, <id> = student (compat)
  let isParent = false
  let appId = raw
  if (raw.startsWith('s_')) { appId = raw.slice(2) }
  else if (raw.startsWith('p_')) { appId = raw.slice(2); isParent = true }

  const { data: app, error } = await getSupabaseAdmin()
    .from('applications')
    .select('id, name, parent_name, subject, lang, learning_lang, status, ref_token')
    .eq('id', appId)
    .single()

  if (error || !app) {
    await sendMessage(chatId, 'Link not found. Please contact Serfory directly.')
    return NextResponse.json({ ok: true })
  }

  // Store chat_id for later auto-send
  const updateField = isParent ? { telegram_parent_chat_id: chatId } : { telegram_chat_id: chatId }
  await getSupabaseAdmin()
    .from('applications')
    .update(updateField)
    .eq('id', app.id)

  // Notify admin group
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId) {
    const who = isParent ? `🦅👨‍👩‍👧 parent` : `🦅🎓 student`
    const displayName = isParent ? (app.parent_name || app.name) : app.name
    await sendMessage(Number(adminChatId), `${who} <b>${displayName}</b> connected to the bot\n${app.subject} · ${app.name}`)
  }

  const preferred = (app.learning_lang as string | null) ?? (app.lang as string)
  const lang = preferred in REPLY ? preferred : 'en'

  const displayName = isParent ? (app.parent_name || app.name) : app.name

  if (app.status === 'accepted' && app.ref_token) {
    const link = `${process.env.NEXT_PUBLIC_BASE_URL}/booking?ref=${app.ref_token}`
    await sendMessage(chatId, REPLY[lang](displayName, app.subject, link))
  } else {
    await sendMessage(chatId, PENDING_REPLY[lang](displayName))
  }

  return NextResponse.json({ ok: true })
}
