'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

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

const TRANSLATIONS = {
  fr: {
    title: 'Administration',
    bookings: (n: number) => `${n} réservation${n > 1 ? 's' : ''}`,
    logout: 'Déconnexion',
    all: 'Tous',
    loading: 'Chargement…',
    empty: 'Aucune réservation.',
    status: { pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé' },
    cols: { date: 'Date / Heure', teacher: 'Professeur', course: 'Cours', student: 'Étudiant', contact: 'Contact', status: 'Statut' },
    minor: 'Mineur',
    dateFormat: "d MMM 'à' HH'h'mm",
    locale: fr,
  },
  en: {
    title: 'Administration',
    bookings: (n: number) => `${n} booking${n > 1 ? 's' : ''}`,
    logout: 'Sign out',
    all: 'All',
    loading: 'Loading…',
    empty: 'No bookings.',
    status: { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' },
    cols: { date: 'Date / Time', teacher: 'Teacher', course: 'Course', student: 'Student', contact: 'Contact', status: 'Status' },
    minor: 'Minor',
    dateFormat: "d MMM 'at' HH:mm",
    locale: enUS,
  },
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [lang, setLang] = useState<'fr' | 'en'>('fr')

  const t = TRANSLATIONS[lang]

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
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{t.bookings(bookings.length)}</span>

            {/* Language toggle */}
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold shadow-sm">
              {(['fr', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 transition-colors uppercase ${
                    lang === l ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <a href="/api/auth/logout" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              {t.logout}
            </a>
          </div>
        </div>

        {/* Filters */}
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
              {s === 'all' ? t.all : t.status[s]}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-gray-400">{t.loading}</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">{t.empty}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                  <th className="text-left px-4 py-3 font-medium">{t.cols.date}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.cols.teacher}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.cols.course}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.cols.student}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.cols.contact}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.cols.status}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">
                      {format(parseISO(b.slot_start), t.dateFormat, { locale: t.locale })}
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
                          {t.minor} — {b.parent_name} ({b.parent_contact})
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
                        {t.status[b.status as keyof typeof t.status] ?? b.status}
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
