import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useLang } from './LangContext'

export default function Attendance({ userId, userData, onClose, onReward }) {
  const [claimed, setClaimed] = useState([])
  const [claimedToday, setClaimedToday] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const { T } = useLang()
  const today = new Date().toLocaleDateString('en-CA')

  const REWARDS = [
    { day: 1, label: T.reward_egg,    emoji: '🥚' },
    { day: 2, label: T.reward_energy, emoji: '⚡' },
    { day: 3, label: T.reward_coin,   emoji: '🪙' },
    { day: 4, label: T.reward_energy, emoji: '⚡' },
    { day: 5, label: T.reward_coin,   emoji: '🪙' },
    { day: 6, label: T.reward_energy, emoji: '⚡' },
    { day: 7, label: T.reward_coin,   emoji: '🪙' },
  ]

  useEffect(() => { fetchClaimed() }, [])

  const fetchClaimed = async () => {
    const { data } = await supabase.from('attendance_logs').select('day, claimed_date').eq('user_id', userId).order('day')
    setClaimed(data?.map(d => d.day) || [])
    setClaimedToday(data?.some(d => d.claimed_date === today) || false)
  }

  const todayDay = claimed.length + 1
  const canClaim = todayDay <= 7 && !claimedToday

  const claimReward = async () => {
    if (claiming || !canClaim) return
    setClaiming(true)
    const reward = REWARDS[todayDay - 1]
    if (todayDay === 1) {
      const { data: charId } = await supabase.rpc('get_random_character')
      await supabase.from('user_characters').insert({ user_id: userId, character_id: charId, stage: 0, star: 1, meals_fed: 0 })
    } else if (reward.label.includes(T.reward_energy.split(' ')[0])) {
      await supabase.rpc('add_reward', { uid: userId, amount: 20 })
    } else {
      await supabase.rpc('add_reward', { uid: userId, amount: 20 })
    }
    await supabase.from('attendance_logs').insert({ user_id: userId, day: todayDay, claimed_date: today })
    await fetchClaimed()
    onReward()
    setClaiming(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.40)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 200,
    }}>
      <div style={{
        width: '100%', maxWidth: 430,
        background: 'var(--card)',
        borderRadius: '24px 24px 0 0',
        padding: '24px 20px 32px',
      }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
            {T.attendance_title}
          </div>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>{T.attendance_desc}</div>
        </div>

        {/* 보상 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {REWARDS.map(r => {
            const isClaimed = claimed.includes(r.day)
            const isToday   = r.day === todayDay && !claimedToday
            return (
              <div key={r.day} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 4px', borderRadius: 14,
                background: isClaimed ? 'var(--input-bg)' : isToday ? '#EAF1FF' : 'var(--card)',
                border: isToday
                  ? '2px solid var(--accent)'
                  : '1px solid var(--input-bg)',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)' }}>{r.day}일</span>
                <span style={{ fontSize: 22 }}>{r.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 600, textAlign: 'center', color: 'var(--t2)' }}>{r.label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: isClaimed ? 'var(--accent)' : isToday ? 'var(--accent)' : 'transparent' }}>
                  {isClaimed ? T.attendance_claimed : isToday ? T.attendance_today : '.'}
                </span>
              </div>
            )
          })}
        </div>

        {/* 액션 */}
        {canClaim ? (
          <button
            onClick={claimReward}
            disabled={claiming}
            className="px-btn"
            style={{ marginBottom: 10, opacity: claiming ? 0.45 : 1 }}
          >
            {T.attendance_claim(todayDay)}
          </button>
        ) : todayDay > 7 ? (
          <div style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            {T.attendance_done}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 13, marginBottom: 10 }}>
            {T.attendance_tomorrow}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: 12, background: 'none', border: 'none',
            color: 'var(--t3)', fontSize: 14, cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}
        >
          {T.close}
        </button>
      </div>
    </div>
  )
}
