'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

type Booking = {
  id: string
  subject: string
  slot_start: string
  slot_end: string
  student_name: string
  status: string
}

type AvailabilityRow = {
  day_of_week: number
  start_time: string
  end_time: string
  enabled: boolean
}

type User = { email: string; role: string; teacherId: string | null; name: string }

export default function TeacherPage() {
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [availability, setAvailability] = useState<AvailabilityRow[]>(
    DAYS.map((_, i) => ({ day_of_week: i, start_time: '09:00', end_time: '18:00', enabled: i >= 1 && i <= 5 }))
  )
  const [savingAvail, setSavingAvail] = useState(false)
  const [savedAvail, setSavedAvail] = useState(false)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (d.user) {
        setUser(d.user)
        if (d.user.teacherId) {
          fetch(`/api/bookings?teacherId=${d.user.teacherId}`)
            .then(r => r.json())
            .then(d => setBookings(d.bookings || []))
          fetch(`/api/availability?teacherId=${d.user.teacherId}`)
            .then(r => r.json())
            .then(d => {
              if (d.availability?.length > 0) {
                setAvailability(prev => prev.map(row => {
                  const saved = d.availability.find((a: { day_of_week: number }) => a.day_of_week === row.day_of_week)
                  return saved
                    ? { ...row, start_time: saved.start_time.slice(0, 5), end_time: saved.end_time.slice(0, 5), enabled: true }
                    : { ...row, enabled: false }
                }))
              }
            })
        }
      }
    })
  }, [])

  const upcoming = bookings.filter(b => new Date(b.slot_start) >= new Date())

  async function saveAvailability() {
    if (!user?.teacherId) return
    setSavingAvail(true)
    const rows = availability
      .filter(r => r.enabled)
      .map(r => ({ day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time }))

    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_id: user.teacherId, availability: rows }),
    })
    setSavingAvail(false)
    setSavedAvail(true)
    setTimeout(() => setSavedAvail(false), 3000)
  }

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Espace professeur</h1>
            {user && <p className="text-sm text-gray-500 mt-0.5">{user.name}</p>}
          </div>
          <a href="/api/auth/logout" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Déconnexion
          </a>
        </div>

        {/* Google Calendar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-1">Google Calendar</h2>
          <p className="text-sm text-gray-500 mb-3">
            Votre calendrier est connecté. Vos événements existants sont pris en compte pour les créneaux disponibles.
            Reconnectez si vous changez de compte Google.
          </p>
          <a
            href="/api/auth/google"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <GoogleIcon />
            Reconnecter Google Calendar
          </a>
        </div>

        {/* Disponibilités */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-1">Mes disponibilités</h2>
          <p className="text-sm text-gray-500 mb-4">
            Définissez vos plages horaires disponibles. En dehors de ces plages, aucun créneau ne sera proposé aux étudiants.
          </p>

          <div className="space-y-2">
            {availability.map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAvailability(prev => prev.map((r, j) => j === i ? { ...r, enabled: !r.enabled } : r))}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ${row.enabled ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${row.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="w-24 text-sm text-gray-700">{DAYS[row.day_of_week]}</span>
                {row.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={row.start_time}
                      onChange={e => setAvailability(prev => prev.map((r, j) => j === i ? { ...r, start_time: e.target.value } : r))}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-gray-400 text-sm">–</span>
                    <input
                      type="time"
                      value={row.end_time}
                      onChange={e => setAvailability(prev => prev.map((r, j) => j === i ? { ...r, end_time: e.target.value } : r))}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Indisponible</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={saveAvailability}
            disabled={savingAvail || !user?.teacherId}
            className="mt-4 px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {savingAvail ? 'Sauvegarde…' : savedAvail ? '✓ Sauvegardé' : 'Sauvegarder'}
          </button>
        </div>

        {/* Cours à venir */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Cours à venir ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun cours prévu.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map(b => (
                <li key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.student_name}</p>
                    <p className="text-xs text-gray-500">
                      {b.subject} — {format(parseISO(b.slot_start), "d MMM 'à' HH'h'mm", { locale: fr })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    b.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {b.status === 'confirmed' ? 'Confirmé' : b.status === 'cancelled' ? 'Annulé' : 'En attente'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
