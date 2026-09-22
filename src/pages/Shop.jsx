import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Shop() {
  const [userData, setUserData] = useState(null)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()
    setUserData(data)
  }

  const buyEgg = async () => {
    if (buying) return
    if (userData.coin < 100) return alert('코인이 부족합니다')
    setBuying(true)
    const { data: charId } = await supabase.rpc('get_random_character')
    const { data: charData } = await supabase
      .from('characters')
      .select('name, grade')
      .eq('id', charId)
      .single()
    const { error } = await supabase
      .from('user_characters')
      .insert({ user_id: userData.id, character_id: charId, stage: 0, star: 1, meals_fed: 0 })
    if (!error) {
      await supabase.rpc('add_reward', { uid: userData.id, amount: -100 })
      await fetchUser()
      alert(`${charData.grade}등급 "${charData.name}" 알을 얻었습니다!`)
    }
    setBuying(false)
  }

  const buySlot = async () => {
    if (userData.coin < 200) return alert('코인이 부족합니다')
    await supabase.rpc('add_reward', { uid: userData.id, amount: -200 })
    await fetchUser()
    alert('슬롯이 확장됐습니다!')
  }

  if (!userData) return <div style={{ padding: 20 }}>로딩 중...</div>

  const items = [
    {
      emoji: '🥚',
      name: '랜덤 알',
      desc: '어떤 캐릭터가 나올지 모릅니다',
      price: 100,
      currency: '코인',
      rates: 'S 5% · A 20% · B 30% · C 45%',
      action: buyEgg,
      disabled: userData.coin < 100 || buying
    },
    {
      emoji: '🔓',
      name: '슬롯 확장',
      desc: '캐릭터를 한 마리 더 키울 수 있습니다',
      price: 200,
      currency: '코인',
      action: buySlot,
      disabled: userData.coin < 200
    },
  ]

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>상점</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '6px 12px', background: '#fff', border: '1px solid #ddd', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            🪙 {userData.coin}
          </div>
          <div style={{ padding: '6px 12px', background: '#fff', border: '1px solid #ddd', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            ⚡ {userData.energy}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: '#ECE8E0', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
              }}>
                {item.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{item.desc}</div>
                {item.rates && <div style={{ fontSize: 11, color: '#aaa' }}>{item.rates}</div>}
              </div>
              <button
                onClick={item.action}
                disabled={item.disabled}
                style={{
                  padding: '10px 14px', flexShrink: 0,
                  background: item.disabled ? '#eee' : '#2F6B5A',
                  color: item.disabled ? '#aaa' : '#fff',
                  border: 'none', borderRadius: 10,
                  fontWeight: 700, fontSize: 13,
                  cursor: item.disabled ? 'default' : 'pointer'
                }}
              >
                🪙 {item.price}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}