import { useState } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LangContext'
import { useUser, useRefreshUser } from '../hooks/useUser'

export default function Shop() {
  const [buying, setBuying] = useState(false)
  const { T } = useLang()
  const { data: userData } = useUser()
  const refreshUser = useRefreshUser()

  const buyEgg = async () => {
    if (buying || !userData) return
    if (userData.coin < 100) return alert(T.coin_lack)
    setBuying(true)
    const { data, error } = await supabase.rpc('safe_buy_egg', { uid: userData.id })
    if (error || !data?.ok) {
      alert(T.coin_lack)
      setBuying(false)
      return
    }
    const { data: charData } = await supabase.from('characters').select('name, grade').eq('id', data.char_id).single()
    await refreshUser()
    alert(T.egg_result(charData?.grade, charData?.name))
    setBuying(false)
  }

  const buySlot = async () => {
    if (!userData || userData.coin < 200) return alert(T.coin_lack)
    await supabase.rpc('add_reward', { uid: userData.id, amount: -200 })
    await refreshUser()
    alert(T.slot_done)
  }

  if (!userData) return <div className="px-loading">로딩 중...</div>

  const items = [
    {
      emoji:    '🥚',
      name:     T.random_egg,
      desc:     T.random_egg_desc,
      rates:    T.random_egg_rates,
      price:    100,
      action:   buyEgg,
      disabled: userData.coin < 100 || buying,
    },
    {
      emoji:    '🔓',
      name:     T.slot_expand,
      desc:     T.slot_expand_desc,
      price:    200,
      action:   buySlot,
      disabled: userData.coin < 200,
    },
  ]

  return (
    <div style={{ padding: '14px 16px 0' }}>

      {/* Currency row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{
          flex: 1, background: 'var(--card)', borderRadius: 16,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>🪙</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{T.coin}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)' }}>{userData.coin}</div>
          </div>
        </div>
        <div style={{
          flex: 1, background: 'var(--card)', borderRadius: 16,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{T.energy}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)' }}>{userData.energy}</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--input-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
                {item.emoji} {item.name}
              </span>
              <span style={{
                background: 'rgba(244,166,42,0.12)', borderRadius: 100,
                padding: '4px 10px', fontSize: 13, fontWeight: 700, color: 'var(--gold)',
              }}>
                🪙 {item.price}
              </span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0, lineHeight: 1.6 }}>
                {item.desc}
              </p>
              {item.rates && (
                <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, lineHeight: 1.7 }}>
                  {item.rates}
                </p>
              )}
              <button
                className={item.disabled ? 'px-btn-br' : 'px-btn'}
                onClick={item.action}
                disabled={item.disabled}
              >
                {item.disabled ? `🪙 ${item.price} (코인 부족)` : `구매 🪙 ${item.price}`}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
