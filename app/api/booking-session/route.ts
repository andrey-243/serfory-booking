import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = req.nextUrl.searchParams.get('session')
  if (!session) return NextResponse.json({ error: 'Missing session' }, { status: 400 })

  // Resolve booking_token → invoice → application
  const { data: invoice, error } = await getSupabaseAdmin()
    .from('invoices')
    .select(`
      id, lessons_count, format, subject, learning_lang,
      applications(id, name, email, phone, contact_pref, subject, grade, learning_lang, country_code, price_tier, ref_token)
    `)
    .eq('booking_token', session)
    .eq('status', 'paid')
    .single()

  if (error || !invoice) return NextResponse.json({ error: 'Invalid or expired session' }, { status: 404 })

  const app = Array.isArray(invoice.applications) ? invoice.applications[0] : invoice.applications
  if (!app) return NextResponse.json({ error: 'Invalid session' }, { status: 404 })

  // Count non-cancelled bookings linked to this invoice
  const { count } = await getSupabaseAdmin()
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('invoice_id', invoice.id)
    .neq('status', 'cancelled')

  const booked = count ?? 0
  const lessonsTotal = invoice.lessons_count
  const lessonsRemaining = Math.max(0, lessonsTotal - booked)

  // Return 410 if all lessons consumed - token stays in DB so this page always shows the CTA
  if (lessonsRemaining === 0) {
    const refToken = (app as { ref_token?: string | null }).ref_token ?? null
    return NextResponse.json({ error: 'No lessons remaining on this package', refToken }, { status: 410 })
  }

  const effectiveSubject = (invoice as { subject?: string | null }).subject || app.subject
  const effectiveLearningLang = (invoice as { learning_lang?: string | null }).learning_lang || app.learning_lang

  return NextResponse.json({
    invoiceId: invoice.id,
    applicationId: app.id,
    lessonsRemaining,
    lessonsTotal,
    format: invoice.format,
    appRefToken: (app as { ref_token?: string | null }).ref_token ?? null,
    prefill: {
      name: app.name,
      email: app.email,
      phone: app.phone,
      contact_pref: app.contact_pref,
      subject: effectiveSubject,
      grade: (app as { grade?: string | null }).grade ?? null,
      learning_lang: effectiveLearningLang,
      country_code: (app as { country_code?: string | null }).country_code ?? null,
    },
  })
}
