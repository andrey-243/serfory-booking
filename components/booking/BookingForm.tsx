'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { enUS, et, ru } from 'date-fns/locale'
import { Teacher } from '@/lib/supabase'
import { CalendarSlot } from '@/lib/google-calendar'
import { useLang } from '@/lib/language-context'

const dateFnsLocales = { en: enUS, et, ru }

// ── Country list ─────────────────────────────────────────────────────────────

type Country = { code: string; dial: string; name: string }

function toFlag(code: string): string {
  return [...code.toUpperCase()]
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('')
}

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
        className="border-r border-gray-100 pl-2 pr-1 py-2 text-sm bg-white focus:outline-none cursor-pointer text-gray-700 flex-shrink-0 max-w-[120px]"
      >
        <optgroup label="─────────────">
          {PRIORITY_COUNTRIES.map(c => (
            <option key={c.code} value={c.dial}>
              {toFlag(c.code)} {c.dial} {c.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="─────────────">
          {OTHER_COUNTRIES.map(c => (
            <option key={c.code} value={c.dial}>
              {toFlag(c.code)} {c.dial} {c.name}
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
    key: 'whatsapp',
    label: 'WhatsApp',
    active: 'bg-emerald-500 text-white border-emerald-500',
    inactive: 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300',
    icon: <WaIcon />,
  },
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
  selected: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(key: string) {
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key])
  }
  return (
    <div className="flex gap-2 flex-wrap">
      {CONTACT_OPTIONS.map(opt => {
        const on = selected.includes(opt.key)
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => toggle(opt.key)}
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
  contact_pref: string[]
  is_minor: boolean
  parent_name: string
  parent_contact: string
  parent_pref: string[]
}

export default function BookingForm({ teacher, slot, subject, onSuccess, onCancel }: Props) {
  const { t, lang } = useLang()
  const ft = t.form
  const [form, setForm] = useState<FormData>({
    student_name: '',
    student_email: '',
    student_phone: '',
    contact_pref: ['whatsapp'],
    is_minor: false,
    parent_name: '',
    parent_contact: '',
    parent_pref: [],
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof FormData, value: string | boolean | string[]) =>
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
          student_name: form.student_name,
          student_email: form.student_email,
          student_phone: form.student_phone,
          contact_pref: form.contact_pref.join(',') || 'whatsapp',
          is_minor: form.is_minor,
          parent_name: form.is_minor ? form.parent_name : null,
          parent_contact: form.is_minor ? form.parent_contact : null,
          parent_pref: form.is_minor ? (form.parent_pref.join(',') || null) : null,
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
          <ContactPills
            selected={form.contact_pref}
            onChange={v => set('contact_pref', v)}
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
              />
              {fieldErrors.parent_contact && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.parent_contact}</p>
              )}
            </Field>
            <Field label={ft.parentPref}>
              <ContactPills
                selected={form.parent_pref}
                onChange={v => set('parent_pref', v)}
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

function WaIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
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
