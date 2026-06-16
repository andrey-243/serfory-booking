import PDFDocument from 'pdfkit'

export interface InvoiceData {
  invoiceNumber: number
  studentName: string
  studentEmail: string
  subject: string
  format: 'individual' | 'pair' | 'group' | 'premade'
  lessonsCount: number
  studentsCount: number
  pricePerLesson: number
  totalAmount: number
  lang: 'en' | 'et' | 'ru'
  issuedAt: Date
  dueAt: Date
}

const LABELS = {
  en: {
    title: 'INVOICE',
    from: 'FROM',
    to: 'TO',
    invoiceNr: 'INVOICE NO',
    date: 'DATE',
    due: 'DUE DATE',
    service: 'SERVICE',
    amount: 'AMOUNT DUE',
    formatLabel: { individual: 'Individual', pair: 'Pair', group: 'Group', premade: 'Premade' },
  },
  et: {
    title: 'ARVE',
    from: 'ESITAJA',
    to: 'SAAJA',
    invoiceNr: 'ARVE NR',
    date: 'KUUPÄEV',
    due: 'TÄHTAEG',
    service: 'TEENUS',
    amount: 'TASUMISELE KUULUV SUMMA',
    formatLabel: { individual: 'Individuaaltund', pair: 'Paartund', group: 'Grupp', premade: 'Premade' },
  },
  ru: {
    title: 'СЧЁТ',
    from: 'ОТПРАВИТЕЛЬ',
    to: 'ПОЛУЧАТЕЛЬ',
    invoiceNr: 'СЧЁТ №',
    date: 'ДАТА',
    due: 'СРОК ОПЛАТЫ',
    service: 'УСЛУГА',
    amount: 'СУММА К ОПЛАТЕ',
    formatLabel: { individual: 'Индивидуальный', pair: 'Парный', group: 'Групповой', premade: 'Premade' },
  },
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ size: 'A4', margin: 56 })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const l = LABELS[data.lang] ?? LABELS.en
    const W = doc.page.width - 112 // usable width (margins both sides)
    const accent = '#3B82F6'
    const grey = '#6B7280'
    const dark = '#1E1E2E'

    // --- Header ---
    doc.font('Helvetica-Bold').fontSize(11).fillColor(accent).text('SERFORY', 56, 56)
    doc.font('Helvetica').fontSize(9).fillColor(grey).text('serfory.eu', 56, 70)

    doc.font('Helvetica-Bold').fontSize(36).fillColor(dark)
      .text(l.title, 56, 46, { align: 'right', width: W })

    doc.moveTo(56, 98).lineTo(56 + W, 98).lineWidth(0.5).strokeColor('#E5E7EB').stroke()

    // --- Left: ESITAJA / FROM ---
    let y = 118
    doc.font('Helvetica-Bold').fontSize(8).fillColor(accent).text(l.from + ':', 56, y)
    y += 14
    doc.font('Helvetica-Bold').fontSize(9).fillColor(dark).text('Serfory Learning OÜ', 56, y)
    y += 13
    doc.font('Helvetica').fontSize(9).fillColor(grey)
    doc.text('Registrikood: 17474682', 56, y); y += 12
    doc.text('Virbi tn 18-1, Tallinn, Harjumaa, 13629', 56, y); y += 12
    doc.text('IBAN: EE702200221095085563', 56, y); y += 12
    doc.text('serfory.learning@gmail.com', 56, y); y += 22

    doc.font('Helvetica-Bold').fontSize(8).fillColor(accent).text(l.to + ':', 56, y)
    y += 14
    doc.font('Helvetica-Bold').fontSize(9).fillColor(dark).text(data.studentName, 56, y)
    y += 13
    doc.font('Helvetica').fontSize(9).fillColor(grey).text(data.studentEmail, 56, y)

    // --- Right: invoice meta ---
    const rightX = 56 + W - 160
    let ry = 118
    const metaRows = [
      [l.invoiceNr, String(data.invoiceNumber).padStart(3, '0')],
      [l.date, formatDate(data.issuedAt)],
      [l.due, formatDate(data.dueAt)],
    ]
    for (const [label, value] of metaRows) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(accent).text(label + ':', rightX, ry, { width: 80 })
      doc.font('Helvetica').fontSize(9).fillColor(dark).text(value, rightX + 82, ry, { width: 80 })
      ry += 16
    }

    // --- Divider ---
    const divY = Math.max(y, ry) + 28
    doc.moveTo(56, divY).lineTo(56 + W, divY).lineWidth(0.5).strokeColor('#E5E7EB').stroke()

    // --- Service ---
    let sy = divY + 20
    doc.font('Helvetica-Bold').fontSize(8).fillColor(accent).text(l.service + ':', 56, sy)
    sy += 16

    const formatLabel = l.formatLabel[data.format]
    const serviceDesc = `${data.lessonsCount} × ${data.subject} lesson, ${formatLabel}`
    doc.font('Helvetica').fontSize(10).fillColor(dark).text(serviceDesc, 56, sy)
    sy += 14

    if (data.format === 'pair' || data.format === 'group') {
      doc.font('Helvetica').fontSize(9).fillColor(grey)
        .text(`${data.studentsCount} students × ${data.lessonsCount} lessons × ${data.pricePerLesson}€/lesson`, 56, sy)
      sy += 13
    } else {
      doc.font('Helvetica').fontSize(9).fillColor(grey)
        .text(`${data.lessonsCount} lessons × ${data.pricePerLesson}€/lesson`, 56, sy)
      sy += 13
    }

    // --- Total ---
    sy += 14
    doc.moveTo(56, sy).lineTo(56 + W, sy).lineWidth(0.5).strokeColor('#E5E7EB').stroke()
    sy += 16

    doc.font('Helvetica-Bold').fontSize(12).fillColor(dark)
      .text(`${l.amount}:  ${data.totalAmount} €`, 56, sy)

    doc.end()
  })
}
