'use client'

import { Teacher } from '@/lib/supabase'

type Props = {
  teacher: Teacher
  selected: boolean
  onClick: () => void
}

export default function TeacherCard({ teacher, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        {teacher.photo_url ? (
          <img
            src={teacher.photo_url}
            alt={teacher.name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-semibold text-lg">
              {teacher.name[0]}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900 text-sm">{teacher.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{teacher.subjects.join(', ')}</p>
        </div>
      </div>
    </button>
  )
}
