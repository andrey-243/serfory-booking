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

type Props = {
  value: string
  onChange: (tz: string) => void
  className?: string
}

export default function TimezoneSelect({ value, onChange, className = '' }: Props) {
  const options = buildTzOptions()
  const currentOffset = getOffsetMinutes(value)
  const currentLabel = formatOffset(currentOffset)

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-gray-400 text-xs">🌐</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs text-gray-600 bg-transparent border-none outline-none cursor-pointer pr-4 appearance-none"
        style={{ backgroundImage: 'none' }}
      >
        {options.map(o => (
          <option key={o.iana} value={o.iana}>{o.label}</option>
        ))}
      </select>
      <span className="text-[10px] font-medium text-blue-500 pointer-events-none">{currentLabel}</span>
    </div>
  )
}
