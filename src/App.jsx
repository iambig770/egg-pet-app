import { HashRouter as BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Home from './pages/Home'
import Goals from './pages/Goals'
import Dex from './pages/Dex'
import Shop from './pages/Shop'
import Party from './pages/Party'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Help from './pages/Help'
import Attendance from './Attendance'

function BottomNav() {
  const { pathname } = useLocation()
  const menus = [
    { path: '/goals', label: '목표' },
    { path: '/party', label: '파티' },
    { path: '/', label: '홈' },
    { path: '/shop', label: '상점' },
    { path: '/dex', label: '도감' },
  ]
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      borderTop: '1px solid #ddd', background: '#fff', height: 60
    }}>
      {menus.map(m => (
        <Link key={m.path} to={m.path} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
          color: pathname === m.path ? '#2F6B5A' : '#888',
          fontWeight: pathname === m.path ? 700 : 400,
          fontSize: 13
        }}>
          {m.label}
        </Link>
      ))}
    </nav>
  )
}

function TopBar() {
  const { pathname } = useLocation()
  const titles = {
    '/': '홈', '/goals': '목표', '/dex': '도감',
    '/shop': '상점', '/party': '파티',
    '/profile': '내 정보', '/help': '사용법'
  }
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 52, background: '#fff', borderBottom: '1px solid #ddd',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', zIndex: 50
    }}>
      <span style={{ fontWeight: 700, fontSize: 16 }}>{titles[pathname] || ''}</span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link to="/help" style={{ textDecoration: 'none', fontSize: 22 }}>❓</Link>
        <Link to="/profile" style={{ textDecoration: 'none', fontSize: 22 }}>👤</Link>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [showAttendance, setShowAttendance] = useState(false)

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
    const { data: u } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()
    setUserData(u)

    const today = new Date().toISOString().split('T')[0]

    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('day, claimed_date')
      .eq('user_id', u.id)
      .order('day')

    const totalClaimed = logs?.length || 0
    const claimedToday = logs?.some(l => l.claimed_date === today) || false

    if (totalClaimed < 7 && !claimedToday) {
      setShowAttendance(true)
    } else {
      setShowAttendance(false)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>로딩 중...</div>
  if (!session) return <Login />

  return (
    <BrowserRouter>
      <TopBar />
      {showAttendance && userData && (
        <Attendance
          userId={userData.id}
          userData={userData}
          onClose={() => setShowAttendance(false)}
          onReward={fetchUserAndCheckAttendance}
        />
      )}
      <div style={{ paddingBottom: 60, paddingTop: 52 }} className="page-enter">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/dex" element={<Dex />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/party" element={<Party />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  )
}