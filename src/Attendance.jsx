import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const REWARDS = [
  { day: 1, label: '랜덤 알', emoji: '🥚' },
  { day: 2, label: '에너지 20', emoji: '⚡' },
  { day: 3, label: '코인 20', emoji: '🪙' },
  { day: 4, label: '에너지 20', emoji: '⚡' },
  { day: 5, label: '코인 20', emoji: '🪙' },
  { day: 6, label: '에너지 20', emoji: '⚡' },
  { day: 7, label: '코인 20', emoji: '🪙' },
]

export default function Attendance({ userId, userData, onClose, onReward }) {
  const [claimed, setClaimed] = useState([])
  const [claimedToday, setClaimedToday] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchClaimed()
  }, [])

  const fetchClaimed = async () => {
    const { data } = await supabase
      .from('attendance_logs')
      .select('day, claimed_date')
      .eq('user_id', userId)
      .order('day')
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
      await supabase.from('user_characters').insert({
        user_id: userId, character_id: charId, stage: 0, star: 1, meals_fed: 0
      })
    } else if (reward.label.includes('에너지')) {
      await supabase.rpc('add_reward', { uid: userId, amount: 20 })
    } else if (reward.label.includes('코인')) {
      await supabase.rpc('add_reward', { uid: userId, amount: 20 })
    }

    await supabase.from('attendance_logs').insert({
      user_id: userId, day: todayDay, claimed_date: today
    })
    await fetchClaimed()
    onReward()
    setClaiming(false)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 20
    }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380 }}>
        <h3 style={{ margin: '0 0 4px' }}>첫 7일 출석 선물</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>
          가입 후 7일 동안만 열려요 · 하루 한 번
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {REWARDS.map(r => {
            const isClaimed = claimed.includes(r.day)
            const isToday = r.day === todayDay && !claimedToday
            return (
              <div key={r.day} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '10px 4px', borderRadius: 12,
                border: isToday ? '2px solid #2F6B5A' : '1px solid #ddd',
                background: isClaimed ? '#F5F3EE' : isToday ? '#E3EEEA' : '#fff'
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>{r.day}일</span>
                <span style={{ fontSize: 22 }}>{r.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', color: '#555' }}>{r.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: isClaimed ? '#2F6B5A' : isToday ? '#234F43' : 'transparent' }}>
                  {isClaimed ? '받음' : isToday ? '오늘' : '.'}
                </span>
              </div>
            )
          })}
        </div>

        {canClaim ? (
          <button
            onClick={claimReward}
            disabled={claiming}
            style={{
              width: '100%', padding: 14,
              background: claiming ? '#ccc' : '#2F6B5A',
              color: '#fff', border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 15, cursor: claiming ? 'default' : 'pointer',
              marginBottom: 12
            }}
          >
            {todayDay}일차 보상 받기
          </button>
        ) : todayDay > 7 ? (
          <div style={{ textAlign: 'center', color: '#2F6B5A', fontWeight: 700, marginBottom: 12 }}>
            🎉 7일 출석 완료!
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#888', marginBottom: 12, fontSize: 13 }}>
            내일 다시 받을 수 있습니다
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: 12, background: 'none',
            border: 'none', color: '#888', fontSize: 14, cursor: 'pointer'
          }}
        >
          닫기
        </button>
      </div>
    </div>
  )
}