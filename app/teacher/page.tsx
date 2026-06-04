'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

type Booking = {
  id: string
  subject: string
  slot_start: string
  slot_end: string
  student_name: string
  status: string
}

export default function TeacherPage() {
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [connected, setConnected] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') setConnected(true)
    const tid = params.get('teacherId') || localStorage.getItem('teacherId')
    if (tid) {
      setTeacherId(tid)
      fetch(`/api/bookings?teacherId=${tid}`)
        .then(r => r.json())
        .then(d => setBookings(d.bookings || []))
    }
  }, [])

  const upcoming = bookings.filter(b => new Date(b.slot_start) >= new Date())

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Espace professeur</h1>

        {connected && (
          <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Google Calendar connecté avec succès.
          </div>
        )}

        {/* Onboarding Google Calendar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-1">Connecter Google Calendar</h2>
          <p className="text-sm text-gray-500 mb-3">
            Connectez votre agenda Google pour que vos créneaux disponibles soient visibles aux étudiants.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <a
              href={email ? `/api/auth/google?email=${encodeURIComponent(email)}` : '#'}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                email ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 pointer-events-none'
              }`}
            >
              Connecter
            </a>
          </div>
        </div>

        {/* Cours à venir */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Cours à venir ({upcoming.length})</h2>
          {!teacherId ? (
            <p className="text-sm text-gray-400">Ajoutez ?teacherId=... à l'URL pour voir vos cours.</p>
          ) : upcoming.length === 0 ? (
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
