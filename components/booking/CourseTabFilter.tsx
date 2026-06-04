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
    <div className="flex gap-2 flex-wrap">
      {COURSES.map(course => (
        <button
          key={course}
          onClick={() => onChange(course)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            selected === course
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400 hover:text-blue-500'
          }`}
        >
          {t.booking.courses[course]}
        </button>
      ))}
    </div>
  )
}
