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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  const subject = searchParams.get('subject')
  const teachingLang = searchParams.get('teachingLang')
  const ref = searchParams.get('ref')

  // Single teacher lookup (used by teacher dashboard to get subjects)
  if (id) {
    const { data, error } = await getSupabaseAdmin()
      .from('teachers')
      .select('id, name, subjects, teaching_languages')
      .eq('id', id)
      .single()
    if (error || !data) return NextResponse.json({ teacher: null }, { status: 404 })
    return NextResponse.json({ teacher: data })
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
  if (error) return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })

  const teachers = (data ?? []).map(t => {
    if (!priceTier || !t.price_per_hour) return { ...t, price_per_hour: undefined }
    const adjusted = Math.round(t.price_per_hour * VAT * (TIER_MULTIPLIER[priceTier] ?? 1))
    return { ...t, price_per_hour: undefined, adjusted_price: adjusted }
  })

  return NextResponse.json({ teachers })
}
