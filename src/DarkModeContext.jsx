import { createContext, useContext, useState, useEffect } from 'react'

const DarkModeContext = createContext()

export function DarkModeProvider({ children }) {
  const [hell, setHell] = useState(() => {
    try { return localStorage.getItem('hellMode') === '1' } catch { return false }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', hell ? 'dark' : 'light')
    try { localStorage.setItem('hellMode', hell ? '1' : '0') } catch {}
  }, [hell])

  return (
    <DarkModeContext.Provider value={{ hell, setHell }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export const useHellMode = () => useContext(DarkModeContext)
