'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { enUS, et, ru } from 'date-fns/locale'
import { Teacher } from '@/lib/supabase'
import { CalendarSlot } from '@/lib/google-calendar'
import { useLang } from '@/lib/language-context'

const dateFnsLocales = { en: enUS, et, ru }

// ── Country list ─────────────────────────────────────────────────────────────
// Priority: EE, RU, then bordering countries, then alphabetical

type Country = { code: string; flag: string; dial: string; name: string }

const PRIORITY_COUNTRIES: Country[] = [
  { code: 'EE', flag: 'EE', dial: '+372', name: 'Estonia' },
  { code: 'RU', flag: 'RU', dial: '+7',   name: 'Russia' },
  { code: 'FI', flag: 'FI', dial: '+358', name: 'Finland' },
  { code: 'LV', flag: 'LV', dial: '+371', name: 'Latvia' },
  { code: 'LT', flag: 'LT', dial: '+370', name: 'Lithuania' },
  { code: 'BY', flag: 'BY', dial: '+375', name: 'Belarus' },
  { code: 'UA', flag: 'UA', dial: '+380', name: 'Ukraine' },
  { code: 'NO', flag: 'NO', dial: '+47',  name: 'Norway' },
]

const OTHER_COUNTRIES: Country[] = [
  { code: 'AT', flag: 'AT', dial: '+43',  name: 'Austria' },
  { code: 'BE', flag: 'BE', dial: '+32',  name: 'Belgium' },
  { code: 'CA', flag: 'CA', dial: '+1',   name: 'Canada' },
  { code: 'CH', flag: 'CH', dial: '+41',  name: 'Switzerland' },
  { code: 'CZ', flag: 'CZ', dial: '+420', name: 'Czech Republic' },
  { code: 'DE', flag: 'DE', dial: '+49',  name: 'Germany' },
  { code: 'DK', flag: 'DK', dial: '+45',  name: 'Denmark' },
  { code: 'ES', flag: 'ES', dial: '+34',  name: 'Spain' },
  { code: 'FR', flag: 'FR', dial: '+33',  name: 'France' },
  { code: 'GB', flag: 'GB', dial: '+44',  name: 'UK' },
  { code: 'GE', flag: 'GE', dial: '+995', name: 'Georgia' },
  { code: 'GR', flag: 'GR', dial: '+30',  name: 'Greece' },
  { code: 'HR', flag: 'HR', dial: '+385', name: 'Croatia' },
  { code: 'HU', flag: 'HU', dial: '+36',  name: 'Hungary' },
  { code: 'IE', flag: 'IE', dial: '+353', name: 'Ireland' },
  { code: 'IT', flag: 'IT', dial: '+39',  name: 'Italy' },
  { code: 'NL', flag: 'NL', dial: '+31',  name: 'Netherlands' },
  { code: 'PL', flag: 'PL', dial: '+48',  name: 'Poland' },
  { code: 'PT', flag: 'PT', dial: '+351', name: 'Portugal' },
  { code: 'RO', flag: 'RO', dial: '+40',  name: 'Romania' },
  { code: 'SE', flag: 'SE', dial: '+46',  name: 'Sweden' },
  { code: 'SK', flag: 'SK', dial: '+421', name: 'Slovakia' },
  { code: 'US', flag: 'US', dial: '+1',   name: 'USA' },
]

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}
function isValidLocalPhone(num: string) {
  return num.replace(/\D/g, '').length >= 6
}

// ── PhoneInput ────────────────────────────────────────────────────────────────
function PhoneInput({
  onChange,
  placeholder,
}: {
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [dial, setDial] = useState(PRIORITY_COUNTRIES[0].dial)
  const [num, setNum] = useState('')

  function update(d: string, n: string) {
    onChange(n ? d + n : '')
  }

  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 bg-white">
      <select
        value={dial}
        onChange={e => { setDial(e.target.value); update(e.target.value, num) }}
        className="border-r border-gray-100 pl-2 pr-1 py-2 text-sm bg-white focus:outline-none cursor-pointer text-gray-700 flex-shrink-0 max-w-[110px]"
      >
        <optgroup label="─────────────">
          {PRIORITY_COUNTRIES.map(c => (
            <option key={c.code} value={c.dial}>
              {c.flag} {c.dial} {c.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="─────────────">
          {OTHER_COUNTRIES.map(c => (
            <option key={c.code} value={c.dial}>
              {c.flag} {c.dial} {c.name}
            </option>
          ))}
        </optgroup>
      </select>
      <input
        type="tel"
        value={num}
        onChange={e => { const n = e.target.value; setNum(n); update(dial, n) }}
        placeholder={placeholder || '55 123 456'}
        className="flex-1 px-3 py-2 text-sm text-gray-900 focus:outline-none bg-white min-w-0"
      />
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
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
  contact_pref: 'whatsapp' | 'telegram' | 'email'
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!isValidEmail(form.student_email)) errs.student_email = ft.invalidEmail
    if (!isValidLocalPhone(form.student_phone)) errs.student_phone = ft.invalidPhone
    if (form.is_minor && !isValidLocalPhone(form.parent_contact)) errs.parent_contact = ft.invalidPhone
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
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
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <div className="mb-4 pb-3 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-0.5">{ft.courseWith} {teacher.name}</p>
        <p className="font-semibold text-gray-900 text-sm">
          {format(parseISO(slot.start), ft.dateFormat, { locale })}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {format(parseISO(slot.start), 'HH:mm')} – {format(parseISO(slot.end), 'HH:mm')}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
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

        <Field label={ft.email} required error={fieldErrors.student_email}>
          <input
            type="email"
            value={form.student_email}
            onChange={e => { set('student_email', e.target.value); setFieldErrors(f => ({ ...f, student_email: undefined })) }}
            className={`${inputClass} ${fieldErrors.student_email ? 'border-red-300 focus:ring-red-300' : ''}`}
            placeholder="example@email.com"
          />
        </Field>

        <Field label={ft.phone} required error={fieldErrors.student_phone}>
          <PhoneInput
            onChange={v => { set('student_phone', v); setFieldErrors(f => ({ ...f, student_phone: undefined })) }}
            placeholder={ft.parentPlaceholder}
          />
          {fieldErrors.student_phone && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.student_phone}</p>
          )}
        </Field>

        <Field label={ft.preferredContact} required>
          <select
            value={form.contact_pref}
            onChange={e => set('contact_pref', e.target.value as 'whatsapp' | 'telegram' | 'email')}
            className={inputClass}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
            <option value="email">Email</option>
          </select>
        </Field>

        <div className="flex items-center gap-2.5 pt-1">
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
            <Field label={ft.parentContact} required error={fieldErrors.parent_contact}>
              <PhoneInput
                onChange={v => { set('parent_contact', v); setFieldErrors(f => ({ ...f, parent_contact: undefined })) }}
                placeholder={ft.parentPlaceholder}
              />
              {fieldErrors.parent_contact && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.parent_contact}</p>
              )}
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
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 font-medium"
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
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white'

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  error?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
