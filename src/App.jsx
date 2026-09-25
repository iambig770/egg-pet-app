import { HashRouter as BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { LangProvider, useLang } from './LangContext'
import { DarkModeProvider, useHellMode } from './DarkModeContext'
import Kingdom from './pages/Kingdom'
import Goals from './pages/Goals'
import CharacterTab from './pages/CharacterTab'
import Shop from './pages/Shop'
import Party from './pages/Party'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Help from './pages/Help'
import Attendance from './Attendance'
import UpdateNotice from './UpdateNotice'

const NAV_MENUS = [
  { path: '/goals',     icon: '🎯', key: 'nav_goals'     },
  { path: '/party',     icon: '⚔️', key: 'nav_party'     },
  { path: '/',          icon: '🏰', key: 'nav_kingdom'   },
  { path: '/character', icon: '🐣', key: 'nav_character' },
  { path: '/shop',      icon: '🛒', key: 'nav_shop'      },
]

const PAGE_TITLES = {
  '/':          'nav_kingdom',
  '/goals':     'nav_goals',
  '/shop':      'nav_shop',
  '/party':     'nav_party',
  '/character': 'nav_character',
  '/profile':   'title_profile',
  '/help':      'title_help',
}

function TopBar() {
  const { pathname } = useLocation()
  const { T } = useLang()
  const { hell } = useHellMode()
  const titleKey = PAGE_TITLES[pathname]
  const title = titleKey ? (T[titleKey] || '') : ''
  return (
    <div style={{
      position: 'fixed', top: 0,
      left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: hell ? 'rgba(9,9,15,0.90)' : 'rgba(241,241,246,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid ' + (hell ? 'rgba(255,45,45,0.15)' : 'rgba(0,0,0,0.06)'),
      color: hell ? '#F0F0F0' : '#202020',
      fontFamily: 'var(--font)',
      fontSize: 17,
      fontWeight: 700,
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 50,
      boxSizing: 'border-box',
      transition: 'background 0.4s, border-color 0.4s',
    }}>
      <span>{title}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to="/help"    style={{ textDecoration: 'none', fontSize: 20, lineHeight: 1, opacity: 0.6 }}>❓</Link>
        <Link to="/profile" style={{ textDecoration: 'none', fontSize: 20, lineHeight: 1, opacity: 0.6 }}>👤</Link>
      </div>
    </div>
  )
}

function BottomNav() {
  const { pathname } = useLocation()
  const { T } = useLang()
  const { hell } = useHellMode()
  return (
    <nav style={{
      position: 'fixed', bottom: 14,
      left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 28px)',
      maxWidth: 402,
      height: 64,
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      background: hell ? 'rgba(17,17,24,0.94)' : 'rgba(254,254,254,0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 22,
      border: '1px solid ' + (hell ? 'rgba(255,45,45,0.20)' : 'rgba(255,255,255,0.7)'),
      boxShadow: hell ? '0 4px 24px rgba(255,0,0,0.12)' : '0 4px 24px rgba(0,0,0,0.10)',
      boxSizing: 'border-box',
      zIndex: 50,
      transition: 'background 0.4s, border-color 0.4s, box-shadow 0.4s',
    }}>
      {NAV_MENUS.map(m => {
        const active = pathname === m.path
        return (
          <Link
            key={m.path}
            to={m.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{m.icon}</span>
            <span style={{
              fontFamily: 'var(--font)',
              fontSize: 9,
              fontWeight: 600,
              color: active ? (hell ? '#FF2D2D' : '#3472D8') : '#9A9AA2',
              letterSpacing: 0,
            }}>{T[m.key] || ''}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function AppInner() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [showAttendance, setShowAttendance] = useState(false)
  const { T } = useLang()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) fetchUserAndCheckAttendance()
  }, [session])

  const fetchUserAndCheckAttendance = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: u } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
    setUserData(u)
    const today = new Date().toLocaleDateString('en-CA')
    const { data: logs } = await supabase.from('attendance_logs').select('day, claimed_date').eq('user_id', u.id).order('day')
    const totalClaimed = logs?.length || 0
    const claimedToday = logs?.some(l => l.claimed_date === today) || false
    setShowAttendance(totalClaimed < 7 && !claimedToday)
  }

  if (loading) return <div className="px-loading">로딩 중...</div>
  if (!session) return <Login />

  return (
    <>
      <TopBar />
      {showAttendance && userData && (
        <Attendance
          userId={userData.id}
          userData={userData}
          onClose={() => setShowAttendance(false)}
          onReward={fetchUserAndCheckAttendance}
        />
      )}
      <div style={{ paddingBottom: 90, paddingTop: 52 }} className="page-enter">
        <Routes>
          <Route path="/"          element={<Kingdom />} />
          <Route path="/goals"     element={<Goals />} />
          <Route path="/character" element={<CharacterTab />} />
          <Route path="/shop"      element={<Shop />} />
          <Route path="/party"     element={<Party />} />
          <Route path="/profile"   element={<Profile />} />
          <Route path="/help"      element={<Help />} />
        </Routes>
      </div>
      <UpdateNotice />
      <BottomNav />
    </>
  )
}

function AppWrapper() {
  const { lang } = useLang()
  return <AppInner key={lang} />
}

export default function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <LangProvider>
          <AppWrapper />
        </LangProvider>
      </BrowserRouter>
    </DarkModeProvider>
  )
}
