import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Pricing tiers — server-side only
const EU_COUNTRIES = new Set([
  'AD','AT','BE','CH','CY','DE','DK','ES','FI','FR','GB','GR','IE','IS','IT',
  'LI','LU','MC','MT','NL','NO','PT','SE','SM','VA',
])
const US_COUNTRIES = new Set(['US','CA'])
const BALTICS_COUNTRIES = new Set(['EE','LV','LT'])
const CIS_COUNTRIES_TIER = new Set([
  'RU','BY','UA','KZ','KG','TJ','TM','UZ','AZ','AM','GE','MD',
])
const TIER_MULTIPLIER: Record<string, number> = { eu: 1.30, us: 1.35, baltics: 1.00, cis: 0.60 }
const VAT = 1.22

function getPriceTier(code: string): string {
  const c = code.toUpperCase()
  if (US_COUNTRIES.has(c)) return 'us'
  if (EU_COUNTRIES.has(c)) return 'eu'
  if (BALTICS_COUNTRIES.has(c)) return 'baltics'
  if (CIS_COUNTRIES_TIER.has(c)) return 'cis'
  return 'baltics'
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://serfory.eu',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  const subject = searchParams.get('subject')
  const teachingLang = searchParams.get('teachingLang')
  const ref = searchParams.get('ref')

  // Single teacher lookup (used by teacher dashboard to get subjects + config)
  if (id) {
    const { data, error } = await getSupabaseAdmin()
      .from('teachers')
      .select('id, name, subjects, teaching_languages, subject_formats, subject_levels')
      .eq('id', id)
      .single()
    if (error || !data) return NextResponse.json({ teacher: null }, { status: 404, headers: CORS_HEADERS })
    return NextResponse.json({ teacher: data }, { headers: CORS_HEADERS })
  }

  // Resolve price tier from ref token (server-side only)
  let priceTier: string | null = null
  if (ref) {
    const { data } = await getSupabaseAdmin()
      .from('applications')
      .select('price_tier')
      .eq('ref_token', ref)
      .eq('status', 'accepted')
      .single()
    if (data?.price_tier) priceTier = data.price_tier
  }

  let query = getSupabaseAdmin()
    .from('teachers')
    .select('id, name, email, subjects, photo_url, google_photo_url, google_calendar_id, title, teaching_languages, levels, subject_levels, subject_formats, experience_years, price_per_hour, created_at')
    .order('name')

  if (subject) query = query.contains('subjects', [subject])
  if (teachingLang) query = query.contains('teaching_languages', [teachingLang])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500, headers: CORS_HEADERS })

  const teachers = (data ?? []).map(t => {
    if (!priceTier || !t.price_per_hour) return { ...t, price_per_hour: undefined }
    const adjusted = Math.round(t.price_per_hour * VAT * (TIER_MULTIPLIER[priceTier] ?? 1))
    return { ...t, price_per_hour: undefined, adjusted_price: adjusted }
  })

  return NextResponse.json({ teachers }, { headers: CORS_HEADERS })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, teaching_languages, subject_formats, subject_levels } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (teaching_languages !== undefined) update.teaching_languages = teaching_languages
  if (subject_formats !== undefined) update.subject_formats = subject_formats
  if (subject_levels !== undefined) update.subject_levels = subject_levels

  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })

  const supabase = getSupabaseAdmin()

  const { data: teacher } = await supabase.from('teachers').select('name').eq('id', id).single()

  // If subject_formats changed, find subjects where 'group' was removed → delete prelocks
  if (subject_formats !== undefined) {
    const { data: current } = await supabase
      .from('teachers')
      .select('subject_formats')
      .eq('id', id)
      .single()

    const oldFormats = (current?.subject_formats ?? {}) as Record<string, string[]>
    const newFormats = subject_formats as Record<string, string[]>

    const subjectsLostGroup = Object.keys(oldFormats).filter(
      s => oldFormats[s]?.includes('group') && !newFormats[s]?.includes('group')
    )

    if (subjectsLostGroup.length > 0) {
      const { data: prelocks } = await supabase
        .from('group_slot_batches')
        .select('id')
        .eq('teacher_id', id)
        .eq('status', 'prelock')
        .in('subject', subjectsLostGroup)

      if (prelocks && prelocks.length > 0) {
        const prelockIds = prelocks.map(p => p.id)
        await supabase.from('group_slot_sessions').delete().in('batch_id', prelockIds)
        await supabase.from('group_slot_batches').delete().in('id', prelockIds)
      }
    }
  }

  const { error } = await supabase.from('teachers').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 })

  // TG admin notif (fire-and-forget)
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId && teacher?.name) {
    const changes: string[] = []
    if (teaching_languages !== undefined) changes.push(`🗣 Languages: ${(teaching_languages as string[]).join(', ') || '—'}`)
    if (subject_formats !== undefined) {
      const lines = Object.entries(subject_formats as Record<string, string[]>)
        .map(([s, fmts]) => `  ${s}: ${fmts.join(', ')}`)
      changes.push(`📚 Formats:\n${lines.join('\n')}`)
    }
    if (subject_levels !== undefined) {
      const lines = Object.entries(subject_levels as Record<string, string[]>)
        .map(([s, lvls]) => `  ${s}: ${lvls.join(', ') || '—'}`)
      changes.push(`🎯 Levels:\n${lines.join('\n')}`)
    }
    const msg = [`⚙️ <b>${teacher.name}</b> updated their teaching profile`, '', ...changes].join('\n')
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: adminChatId, text: msg, parse_mode: 'HTML' }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
