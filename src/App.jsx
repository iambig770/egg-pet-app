import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Home from './pages/Home'
import Goals from './pages/Goals'
import Dex from './pages/Dex'
import Shop from './pages/Shop'
import Party from './pages/Party'
import Login from './pages/Login'
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

    const { count } = await supabase
      .from('attendance_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', u.id)

    if (count < 7) setShowAttendance(true)
  }

  if (loading) return <div style={{ padding: 24 }}>로딩 중...</div>
  if (!session) return <Login />

  return (
    <BrowserRouter>
      {showAttendance && userData && (
        <Attendance
          userId={userData.id}
          userData={userData}
          onClose={() => setShowAttendance(false)}
          onReward={fetchUserAndCheckAttendance}
        />
      )}
      <div style={{ paddingBottom: 60 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/dex" element={<Dex />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/party" element={<Party />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  )
}