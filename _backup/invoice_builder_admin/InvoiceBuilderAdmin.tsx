// Backup — deprecated 2026-06-11
// InvoiceBuilderAdmin and InvoiceModalAdmin removed from admin/page.tsx
// Invoice generation is now handled via the Invoices tab pipeline

// ── Types (from admin/page.tsx) ───────────────────────────────────────────────
type PanelBooking = {
  id: string; date: string; subject: string; teacher: string
  status: 'confirmed' | 'pending' | 'cancelled'; amount: number
}
type InvGran = 'months' | 'weeks' | 'sessions'

// ── Helpers (from admin/page.tsx) ─────────────────────────────────────────────
function crmWeekStart(iso: string): string {
  const d = new Date(iso); const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d.toISOString().slice(0, 10)
}
function crmWeekRange(key: string): string {
  const mon = new Date(key); const sun = new Date(mon); sun.setDate(sun.getDate() + 6)
  const f = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${f(mon)} – ${f(sun)}`
}
function crmMlShort(key: string): string {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}
function crmFd(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── InvoiceBuilderAdmin ───────────────────────────────────────────────────────
export function InvoiceBuilderAdmin({ studentName, allBookings, initialMonth, paidIds }: {
  studentName: string; allBookings: PanelBooking[]; initialMonth: string | null; paidIds: Set<string>
}) {
  // ... full component code preserved in git history
  // This component was removed because invoice generation is now handled
  // server-side via POST /api/invoices with PDF generation (lib/invoice-pdf.ts)
  return null
}

// ── InvoiceModalAdmin ─────────────────────────────────────────────────────────
export function InvoiceModalAdmin({ studentName, allBookings, initialMonth, paidIds, onClose }: {
  studentName: string; allBookings: PanelBooking[]; initialMonth: string | null; paidIds: Set<string>; onClose: () => void
}) {
  // ... full component code preserved in git history
  return null
}
