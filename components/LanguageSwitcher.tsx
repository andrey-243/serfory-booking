'use client'

import { useLang } from '@/lib/language-context'
import { Lang } from '@/lib/i18n'

const LABELS: Record<Lang, string> = { en: 'EN', et: 'ET', ru: 'RU' }

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang()

  return (
    <div className="flex items-center gap-1">
      {(['en', 'et', 'ru'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
            lang === l
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
