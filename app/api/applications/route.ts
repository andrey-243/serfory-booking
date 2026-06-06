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
    contact_pref,
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
      contact_pref,
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

  return NextResponse.json({ id: data.id }, { status: 201, headers: CORS_HEADERS })
}

export async function PATCH(req: NextRequest) {
  const { id, status, parent_approved } = await req.json()

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status !== undefined) {
    if (!['pending', 'accepted', 'rejected'].includes(status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    updates.status = status
  }
  if (parent_approved !== undefined) updates.parent_approved = parent_approved

  // Generate ref_token on accept
  let ref_token: string | null = null
  if (status === 'accepted') {
    ref_token = crypto.randomUUID()
    updates.ref_token = ref_token
    updates.token_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  const { data: app, error: fetchErr } = await getSupabaseAdmin()
    .from('applications')
    .select('name, email, lang, is_minor, parent_email')
    .eq('id', id)
    .single()

  if (fetchErr || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const { error } = await getSupabaseAdmin()
    .from('applications')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

  // Send acceptance email
  if (status === 'accepted' && ref_token) {
    const lang = (app.lang as 'en' | 'et' | 'ru') || 'en'
    try {
      await sendAcceptanceEmail({ to: app.email, name: app.name, token: ref_token, lang })
      if (app.is_minor && app.parent_email) {
        await sendAcceptanceEmail({ to: app.parent_email, name: app.name, token: ref_token, lang })
      }
    } catch (e) {
      console.error('Email send failed:', e)
      // Don't fail the request if email fails
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
