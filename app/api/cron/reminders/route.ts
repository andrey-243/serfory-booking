import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isTelegramEligible } from '@/lib/email'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

const MSGS: Record<string, (name: string, subject: string, teacher: string, time: string, link: string) => string> = {
  en: (name, subject, teacher, time, link) =>
    `📚 Reminder! Your ${subject} lesson starts in 1 hour.\n\n🕐 ${time}\n👩‍🏫 ${teacher}\n🔗 ${link}`,
  et: (name, subject, teacher, time, link) =>
    `📚 Meeldetuletus! Sinu ${subject} tund algab 1 tunni pärast.\n\n🕐 ${time}\n👩‍🏫 ${teacher}\n🔗 ${link}`,
  ru: (name, subject, teacher, time, link) =>
    `📚 Напоминание! Ваш урок ${subject} начинается через 1 час.\n\n🕐 ${time}\n👩‍🏫 ${teacher}\n🔗 ${link}`,
}

export async function GET(req: NextRequest) {
  // Vercel cron authentication
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const from = new Date(now.getTime() + 55 * 60 * 1000).toISOString()
  const to   = new Date(now.getTime() + 65 * 60 * 1000).toISOString()

  const { data: upcoming } = await getSupabaseAdmin()
    .from('bookings')
    .select('id, student_name, student_email, subject, slot_start, meet_link, teachers(name)')
    .eq('status', 'active')
    .gte('slot_start', from)
    .lte('slot_start', to)

  if (!upcoming?.length) return NextResponse.json({ sent: 0 })

  // Fetch matching applications to get telegram_chat_id + learning_lang + country_code
  const emails = [...new Set(upcoming.map(b => b.student_email))]
  const { data: apps } = await getSupabaseAdmin()
    .from('applications')
    .select('email, telegram_chat_id, learning_lang, lang, country_code')
    .in('email', emails)
    .not('telegram_chat_id', 'is', null)

  const appMap = new Map(apps?.map(a => [a.email, a]) ?? [])

  let sent = 0
  for (const booking of upcoming) {
    const app = appMap.get(booking.student_email)
    if (!app?.telegram_chat_id) continue
    if (!isTelegramEligible(app.country_code, app.learning_lang)) continue

    const preferred = (app.learning_lang || app.lang || 'en') as string
    const lang = preferred in MSGS ? preferred : 'en'

    const slotDate = new Date(booking.slot_start)
    const time = slotDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tallinn' })
    const teachers = booking.teachers as { name: string } | { name: string }[] | null
    const teacherName = (Array.isArray(teachers) ? teachers[0]?.name : teachers?.name) ?? ''

    const meetLink = (booking.meet_link as string | null) ?? 'https://serfory.eu'

    const text = MSGS[lang](booking.student_name, booking.subject, teacherName, time, meetLink)

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: app.telegram_chat_id, text }),
    }).catch(() => {})

    sent++
  }

  return NextResponse.json({ sent })
}
