'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/lib/language-context'
import { ApplicationPrefill } from '@/app/booking/page'

type Session = {
  id: string
  session_date: string
  start_time: string
  session_start_utc: string | null
}

type Batch = {
  id: string
  subject: string
  start_date: string
  start_time: string
  duration_minutes: number
  max_students: number
  enrollment_count: number
  group_slot_sessions: Session[]
  teachers?: { name: string; photo_url?: string | null }
  teacher_id: string
}

type Props = {
  subject: string
  refToken: string
  prefill?: ApplicationPrefill
  onSuccess: () => void
}

function formatDate(dateStr: string, lang: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString(
    lang === 'et' ? 'et-EE' : lang === 'ru' ? 'ru-RU' : 'en-GB',
    { weekday: 'short', month: 'short', day: 'numeric' }
  )
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

function getBrowserTz(): string { return Intl.DateTimeFormat().resolvedOptions().timeZone }
function getTzAbbr(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? tz
}
function formatSessionUtc(utcIso: string, lang: string): { date: string; time: string; tzAbbr: string } {
  const tz = getBrowserTz()
  const d = new Date(utcIso)
  const locale = lang === 'et' ? 'et-EE' : lang === 'ru' ? 'ru-RU' : 'en-GB'
  return {
    date: d.toLocaleDateString(locale, { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }),
    tzAbbr: getTzAbbr(d, tz),
  }
}

export default function GroupBatchView({ subject, refToken, prefill, onSuccess }: Props) {
  const { t, lang } = useLang()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/group-slots?subject=${encodeURIComponent(subject)}`)
      .then(r => r.json())
      .then(d => setBatches(d.batches || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [subject])

  const [enrolledBatchId, setEnrolledBatchId] = useState<string | null>(null)

  async function handleEnroll(batchId: string) {
    setEnrolling(batchId)
    setError(null)
    try {
      const res = await fetch('/api/group-slots/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId, ref_token: refToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'Already enrolled in this batch') {
          setEnrolledBatchId(batchId)
          return
        }
        setError(data.error || 'Enrollment failed')
        return
      }
      setEnrolledBatchId(batchId)
      onSuccess()
    } catch {
      setError('Something went wrong')
    } finally {
      setEnrolling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-gray-200/70 animate-pulse" />
        ))}
      </div>
    )
  }

  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
        No group sessions available for {subject} yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}
      {batches.map(batch => {
        const spotsLeft = batch.max_students - batch.enrollment_count
        const isFull = spotsLeft <= 0
        const isExpanded = expanded === batch.id
        const sessions = batch.group_slot_sessions.slice().sort((a, b) => {
          const aT = a.session_start_utc ? new Date(a.session_start_utc).getTime() : new Date(a.session_date).getTime()
          const bT = b.session_start_utc ? new Date(b.session_start_utc).getTime() : new Date(b.session_date).getTime()
          return aT - bT
        })
        const firstSession = sessions[0]
        const firstFmt = firstSession?.session_start_utc ? formatSessionUtc(firstSession.session_start_utc, lang) : null

        return (
          <div
            key={batch.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(isExpanded ? null : batch.id)}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{subject} — Group</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                  }`}>
                    {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {firstFmt
                    ? <>{firstFmt.date} · {firstFmt.time} <span className="text-gray-400">{firstFmt.tzAbbr}</span> · 4 weeks</>
                    : <>{formatDate(batch.start_date, lang)} · {formatTime(batch.start_time)} · 4 weeks</>
                  }
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {sessions.map((s, i) => {
                    const fmt = s.session_start_utc ? formatSessionUtc(s.session_start_utc, lang) : null
                    return (
                      <div key={s.id} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-[10px] flex-shrink-0">
                          {i + 1}
                        </span>
                        {fmt
                          ? <>{fmt.date}, {fmt.time} <span className="text-gray-400">{fmt.tzAbbr}</span></>
                          : <>{formatDate(s.session_date, lang)}, {formatTime(s.start_time)}</>
                        }
                      </div>
                    )
                  })}
                </div>

                {prefill && (
                  <p className="text-xs text-gray-400">
                    Enrolling as <span className="font-medium text-gray-600">{prefill.name}</span>
                  </p>
                )}

                {enrolledBatchId === batch.id ? (
                  <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center bg-green-50 text-green-700 border border-green-200">
                    Enrolled
                  </div>
                ) : (
                  <button
                    onClick={() => handleEnroll(batch.id)}
                    disabled={isFull || enrolling === batch.id}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isFull
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60'
                    }`}
                  >
                    {enrolling === batch.id ? 'Enrolling…' : isFull ? 'Full' : 'Join this group'}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
