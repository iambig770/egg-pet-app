import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { cache } from '../cache'

export default function Profile() {
  const [userData, setUserData] = useState(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const cached = cache.get('profile')
    if (cached) {
      setUserData(cached.userData)
      setEmail(cached.email)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email)
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()
    if (data) {
      setUserData(data)
      cache.set('profile', { userData: data, email: user.email })
    }
  }

  const logout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return
    cache.clear()
    await supabase.auth.signOut()
  }

  if (!userData) return <div style={{ padding: 20 }}>로딩 중...</div>

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>내 정보</h2>

      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: '#2F6B5A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700 }}>
            {email[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{email}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>🔥 {userData.streak}일 연속 달성</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div style={{ padding: '12px 16px', background: '#F5F3EE', borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: '#888' }}>코인</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>🪙 {userData.coin}</div>
          </div>
          <div style={{ padding: '12px 16px', background: '#F5F3EE', borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: '#888' }}>에너지</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>⚡ {userData.energy}</div>
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        style={{ width: '100%', padding: 14, background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
      >
        로그아웃
      </button>
    </div>
  )
}