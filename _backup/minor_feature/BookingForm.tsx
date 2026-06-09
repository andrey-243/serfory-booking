'use client'

import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { enUS, et, ru } from 'date-fns/locale'
import { Teacher } from '@/lib/supabase'
import { CalendarSlot } from '@/lib/google-calendar'
import { useLang } from '@/lib/language-context'

const dateFnsLocales = { en: enUS, et, ru }

// ── Country list ─────────────────────────────────────────────────────────────

type Country = { code: string; dial: string; name: string }

const PRIORITY_COUNTRIES: Country[] = [
  { code: 'EE', dial: '+372', name: 'Estonia' },
  { code: 'RU', dial: '+7',   name: 'Russia' },
  { code: 'FI', dial: '+358', name: 'Finland' },
  { code: 'LV', dial: '+371', name: 'Latvia' },
  { code: 'LT', dial: '+370', name: 'Lithuania' },
  { code: 'BY', dial: '+375', name: 'Belarus' },
  { code: 'UA', dial: '+380', name: 'Ukraine' },
  { code: 'NO', dial: '+47',  name: 'Norway' },
]

const OTHER_COUNTRIES: Country[] = [
  { code: 'AT', dial: '+43',  name: 'Austria' },
  { code: 'BE', dial: '+32',  name: 'Belgium' },
  { code: 'CA', dial: '+1',   name: 'Canada' },
  { code: 'CH', dial: '+41',  name: 'Switzerland' },
  { code: 'CZ', dial: '+420', name: 'Czech Republic' },
  { code: 'DE', dial: '+49',  name: 'Germany' },
  { code: 'DK', dial: '+45',  name: 'Denmark' },
  { code: 'ES', dial: '+34',  name: 'Spain' },
  { code: 'FR', dial: '+33',  name: 'France' },
  { code: 'GB', dial: '+44',  name: 'UK' },
  { code: 'GE', dial: '+995', name: 'Georgia' },
  { code: 'GR', dial: '+30',  name: 'Greece' },
  { code: 'HR', dial: '+385', name: 'Croatia' },
  { code: 'HU', dial: '+36',  name: 'Hungary' },
  { code: 'IE', dial: '+353', name: 'Ireland' },
  { code: 'IT', dial: '+39',  name: 'Italy' },
  { code: 'NL', dial: '+31',  name: 'Netherlands' },
  { code: 'PL', dial: '+48',  name: 'Poland' },
  { code: 'PT', dial: '+351', name: 'Portugal' },
  { code: 'RO', dial: '+40',  name: 'Romania' },
  { code: 'SE', dial: '+46',  name: 'Sweden' },
  { code: 'SK', dial: '+421', name: 'Slovakia' },
  { code: 'US', dial: '+1',   name: 'USA' },
]

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}
function isValidLocalPhone(num: string) {
  return num.replace(/\D/g, '').length >= 6
}

// ── PhoneInput ────────────────────────────────────────────────────────────────
function parsePhone(phone: string): { dial: string; num: string } {
  const all = [...PRIORITY_COUNTRIES, ...OTHER_COUNTRIES]
  const sorted = [...all].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    if (phone.startsWith(c.dial)) {
      return { dial: c.dial, num: phone.slice(c.dial.length).trim() }
    }
  }
  return { dial: PRIORITY_COUNTRIES[0].dial, num: phone }
}

