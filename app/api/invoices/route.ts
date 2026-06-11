import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getPricePerLesson, getTotalAmount, getStudentsCount, Format, LessonsCount } from '@/lib/pricing'
import { generateInvoicePDF } from '@/lib/invoice-pdf'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.OVH_SMTP_HOST,
  port: Number(process.env.OVH_SMTP_PORT),
  secure: true,
  auth: { user: process.env.OVH_SMTP_USER, pass: process.env.OVH_SMTP_PASS },
})

const INVOICE_SUBJECTS: Record<string, string> = {
  en: 'Your Serfory invoice',
  et: 'Sinu Serfory arve',
  ru: 'Ваш счёт Serfory',
}

const INVOICE_BODY: Record<string, (name: string, total: number, dueDate: string) => string> = {
  en: (name, total, due) => `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Your invoice is ready, ${name}</h2>
      <p style="color:#6b7280;margin-bottom:8px">Please find your invoice attached (PDF).</p>
      <p style="color:#6b7280;margin-bottom:24px">Total: <strong>${total}€</strong> — due by <strong>${due}</strong>.</p>
      <p style="color:#6b7280;margin-bottom:4px">Transfer to:</p>
      <p style="font-size:14px;font-weight:600;color:#1e1e2e;margin-bottom:4px">Serfory Learning OÜ</p>
      <p style="font-size:14px;color:#1e1e2e;margin-bottom:24px">IBAN: EE702200221095085563</p>
      <p style="font-size:12px;color:#9ca3af">Once payment is confirmed, you will receive your booking link.</p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
      <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
    </div>
  `,
  et: (name, total, due) => `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Sinu arve on valmis, ${name}</h2>
      <p style="color:#6b7280;margin-bottom:8px">Arve on lisatud manusena (PDF).</p>
      <p style="color:#6b7280;margin-bottom:24px">Kokku: <strong>${total}€</strong> — tähtaeg <strong>${due}</strong>.</p>
      <p style="color:#6b7280;margin-bottom:4px">Kanda üle:</p>
      <p style="font-size:14px;font-weight:600;color:#1e1e2e;margin-bottom:4px">Serfory Learning OÜ</p>
      <p style="font-size:14px;color:#1e1e2e;margin-bottom:24px">IBAN: EE702200221095085563</p>
      <p style="font-size:12px;color:#9ca3af">Kui makse on kinnitatud, saad broneeringulingi.</p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
      <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
    </div>
  `,
  ru: (name, total, due) => `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e1e2e">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Ваш счёт готов, ${name}</h2>
      <p style="color:#6b7280;margin-bottom:8px">Счёт прикреплён к письму (PDF).</p>
      <p style="color:#6b7280;margin-bottom:24px">Итого: <strong>${total}€</strong> — срок оплаты <strong>${due}</strong>.</p>
      <p style="color:#6b7280;margin-bottom:4px">Перевести на:</p>
      <p style="font-size:14px;font-weight:600;color:#1e1e2e;margin-bottom:4px">Serfory Learning OÜ</p>
      <p style="font-size:14px;color:#1e1e2e;margin-bottom:24px">IBAN: EE702200221095085563</p>
      <p style="font-size:12px;color:#9ca3af">После подтверждения оплаты вы получите ссылку для бронирования.</p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
      <p style="font-size:12px;color:#9ca3af">Serfory Learning · <a href="https://serfory.eu" style="color:#9ca3af">serfory.eu</a></p>
    </div>
  `,
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, format, lessons_count, subject: subjectOverride, learning_lang: learningLangOverride } = body as {
    token: string
    format: Format
    lessons_count: LessonsCount
    subject?: string
    learning_lang?: string
  }

  if (!token || !format || !lessons_count) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const validFormats: Format[] = ['individual', 'pair', 'group']
  const validLessons: LessonsCount[] = [1, 4, 8, 12]
  if (!validFormats.includes(format) || !validLessons.includes(lessons_count)) {
    return NextResponse.json({ error: 'Invalid format or lessons_count' }, { status: 400 })
  }

  // Resolve application from token
  const { data: app, error: appErr } = await getSupabaseAdmin()
    .from('applications')
    .select('id, name, email, subject, lang, learning_lang, country_code, price_tier, status, communication_lang')
    .eq('ref_token', token)
    .single()

  if (appErr || !app) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (app.status !== 'accepted') return NextResponse.json({ error: 'Token not active' }, { status: 403 })

  // Apply overrides if student changed subject/lang on the package page
  const effectiveSubject = subjectOverride || app.subject
  const effectiveLearningLang = learningLangOverride || app.learning_lang || app.lang
  if (subjectOverride && subjectOverride !== app.subject || learningLangOverride && learningLangOverride !== app.learning_lang) {
    await getSupabaseAdmin()
      .from('applications')
      .update({
        ...(subjectOverride && subjectOverride !== app.subject ? { subject: subjectOverride } : {}),
        ...(learningLangOverride && learningLangOverride !== app.learning_lang ? { learning_lang: learningLangOverride } : {}),
      })
      .eq('id', app.id)
  }

  // Check no duplicate invoice
  const { data: existing } = await getSupabaseAdmin()
    .from('invoices')
    .select('id')
    .eq('application_id', app.id)
    .single()
  if (existing) return NextResponse.json({ error: 'Invoice already sent' }, { status: 409 })

  const tier = (app.price_tier || 'normal') as 'rich' | 'normal' | 'poor'
  const pricePerLesson = getPricePerLesson(format, lessons_count, tier)
  const studentsCount = getStudentsCount(format)
  const totalAmount = getTotalAmount(format, lessons_count, tier)

  const issuedAt = new Date()
  const dueDays = Number(process.env.INVOICE_DUE_DAYS ?? 7)
  const dueAt = new Date(issuedAt.getTime() + dueDays * 24 * 60 * 60 * 1000)

  const lang = ((app as { communication_lang?: string }).communication_lang ?? 'en') as 'en' | 'et' | 'ru'

  // Get next invoice number
  const { data: lastInvoice } = await getSupabaseAdmin()
    .from('invoices')
    .select('invoice_number')
    .order('invoice_number', { ascending: false })
    .limit(1)
    .single()
  const invoiceNumber = (lastInvoice?.invoice_number ?? 0) + 1

  // Generate PDF
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateInvoicePDF({
      invoiceNumber,
      studentName: app.name,
      studentEmail: app.email,
      subject: effectiveSubject,
      format,
      lessonsCount: lessons_count,
      studentsCount,
      pricePerLesson,
      totalAmount,
      lang,
      issuedAt,
      dueAt,
    })
  } catch (e) {
    console.error('PDF generation failed:', e)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  // Upload PDF to Supabase Storage
  const fileName = `invoice-${invoiceNumber}-${app.id}.pdf`
  const { error: uploadErr } = await getSupabaseAdmin()
    .storage
    .from('invoices')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: false })

  let pdfUrl: string | null = null
  if (!uploadErr) {
    const { data: urlData } = getSupabaseAdmin().storage.from('invoices').getPublicUrl(fileName)
    pdfUrl = urlData?.publicUrl ?? null
  }

  // Insert invoice record
  const { data: invoice, error: insertErr } = await getSupabaseAdmin()
    .from('invoices')
    .insert({
      application_id: app.id,
      invoice_number: invoiceNumber,
      format,
      lessons_count,
      students_count: studentsCount,
      price_per_lesson: pricePerLesson,
      total_amount: totalAmount,
      status: 'sent',
      pdf_url: pdfUrl,
    })
    .select('id')
    .single()

  if (insertErr) return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })

  // Send email with PDF attachment
  const dueDateStr = dueAt.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const subject = INVOICE_SUBJECTS[lang] ?? INVOICE_SUBJECTS.en
  const html = (INVOICE_BODY[lang] ?? INVOICE_BODY.en)(app.name, totalAmount, dueDateStr)

  await transporter.sendMail({
    from: `"Serfory Learning" <${process.env.OVH_SMTP_USER}>`,
    to: app.email,
    subject,
    html,
    attachments: [{ filename: `serfory-invoice-${invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  }).catch(e => console.error('Invoice email failed:', e))

  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId) {
    const formatLabel: Record<string, string> = { individual: 'Individual', pair: 'Pair', group: 'Group' }
    const msg = [
      `🧾 <b>Invoice #${invoiceNumber} sent</b>`,
      ``,
      `👤 <b>${app.name}</b>`,
      `📚 ${app.subject} · ${formatLabel[format] ?? format} · ${lessons_count} lessons`,
      `💶 ${totalAmount}€`,
      ``,
      `<a href="https://booking.serfory.eu/admin">Open admin →</a>`,
    ].join('\n')
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(adminChatId), text: msg, parse_mode: 'HTML', disable_web_page_preview: true }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, invoiceId: invoice.id })
}

export async function GET(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabaseAdmin()
    .from('invoices')
    .select(`
      id, invoice_number, format, lessons_count, students_count,
      price_per_lesson, total_amount, status, pdf_url, tg_sent_at, created_at,
      applications(id, name, email, subject, ref_token, lang, learning_lang, telegram_chat_id, country_code)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  return NextResponse.json({ invoices: data })
}
