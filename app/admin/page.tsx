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
  student_email: string
  student_phone: string
  contact_pref: string
  is_minor: boolean
  parent_name: string | null
  parent_contact: string | null
  status: string
  teachers: { name: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(d => { setBookings(d.bookings || []); setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <main className="min-h-screen bg-[#EEF2FF] p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <span className="text-sm text-gray-500">{bookings.length} réservation(s) au total</span>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-4">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === s
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
              }`}
            >
              {s === 'all' ? 'Tous' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-gray-400">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">Aucune réservation.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                  <th className="text-left px-4 py-3 font-medium">Date / Heure</th>
                  <th className="text-left px-4 py-3 font-medium">Professeur</th>
                  <th className="text-left px-4 py-3 font-medium">Cours</th>
                  <th className="text-left px-4 py-3 font-medium">Étudiant</th>
                  <th className="text-left px-4 py-3 font-medium">Contact</th>
                  <th className="text-left px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">
                      {format(parseISO(b.slot_start), "d MMM 'à' HH'h'mm", { locale: fr })}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{b.teachers?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{b.subject}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.student_name}</p>
                      <p className="text-xs text-gray-400">{b.student_email}</p>
                      <p className="text-xs text-gray-400">{b.student_phone}</p>
                      <p className="text-xs text-gray-400 capitalize">{b.contact_pref}</p>
                      {b.is_minor && (
                        <div className="mt-1 text-xs text-orange-600 bg-orange-50 rounded px-1.5 py-0.5 inline-block">
                          Mineur — {b.parent_name} ({b.parent_contact})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <a href={`mailto:${b.student_email}`} className="hover:text-blue-500">{b.student_email}</a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