function PhoneInput({
  onChange,
  placeholder,
  initialValue,
}: {
  onChange: (v: string) => void
  placeholder?: string
  initialValue?: string
}) {
  const parsed = initialValue ? parsePhone(initialValue) : null
  const [dial, setDial] = useState(parsed?.dial ?? PRIORITY_COUNTRIES[0].dial)
  const [num, setNum] = useState(parsed?.num ?? '')

  function update(d: string, n: string) {
    onChange(n ? d + n : '')
  }

  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 bg-white">
      <select
        value={dial}
        onChange={e => { setDial(e.target.value); update(e.target.value, num) }}
        className="border-r border-gray-100 pl-2 pr-1 py-2 text-sm bg-white focus:outline-none cursor-pointer text-gray-700 flex-shrink-0 max-w-[120px]"
      >
        <optgroup label="─────────────">
          {PRIORITY_COUNTRIES.map(c => (
            <option key={c.code} value={c.dial}>
              {c.code} {c.dial} {c.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="─────────────">
          {OTHER_COUNTRIES.map(c => (
            <option key={c.code} value={c.dial}>
              {c.code} {c.dial} {c.name}
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

// ── ContactPills ──────────────────────────────────────────────────────────────
const CONTACT_OPTIONS = [
  {
    key: 'telegram',
    label: 'Telegram',
    active: 'bg-sky-500 text-white border-sky-500',
    inactive: 'bg-white text-gray-500 border-gray-200 hover:border-sky-300',
    icon: <TgIcon />,
  },
  {
    key: 'email',
    label: 'Email',
    active: 'bg-violet-500 text-white border-violet-500',
    inactive: 'bg-white text-gray-500 border-gray-200 hover:border-violet-300',
    icon: <EmailIcon />,
  },
] as const

function ContactPills({
  selected,
  onChange,
}: {
  selected: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CONTACT_OPTIONS.map(opt => {
        const on = selected === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${on ? opt.active : opt.inactive}`}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
import type { ApplicationPrefill } from '@/app/booking/page'

type Props = {
  teacher: Teacher
  slot: CalendarSlot
  subject: string
  onSuccess: () => void
  onCancel: () => void
  prefill?: ApplicationPrefill
  adjustedPrice?: number
  refToken?: string
}

type FormData = {
  student_name: string
  student_email: string
  student_phone: string
  contact_pref: string
  is_minor: boolean
  parent_name: string
  parent_contact: string
  parent_email: string
  parent_pref: string
}

export default function BookingForm({ teacher, slot, subject, onSuccess, onCancel, prefill, adjustedPrice, refToken }: Props) {
  const { t, lang } = useLang()
  const ft = t.form
  const [form, setForm] = useState<FormData>(() => ({
    student_name: prefill?.name ?? '',
    student_email: prefill?.email ?? '',
    student_phone: prefill?.phone ?? '',
    contact_pref: prefill?.contact_pref ?? 'telegram',
    is_minor: prefill?.is_minor ?? false,
    parent_name: prefill?.parent_name ?? '',
    parent_contact: prefill?.parent_contact ?? '',
    parent_email: prefill?.parent_email ?? '',
    parent_pref: prefill?.parent_pref ?? 'telegram',
  }))
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)

  const set = (key: keyof FormData, value: string | boolean | string[]) =>
    setForm(f => ({ ...f, [key]: value }))

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!isValidEmail(form.student_email)) errs.student_email = ft.invalidEmail
    if (!isValidLocalPhone(form.student_phone)) errs.student_phone = ft.invalidPhone
    if (form.is_minor && !isValidLocalPhone(form.parent_contact)) errs.parent_contact = ft.invalidPhone
    if (form.is_minor && form.parent_email && !isValidEmail(form.parent_email)) errs.parent_email = ft.invalidEmail
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting.current) return
    if (!validate()) return
    submitting.current = true
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
          student_name: form.student_name,
          student_email: form.student_email,
          student_phone: form.student_phone,
          contact_pref: form.contact_pref || 'telegram',
          is_minor: form.is_minor,
          parent_name: form.is_minor ? form.parent_name : null,
          parent_contact: form.is_minor ? form.parent_contact : null,
          parent_email: form.is_minor ? (form.parent_email || null) : null,
          parent_pref: form.is_minor ? (form.parent_pref || null) : null,
          ...(refToken ? { ref_token: refToken } : {}),
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
      submitting.current = false
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
        {adjustedPrice != null && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {adjustedPrice}€/h
          </div>
        )}
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
            initialValue={prefill?.phone}
          />
          {fieldErrors.student_phone && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.student_phone}</p>
          )}
        </Field>

        <Field label={ft.preferredContact} required>
          <ContactPills
            selected={form.contact_pref}
            onChange={v => set('contact_pref', v as string)}
          />
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
                initialValue={prefill?.parent_contact ?? undefined}
              />
              {fieldErrors.parent_contact && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.parent_contact}</p>
              )}
            </Field>
            <Field label={ft.parentEmail} error={fieldErrors.parent_email}>
              <input
                type="email"
                value={form.parent_email}
                onChange={e => { set('parent_email', e.target.value); setFieldErrors(f => ({ ...f, parent_email: undefined })) }}
                className={`${inputClass} ${fieldErrors.parent_email ? 'border-red-300 focus:ring-red-300' : ''}`}
                placeholder="parent@email.com"
              />
            </Field>
            <Field label={ft.parentPref}>
              <ContactPills
                selected={form.parent_pref}
                onChange={v => set('parent_pref', v as string)}
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

function TgIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
