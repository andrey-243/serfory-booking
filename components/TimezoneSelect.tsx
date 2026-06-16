'use client'

const TZ_ZONES = [
  { iana: 'Pacific/Honolulu',     cities: 'Honolulu' },
  { iana: 'America/Anchorage',    cities: 'Anchorage' },
  { iana: 'America/Los_Angeles',  cities: 'Los Angeles, Vancouver' },
  { iana: 'America/Denver',       cities: 'Denver, Phoenix' },
  { iana: 'America/Chicago',      cities: 'Chicago, Mexico City' },
  { iana: 'America/New_York',     cities: 'New York, Toronto' },
  { iana: 'America/Sao_Paulo',    cities: 'São Paulo, Buenos Aires' },
  { iana: 'Europe/London',        cities: 'London, Lisbon' },
  { iana: 'Europe/Paris',         cities: 'Paris, Berlin, Warsaw' },
  { iana: 'Europe/Helsinki',      cities: 'Helsinki, Tallinn, Riga' },
  { iana: 'Europe/Moscow',        cities: 'Moscow, Minsk' },
  { iana: 'Asia/Istanbul',        cities: 'Istanbul, Kyiv' },
  { iana: 'Asia/Dubai',           cities: 'Dubai, Baku' },
  { iana: 'Asia/Karachi',         cities: 'Karachi, Tashkent' },
  { iana: 'Asia/Kolkata',         cities: 'Mumbai, Delhi' },
  { iana: 'Asia/Almaty',          cities: 'Almaty, Bishkek' },
  { iana: 'Asia/Bangkok',         cities: 'Bangkok, Jakarta' },
  { iana: 'Asia/Shanghai',        cities: 'Beijing, Singapore' },
  { iana: 'Asia/Tokyo',           cities: 'Tokyo, Seoul' },
  { iana: 'Australia/Sydney',     cities: 'Sydney, Melbourne' },
]

function getOffsetMinutes(iana: string): number {
  const now = new Date()
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  const local = new Date(now.toLocaleString('en-US', { timeZone: iana }))
  return Math.round((local.getTime() - utc.getTime()) / 60000)
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-'
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${String(m).padStart(2, '0')}`
}

export function buildTzOptions() {
  return TZ_ZONES.map(z => ({
    iana: z.iana,
    offsetMin: getOffsetMinutes(z.iana),
    label: `${formatOffset(getOffsetMinutes(z.iana))} · ${z.cities}`,
  })).sort((a, b) => a.offsetMin - b.offsetMin)
}

function GlobeIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="w-3 h-3 text-gray-400 flex-shrink-0 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

type Props = {
  value: string
  onChange: (tz: string) => void
  className?: string
}

export default function TimezoneSelect({ value, onChange, className = '' }: Props) {
  const options = buildTzOptions()
  const currentOption = options.find(o => o.iana === value)
  const currentLabel = currentOption?.label ?? formatOffset(getOffsetMinutes(value))

  return (
    <div className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer ${className}`}>
      <GlobeIcon />
      <span className="text-xs text-gray-600 whitespace-nowrap pointer-events-none">{currentLabel}</span>
      <ChevronIcon />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Timezone"
      >
        {options.map(o => (
          <option key={o.iana} value={o.iana}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
