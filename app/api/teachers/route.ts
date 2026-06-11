import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Pricing tiers — server-side only
const RICH_COUNTRIES = new Set([
  'AD','AT','BE','CH','CY','DE','DK','ES','FI','FR','GB','GR','IE','IS','IT',
  'LI','LU','MC','MT','NL','NO','PT','SE','SM','VA',
])
const POOR_COUNTRIES = new Set([
  'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ',
  'EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG',
  'MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SL','SO','ZA',
  'SS','SD','TZ','TG','TN','UG','ZM','ZW','KG','TJ','TM','UZ','MN','AF','YE','SY',
])
const TIER_MULTIPLIER: Record<string, number> = { rich: 1.2, normal: 1.0, poor: 0.8 }
const VAT = 1.22

function getPriceTier(code: string): string {
  const c = code.toUpperCase()
  if (RICH_COUNTRIES.has(c)) return 'rich'
  if (POOR_COUNTRIES.has(c)) return 'poor'
  return 'normal'
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
    .select('id, name, email, subjects, photo_url, google_photo_url, google_calendar_id, title, teaching_languages, levels, experience_years, price_per_hour, created_at')
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
