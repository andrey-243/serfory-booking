'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Lang, LANGS, Translations } from './i18n'

type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: Translations }

const Ctx = createContext<LangCtx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('lang') as Lang
    if (LANGS.includes(p)) setLang(p)
  }, [])

  return (
    <Ctx.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </Ctx.Provider>
  )
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}
