import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [logs, setLogs] = useState([])
  const [newGoal, setNewGoal] = useState('')
  const [userId, setUserId] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single()
        if (data) {
          setUserId(data.id)
          fetchGoals()
          fetchLogs()
        }
      }
    })
  }, [])

  const fetchGoals = async () => {
    const { data } = await supabase.from('goals').select('*').order('created_at')
    setGoals(data || [])
  }

  const fetchLogs = async () => {
    const { data } = await supabase.from('goal_logs').select('*').eq('achieved_date', today)
    setLogs(data || [])
  }

  const addGoal = async () => {
    if (!newGoal.trim()) return
    await supabase.from('goals').insert({ user_id: userId, title: newGoal })
    setNewGoal('')
    fetchGoals()
  }

  const toggleGoal = async (goal) => {
    const done = logs.find(l => l.goal_id === goal.id)
    if (done) {
      await supabase.from('goal_logs').delete().eq('id', done.id)
      await supabase.rpc('add_reward', { uid: userId, amount: -10 })
    } else {
      await supabase.from('goal_logs').insert({
        goal_id: goal.id, user_id: userId, achieved_date: today
      })
      await supabase.rpc('add_reward', { uid: userId, amount: 10 })
      await supabase.rpc('update_streak', { uid: userId })
      await supabase.rpc('update_party_achievement', { uid: userId })
    }
    fetchLogs()
  }

  const deleteAll = async () => {
    if (!window.confirm(`목표 ${goals.length}개를 전부 삭제할까요?`)) return
    await supabase.from('goals').delete().in('id', goals.map(g => g.id))
    fetchGoals()
    fetchLogs()
  }

  const isDone = (goalId) => logs.some(l => l.goal_id === goalId)

  const undoneGoals = goals.filter(g => !isDone(g.id))
  const doneGoals = goals.filter(g => isDone(g.id))

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>
          오늘 목표 <span style={{ color: '#2F6B5A' }}>{logs.length}</span> / {goals.length}
        </h2>
        {goals.length > 0 && (
          <button
            onClick={deleteAll}
            style={{
              padding: '6px 12px', background: '#fff', color: '#e74c3c',
              border: '1px solid #e74c3c', borderRadius: 8,
              fontWeight: 700, fontSize: 13, cursor: 'pointer'
            }}
          >
            전체 삭제
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={newGoal}
          onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGoal()}
          placeholder="새 목표 입력"
          style={{ flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
        />
        <button
          onClick={addGoal}
          style={{ padding: '10px 16px', background: '#2F6B5A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}
        >
          추가
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {undoneGoals.map(goal => (
          <div
            key={goal.id}
            onClick={() => toggleGoal(goal)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: '#fff',
              border: '1px solid #ddd', borderRadius: 12, cursor: 'pointer'
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 7, flexShrink: 0,
              background: '#fff', border: '2px solid #ccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} />
            <span style={{ fontSize: 15, flex: 1 }}>{goal.title}</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>+10</span>
          </div>
        ))}

        {doneGoals.length > 0 && (
          <div style={{ margin: '8px 0 4px', fontSize: 12, color: '#aaa', fontWeight: 600 }}>
            완료한 목표
          </div>
        )}

        {doneGoals.map(goal => (
          <div
            key={goal.id}
            onClick={() => toggleGoal(goal)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: '#F5F3EE',
              border: '1px solid #E8E4DC', borderRadius: 12, cursor: 'pointer',
              opacity: 0.7
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 7, flexShrink: 0,
              background: '#2F6B5A', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: '#fff', fontSize: 14 }}>✓</span>
            </div>
            <span style={{
              fontSize: 15, flex: 1, color: '#aaa',
              textDecoration: 'line-through'
            }}>
              {goal.title}
            </span>
            <span style={{ fontSize: 12, color: '#ccc' }}>완료</span>
          </div>
        ))}
      </div>
    </div>
  )
}