import { createContext, useContext, useState, useEffect } from 'react'
import { t, detectLang } from './i18n'
import { supabase } from './supabase'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => detectLang())

  // 로그인 상태면 DB에서 언어 불러오기
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('language')
        .eq('auth_id', user.id)
        .single()
      if (data?.language) setLangState(data.language)
    }
    load()
  }, [])

  const setLang = async (code) => {
    setLangState(code)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ language: code }).eq('auth_id', user.id)
    }
  }

  return (
    <LangContext.Provider value={{ lang, setLang, T: t[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
