'use client'

import { useLang } from '@/lib/language-context'

const COURSES = ['Russian', 'English', 'Estonian', 'Spanish', 'Math'] as const
export type Course = (typeof COURSES)[number]

type Props = {
  selected: Course
  onChange: (course: Course) => void
}

export default function CourseTabFilter({ selected, onChange }: Props) {
  const { t } = useLang()

  return (
    <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 shadow-sm">
      {COURSES.map(course => (
        <button
          key={course}
          onClick={() => onChange(course)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            selected === course
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          {t.booking.courses[course]}
        </button>
      ))}
    </div>
  )
}
