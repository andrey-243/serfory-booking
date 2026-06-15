'use client'

import { Teacher } from '@/lib/supabase'
import { useLang } from '@/lib/language-context'

type Props = {
  teacher: Teacher
  selected: boolean
  onClick: () => void
}

export default function TeacherCard({ teacher, selected, onClick }: Props) {
  const { t } = useLang()
  const photo = teacher.photo_url || teacher.google_photo_url
  const initials = teacher.name.split(' ').map(n => n[0]).join('')

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        {photo ? (
          <img
            src={photo}
            alt={teacher.name}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-full flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-2 ring-blue-100">
            <span className="text-blue-600 font-semibold text-xl">{initials}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{teacher.name}</p>
          {teacher.title && (
            <p className="text-[11px] text-blue-500 font-medium mt-0.5">{teacher.title}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 border-t border-gray-100 pt-3">
        {(teacher.levels || teacher.subjects?.length > 0) && (
          <div className="flex items-start gap-2 text-[11px] text-gray-500">
            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{teacher.levels || teacher.subjects.join(' · ')}</span>
          </div>
        )}
        {teacher.experience_years && (
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t.booking.experienceYears.replace('{n}', String(teacher.experience_years))}</span>
          </div>
        )}
        {teacher.teaching_languages?.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>{teacher.teaching_languages.map(l => t.booking.teachingLangs[l as keyof typeof t.booking.teachingLangs] ?? l).join(' · ')}</span>
          </div>
        )}
      </div>
    </button>
  )
}
