import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendPackageEmail, isTelegramEligible } from '@/lib/email'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  const { data: pending, error } = await getSupabaseAdmin()
    .from('applications')
    .select('id, name, email, subject, lang, learning_lang, country_code, contact_pref, telegram_chat_id, ref_token')
    .eq('status', 'accepted')
    .lte('scheduled_accept_at', now)
    .is('package_email_sent_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!pending?.length) return NextResponse.json({ accepted: 0 })

  let accepted = 0
  for (const app of pending) {
    if (!app.ref_token) continue

    const { error: updateErr } = await getSupabaseAdmin()
      .from('applications')
      .update({ package_email_sent_at: new Date().toISOString() })
      .eq('id', app.id)

    if (updateErr) continue

    const preferred = (app.learning_lang || app.lang || 'en') as string
    const lang = (['en', 'et', 'ru'].includes(preferred) ? preferred : 'en') as 'en' | 'et' | 'ru'
    const tgEligible = isTelegramEligible(app.country_code, app.learning_lang)
    const packageLink = `${process.env.NEXT_PUBLIC_BASE_URL}/package?token=${app.ref_token}`

    const TG_MSG: Record<string, string> = {
      en: `Hi ${app.name}! Your ${app.subject} application has been accepted.\n\nChoose your lesson package here:\n${packageLink}`,
      et: `Tere ${app.name}! Sinu ${app.subject} avaldus on vastu võetud.\n\nVali tunnipakett siit:\n${packageLink}`,
      ru: `Привет, ${app.name}! Ваша заявка на ${app.subject} принята.\n\nВыберите пакет уроков здесь:\n${packageLink}`,
    }

    try {
      if (tgEligible && app.contact_pref === 'telegram' && app.telegram_chat_id) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: app.telegram_chat_id, text: TG_MSG[lang] ?? TG_MSG.en }),
        })
      } else {
        await sendPackageEmail({
          to: app.email,
          name: app.name,
          token: app.ref_token,
          lang,
          subject: app.subject,
          appId: app.id,
          showTelegram: tgEligible,
        })
      }
    } catch (e) {
      console.error(`Notification failed for ${app.id}:`, e)
    }

    accepted++
  }

  return NextResponse.json({ accepted })
}
