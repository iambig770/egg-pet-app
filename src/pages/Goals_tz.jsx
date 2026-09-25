import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [logs, setLogs] = useState([])
  const [newGoal, setNewGoal] = useState('')
  const [userId, setUserId] = useState(null)
  const [calModal, setCalModal] = useState(null) // 'url' = 주소 입력창, 'pick' = 일정 선택창
  const [calUrl, setCalUrl] = useState('')
  const [savedCalUrl, setSavedCalUrl] = useState('')
  const [calLoading, setCalLoading] = useState(false)
  const [calError, setCalError] = useState('')
  const [calEvents, setCalEvents] = useState([])
  const [picked, setPicked] = useState([])
  const today = new Date().toLocaleDateString('en-CA')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('id, calendar_url')
          .eq('auth_id', user.id)
          .single()
        if (data) {
          setUserId(data.id)
          if (data.calendar_url) setSavedCalUrl(data.calendar_url)
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
    const tempId = 'temp-' + Date.now()
    const tempGoal = { id: tempId, title: newGoal, user_id: userId, created_at: new Date().toISOString() }
    setGoals(prev => [...prev, tempGoal])
    setNewGoal('')
    const { data } = await supabase.from('goals').insert({ user_id: userId, title: tempGoal.title }).select().single()
    if (data) setGoals(prev => prev.map(g => g.id === tempId ? data : g))
    else setGoals(prev => prev.filter(g => g.id !== tempId))
  }

  const toggleGoal = async (goal) => {
    const done = logs.find(l => l.goal_id === goal.id)
    if (done) {
      setLogs(prev => prev.filter(l => l.id !== done.id))
      await supabase.from('goal_logs').delete().eq('id', done.id)
      await supabase.rpc('add_reward', { uid: userId, amount: -10 })
    } else {
      const tempLog = { id: 'temp-' + Date.now(), goal_id: goal.id, user_id: userId, achieved_date: today }
      setLogs(prev => [...prev, tempLog])
      const { data } = await supabase.from('goal_logs').insert({
        goal_id: goal.id, user_id: userId, achieved_date: today
      }).select().single()
      if (data) setLogs(prev => prev.map(l => l.id === tempLog.id ? data : l))
      else setLogs(prev => prev.filter(l => l.id !== tempLog.id))
      await supabase.rpc('add_reward', { uid: userId, amount: 10 })
      await supabase.rpc('update_streak', { uid: userId })
      await supabase.rpc('update_party_achievement', { uid: userId })
    }
  }

  const deleteAll = async () => {
    if (!window.confirm(`목표 ${goals.length}개를 전부 삭제할까요?`)) return
    setGoals([])
    setLogs([])
    await supabase.from('goals').delete().in('id', goals.map(g => g.id))
  }

  // 주소 입력창 열기 (저장된 주소가 있으면 미리 채워둠)
  const openUrlModal = () => {
    setCalUrl(savedCalUrl)
    setCalError('')
    setCalModal('url')
  }

  // Edge Function으로 오늘 일정 가져오기
  const importCalendar = async (url) => {
    const cleanUrl = (url || '').trim()
    if (!cleanUrl) return
    setCalLoading(true)
    setCalError('')

    // 오늘 0시 ~ 23시 59분 (기기 시간 기준)
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)

    const { data, error } = await supabase.functions.invoke('fetch-calendar', {
      body: { url: cleanUrl, start: start.toISOString(), end: end.toISOString() }
    })
    setCalLoading(false)

    // 실패하면 주소 입력창을 다시 띄워서 고칠 수 있게 함 (잘못된 주소는 저장 안 함)
    if (error || !data?.events) {
      console.error('캘린더 오류:', error || data)
      setCalUrl(cleanUrl)
      setCalError('캘린더를 가져오지 못했어요. 주소를 확인해 주세요.')
      setCalModal('url')
      return
    }

    // 성공한 주소만 저장
    if (cleanUrl !== savedCalUrl) {
      await supabase.from('users').update({ calendar_url: cleanUrl }).eq('id', userId)
      setSavedCalUrl(cleanUrl)
    }

    if (data.events.length === 0) {
      alert('오늘 일정이 없습니다.')
      setCalModal(null)
      return
    }

    // 같은 제목 중복 제거, 이미 목표에 있는 일정은 체크 해제 상태로 시작
    const titles = [...new Set(data.events.map(e => e.title))]
    const existing = goals.map(g => g.title)
    setCalEvents(titles)
    setPicked(titles.filter(t => !existing.includes(t)))
    setCalModal('pick')
  }

  const togglePick = (title) => {
    setPicked(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title])
  }

  // 체크한 일정만 목표로 추가
  const addPicked = async () => {
    if (picked.length === 0) { setCalModal(null); return }
    const { data } = await supabase
      .from('goals')
      .insert(picked.map(title => ({ user_id: userId, title })))
      .select()
    if (data) setGoals(prev => [...prev, ...data])
    setCalModal(null)
  }

  const isDone = (goalId) => logs.some(l => l.goal_id === goalId)
  const undoneGoals = goals.filter(g => !isDone(g.id))
  const doneGoals = goals.filter(g => isDone(g.id))
  const existingTitles = goals.map(g => g.title)

  const modalBg = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }
  const modalBox = { background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, maxHeight: '80vh', overflowY: 'auto', boxSizing: 'border-box' }
  const mainBtn = (disabled) => ({ width: '100%', padding: 14, background: disabled ? '#ccc' : '#2F6B5A', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: disabled ? 'default' : 'pointer', marginBottom: 8 })
  const closeBtn = { width: '100%', padding: 12, background: 'none', border: 'none', color: '#888', fontSize: 14, cursor: 'pointer' }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>
          오늘 목표 <span style={{ color: '#2F6B5A' }}>{logs.length}</span> / {goals.length}
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {savedCalUrl ? (
            <>
              <button onClick={() => importCalendar(savedCalUrl)} disabled={calLoading} style={{ padding: '6px 12px', background: '#2F6B5A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {calLoading ? '가져오는 중...' : '📅 오늘 일정'}
              </button>
              <button onClick={openUrlModal} style={{ padding: '6px 8px', background: 'none', color: '#888', border: 'none', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                주소 변경
              </button>
            </>
          ) : (
            <button onClick={openUrlModal} style={{ padding: '6px 12px', background: '#fff', color: '#2F6B5A', border: '1px solid #2F6B5A', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              📅 캘린더 연동
            </button>
          )}
          {goals.length > 0 && (
            <button onClick={deleteAll} style={{ padding: '6px 12px', background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {/* 주소 입력 / 변경 창 */}
      {calModal === 'url' && (
        <div style={modalBg}>
          <div style={modalBox}>
            <h3 style={{ margin: '0 0 8px' }}>📅 캘린더 연동</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>
              한 번 연동하면 다음부터는 버튼 하나로 오늘 일정을 가져옵니다.
            </p>
            {calError && (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#e74c3c' }}>{calError}</p>
            )}
            <input
              value={calUrl}
              onChange={e => setCalUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..."
              style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box', fontSize: 16, marginBottom: 12 }}
            />
            <button onClick={() => importCalendar(calUrl)} disabled={calLoading} style={mainBtn(calLoading)}>
              {calLoading ? '연동 중...' : '연동하기'}
            </button>
            <button onClick={() => setCalModal(null)} style={closeBtn}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 오늘 일정 선택 창 */}
      {calModal === 'pick' && (
        <div style={modalBg}>
          <div style={modalBox}>
            <h3 style={{ margin: '0 0 8px' }}>📅 오늘 일정</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>
              목표로 추가할 일정을 골라주세요.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {calEvents.map(title => {
                const checked = picked.includes(title)
                const already = existingTitles.includes(title)
                return (
                  <div key={title} onClick={() => togglePick(title)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10, cursor: 'pointer' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: checked ? '#2F6B5A' : '#fff', border: checked ? 'none' : '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {checked && <span style={{ color: '#fff', fontSize: 13 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 14, flex: 1 }}>{title}</span>
                    {already && <span style={{ fontSize: 11, color: '#aaa' }}>이미 있음</span>}
                  </div>
                )
              })}
            </div>
            <button onClick={addPicked} style={mainBtn(false)}>
              {picked.length}개 목표로 추가
            </button>
            <button onClick={() => setCalModal(null)} style={closeBtn}>
              닫기
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={newGoal}
          onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGoal()}
          placeholder="새 목표 입력"
          style={{ flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 16 }}
        />
        <button onClick={addGoal} style={{ padding: '10px 16px', background: '#2F6B5A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}>
          추가
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {undoneGoals.map(goal => (
          <div key={goal.id} onClick={() => toggleGoal(goal)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #ddd', borderRadius: 12, cursor: 'pointer' }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: '#fff', border: '2px solid #ccc' }} />
            <span style={{ fontSize: 15, flex: 1 }}>{goal.title}</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>+10</span>
          </div>
        ))}

        {doneGoals.length > 0 && (
          <div style={{ margin: '8px 0 4px', fontSize: 12, color: '#aaa', fontWeight: 600 }}>완료한 목표</div>
        )}

        {doneGoals.map(goal => (
          <div key={goal.id} onClick={() => toggleGoal(goal)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F5F3EE', border: '1px solid #E8E4DC', borderRadius: 12, cursor: 'pointer', opacity: 0.7 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: '#2F6B5A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 14 }}>✓</span>
            </div>
            <span style={{ fontSize: 15, flex: 1, color: '#aaa', textDecoration: 'line-through' }}>{goal.title}</span>
            <span style={{ fontSize: 12, color: '#ccc' }}>완료</span>
          </div>
        ))}
      </div>
    </div>
  )
}
