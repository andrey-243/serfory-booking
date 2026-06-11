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
      applications(id, name, email, phone, contact_pref, subject, learning_lang, price_tier)
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

  // Invalidate token if all lessons consumed
  if (lessonsRemaining === 0) {
    await getSupabaseAdmin()
      .from('invoices')
      .update({ booking_token: null })
      .eq('id', invoice.id)
    return NextResponse.json({ error: 'No lessons remaining on this package' }, { status: 410 })
  }

  const effectiveSubject = (invoice as { subject?: string | null }).subject || app.subject
  const effectiveLearningLang = (invoice as { learning_lang?: string | null }).learning_lang || app.learning_lang

  return NextResponse.json({
    invoiceId: invoice.id,
    lessonsRemaining,
    lessonsTotal,
    format: invoice.format,
    prefill: {
      name: app.name,
      email: app.email,
      phone: app.phone,
      contact_pref: app.contact_pref,
      subject: effectiveSubject,
      learning_lang: effectiveLearningLang,
    },
  })
}
