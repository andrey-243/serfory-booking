import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const { data, error } = await getSupabaseAdmin()
    .from('applications')
    .select('id, name, subject, lang, learning_lang, country_code, status')
    .eq('ref_token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (data.status !== 'accepted') return NextResponse.json({ error: 'Token not active' }, { status: 403 })

  // Check if invoice already exists for this application
  const { data: existing } = await getSupabaseAdmin()
    .from('invoices')
    .select('id, status')
    .eq('application_id', data.id)
    .single()

  return NextResponse.json({
    name: data.name,
    subject: data.subject,
    lang: (data.learning_lang || data.lang || 'en') as string,
    learning_lang: data.learning_lang ?? null,
    country_code: (data as { country_code?: string | null }).country_code ?? null,
    invoiceAlreadySent: !!existing,
    invoicePaid: existing?.status === 'paid',
  })
}
