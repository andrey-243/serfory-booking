'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { enUS, et, ru } from 'date-fns/locale'
import { Teacher } from '@/lib/supabase'
import { CalendarSlot } from '@/lib/google-calendar'
import { useLang } from '@/lib/language-context'

const dateFnsLocales = { en: enUS, et, ru }

type Props = {
  teacher: Teacher
  slot: CalendarSlot
  subject: string
  onSuccess: () => void
  onCancel: () => void
}

type FormData = {
  student_name: string
  student_email: string
  student_phone: string
  contact_pref: 'whatsapp' | 'telegram'
  is_minor: boolean
  parent_name: string
  parent_contact: string
}

export default function BookingForm({ teacher, slot, subject, onSuccess, onCancel }: Props) {
  const { t, lang } = useLang()
  const ft = t.form
  const [form, setForm] = useState<FormData>({
    student_name: '',
    student_email: '',
    student_phone: '',
    contact_pref: 'whatsapp',
    is_minor: false,
    parent_name: '',
    parent_contact: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacher.id,
          subject,
          slot_start: slot.start,
          slot_end: slot.end,
          ...form,
          parent_name: form.is_minor ? form.parent_name : null,
          parent_contact: form.is_minor ? form.parent_contact : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const locale = dateFnsLocales[lang]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">{ft.courseWith} {teacher.name}</p>
        <p className="font-semibold text-gray-900 capitalize">
          {format(parseISO(slot.start), ft.dateFormat, { locale })}
        </p>
        <p className="text-sm text-gray-500">
          {format(parseISO(slot.start), 'HH:mm')} – {format(parseISO(slot.end), 'HH:mm')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label={ft.fullName} required>
          <input
            type="text"
            value={form.student_name}
            onChange={e => set('student_name', e.target.value)}
            required
            className={inputClass}
            placeholder={ft.namePlaceholder}
          />
        </Field>

        <Field label={ft.email} required>
          <input
            type="email"
            value={form.student_email}
            onChange={e => set('student_email', e.target.value)}
            required
            className={inputClass}
            placeholder="example@email.com"
          />
        </Field>

        <Field label={ft.phone} required>
          <input
            type="tel"
            value={form.student_phone}
            onChange={e => set('student_phone', e.target.value)}
            required
            className={inputClass}
            placeholder="+372 5…"
          />
        </Field>

        <Field label={ft.preferredContact} required>
          <select
            value={form.contact_pref}
            onChange={e => set('contact_pref', e.target.value as 'whatsapp' | 'telegram')}
            className={inputClass}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
          </select>
        </Field>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={form.is_minor}
            onClick={() => set('is_minor', !form.is_minor)}
            className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ${
              form.is_minor ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                form.is_minor ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">{ft.minor}</span>
        </div>

        {form.is_minor && (
          <div className="space-y-3 pt-1">
            <Field label={ft.parentName} required>
              <input
                type="text"
                value={form.parent_name}
                onChange={e => set('parent_name', e.target.value)}
                required
                className={inputClass}
                placeholder={ft.namePlaceholder}
              />
            </Field>
            <Field label={ft.parentContact} required>
              <input
                type="text"
                value={form.parent_contact}
                onChange={e => set('parent_contact', e.target.value)}
                required
                className={inputClass}
                placeholder={ft.parentPlaceholder}
              />
            </Field>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            {ft.cancel}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-60"
          >
            {loading ? ft.sending : ft.confirm}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white'

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
