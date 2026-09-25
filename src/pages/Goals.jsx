import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LangContext'

const PERIODS = ['daily', 'weekly', 'monthly']
const PERIOD_KO = { daily: '일간', weekly: '주간', monthly: '월간' }

function getDateRange(period) {
  const now = new Date()
  const today = now.toLocaleDateString('en-CA')
  if (period === 'daily') return { start: today, end: today }
  if (period === 'weekly') {
    const day = now.getDay()
    const diff = (day === 0 ? -6 : 1) - day
    const mon = new Date(now); mon.setDate(now.getDate() + diff)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return { start: mon.toLocaleDateString('en-CA'), end: sun.toLocaleDateString('en-CA') }
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA')
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA')
  return { start, end }
}

export default function Goals() {
  const [period, setPeriod]         = useState('daily')
  const [allGoals, setAllGoals]     = useState([])
  const [logs, setLogs]             = useState([])
  const [newGoal, setNewGoal]       = useState('')
  const [userId, setUserId]         = useState(null)
  const [calModal, setCalModal]     = useState(null)
  const [calUrl, setCalUrl]         = useState('')
  const [savedCalUrl, setSavedCalUrl] = useState('')
  const [calLoading, setCalLoading] = useState(false)
  const [calError, setCalError]     = useState('')
  const [calEvents, setCalEvents]   = useState([])
  const [picked, setPicked]         = useState([])
  const { T } = useLang()
  const today = new Date().toLocaleDateString('en-CA')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('users').select('id, calendar_url').eq('auth_id', user.id).single()
      if (data) {
        setUserId(data.id)
        if (data.calendar_url) setSavedCalUrl(data.calendar_url)
      }
    })
  }, [])

  useEffect(() => {
    if (userId) { fetchGoals(); fetchLogs() }
  }, [userId])

  useEffect(() => {
    if (userId) fetchLogs()
  }, [period, userId])

  const fetchGoals = async () => {
    const { data } = await supabase.from('goals').select('*').eq('user_id', userId).order('created_at')
    setAllGoals(data || [])
  }

  const fetchLogs = async () => {
    const { start, end } = getDateRange(period)
    const { data } = await supabase
      .from('goal_logs').select('*').eq('user_id', userId)
      .gte('achieved_date', start).lte('achieved_date', end)
    setLogs(data || [])
  }

  const goals = allGoals.filter(g => (g.period || 'daily') === period)

  const addGoal = async () => {
    if (!newGoal.trim()) return
    const tempId = 'temp-' + Date.now()
    setAllGoals(prev => [...prev, { id: tempId, title: newGoal, user_id: userId, period, created_at: new Date().toISOString() }])
    setNewGoal('')
    const { data } = await supabase.from('goals').insert({ user_id: userId, title: newGoal, period }).select().single()
    if (data) setAllGoals(prev => prev.map(g => g.id === tempId ? data : g))
    else setAllGoals(prev => prev.filter(g => g.id !== tempId))
  }

  const toggleGoal = async (goal) => {
    const done = logs.find(l => l.goal_id === goal.id)
    if (done) {
      setLogs(prev => prev.filter(l => l.id !== done.id))
      await supabase.from('goal_logs').delete().eq('id', done.id)
      await supabase.rpc('add_reward', { uid: userId, amount: -10 })
    } else {
      const tmp = { id: 'tmp-' + Date.now(), goal_id: goal.id, user_id: userId, achieved_date: today }
      setLogs(prev => [...prev, tmp])
      const { data } = await supabase.from('goal_logs').insert({ goal_id: goal.id, user_id: userId, achieved_date: today }).select().single()
      if (data) setLogs(prev => prev.map(l => l.id === tmp.id ? data : l))
      else setLogs(prev => prev.filter(l => l.id !== tmp.id))
      await supabase.rpc('add_reward', { uid: userId, amount: 10 })
      await supabase.rpc('update_streak', { uid: userId })
      await supabase.rpc('update_party_achievement', { uid: userId })
    }
  }

  const deleteAll = async () => {
    if (!window.confirm(T.delete_all_confirm(goals.length))) return
    setAllGoals(prev => prev.filter(g => (g.period || 'daily') !== period))
    await supabase.from('goals').delete().in('id', goals.map(g => g.id))
  }

  const openUrlModal = () => { setCalUrl(savedCalUrl); setCalError(''); setCalModal('url') }

  const importCalendar = async (url) => {
    const cleanUrl = (url || '').trim()
    if (!cleanUrl) return
    setCalLoading(true); setCalError('')
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(start.getTime() + 86399999)
    const { data, error } = await supabase.functions.invoke('fetch-calendar', {
      body: { url: cleanUrl, start: start.toISOString(), end: end.toISOString() }
    })
    setCalLoading(false)
    if (error || !data?.events) { setCalUrl(cleanUrl); setCalError(T.cal_error); setCalModal('url'); return }
    if (cleanUrl !== savedCalUrl) {
      await supabase.from('users').update({ calendar_url: cleanUrl }).eq('id', userId)
      setSavedCalUrl(cleanUrl)
    }
    if (data.events.length === 0) { alert(T.cal_empty); setCalModal(null); return }
    const titles = [...new Set(data.events.map(e => e.title))]
    setCalEvents(titles)
    setPicked(titles.filter(t => !goals.map(g => g.title).includes(t)))
    setCalModal('pick')
  }

  const addPicked = async () => {
    if (picked.length === 0) { setCalModal(null); return }
    const { data } = await supabase.from('goals').insert(picked.map(title => ({ user_id: userId, title, period }))).select()
    if (data) setAllGoals(prev => [...prev, ...data])
    setCalModal(null)
  }

  const isDone = (id) => logs.some(l => l.goal_id === id)
  const undone = goals.filter(g => !isDone(g.id))
  const done   = goals.filter(g =>  isDone(g.id))
  const S = { padding: '0 20px' }

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* ── 기간 탭 ── */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 20px 0' }}>
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            flex: 1, padding: '9px 0',
            background: period === p ? 'var(--accent)' : 'var(--input-bg)',
            border: 'none', borderRadius: 100,
            color: period === p ? '#fff' : 'var(--t3)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            fontFamily: 'var(--font)',
            transition: 'all 0.15s',
          }}>
            {PERIOD_KO[p]}
          </button>
        ))}
      </div>

      {/* ── 헤더 + 액션 버튼 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 0' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{PERIOD_KO[period]} 목표</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {period === 'daily' && (
            savedCalUrl
              ? <>
                  <button onClick={() => importCalendar(savedCalUrl)} disabled={calLoading}
                    style={{ padding: '6px 10px', background: 'var(--card)', border: '1px solid var(--input-bg)', borderRadius: 10, fontSize: 11, fontWeight: 600, color: 'var(--t2)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    {calLoading ? T.cal_loading : '📅 ' + T.cal_today}
                  </button>
                  <button onClick={openUrlModal}
                    style={{ padding: '6px 8px', background: 'var(--card)', border: '1px solid var(--input-bg)', borderRadius: 10, fontSize: 11, fontWeight: 600, color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    {T.cal_change}
                  </button>
                </>
              : <button onClick={openUrlModal}
                  style={{ padding: '6px 10px', background: 'var(--card)', border: '1px solid var(--input-bg)', borderRadius: 10, fontSize: 11, fontWeight: 600, color: 'var(--t2)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                  📅 {T.cal_connect}
                </button>
          )}
          {goals.length > 0 && (
            <button onClick={deleteAll}
              style={{ padding: '6px 8px', background: 'var(--card)', border: '1px solid var(--input-bg)', borderRadius: 10, fontSize: 11, fontWeight: 600, color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
              {T.delete_all}
            </button>
          )}
        </div>
      </div>

      {/* ── 진행 카드 ── */}
      {goals.length > 0 && (
        <div style={{
          margin: '14px 20px 0',
          background: 'linear-gradient(135deg, var(--accent), #5A90F0)',
          borderRadius: 20, padding: '18px 20px', color: '#fff',
        }}>
          <div style={{ fontSize: 12, opacity: 0.85 }}>달성 현황</div>
          <div style={{ fontSize: 26, fontWeight: 700, margin: '6px 0 12px' }}>
            {done.length} / {goals.length} 완료
          </div>
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 100, height: 6 }}>
            <div style={{
              width: `${goals.length > 0 ? (done.length / goals.length) * 100 : 0}%`,
              height: 6, borderRadius: 100, background: '#fff', transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* ── 입력 ── */}
      <div style={{
        margin: '12px 20px 0',
        background: 'var(--card)', borderRadius: 16,
        padding: '4px 4px 4px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <input
          type="text"
          placeholder={T.add_goal}
          value={newGoal}
          onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGoal()}
          style={{
            flex: 1, border: 'none', background: 'none',
            fontSize: 15, color: 'var(--t1)', outline: 'none',
            padding: '10px 0', fontFamily: 'var(--font)',
          }}
        />
        <button onClick={addGoal} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 12, width: 38, height: 38,
          fontSize: 22, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>+</button>
      </div>

      {/* ── 빈 상태 ── */}
      {goals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--t3)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{T.add_goal}</div>
        </div>
      )}

      {/* ── 미완료 목표 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 20px 0' }}>
        {undone.map(goal => (
          <div key={goal.id} onClick={() => toggleGoal(goal)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', background: 'var(--card)',
            borderRadius: 16, cursor: 'pointer',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              border: '2px solid var(--input-bg)', flexShrink: 0,
            }} />
            <span style={{ flex: 1, fontSize: 15, color: 'var(--t1)' }}>{goal.title}</span>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>+10</span>
          </div>
        ))}
      </div>

      {/* ── 완료 목표 ── */}
      {done.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 20px 0' }}>
          {done.map(goal => (
            <div key={goal.id} onClick={() => toggleGoal(goal)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: 'var(--card)',
              borderRadius: 16, cursor: 'pointer', opacity: 0.55,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--accent)', border: '2px solid var(--accent)',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 13,
              }}>✓</div>
              <span style={{ flex: 1, fontSize: 15, color: 'var(--t2)', textDecoration: 'line-through' }}>{goal.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── 캘린더 URL 모달 ── */}
      {calModal === 'url' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.40)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--card)', borderRadius: '24px 24px 0 0', padding: 24, width: '100%', maxWidth: 430 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, color: 'var(--t1)' }}>📅 {T.cal_modal_title}</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>{T.cal_modal_desc}</p>
            {calError && <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--red)' }}>{calError}</p>}
            <input value={calUrl} onChange={e => setCalUrl(e.target.value)} placeholder={T.cal_placeholder}
              style={{ width: '100%', padding: '14px 16px', background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'var(--font)', color: 'var(--t1)', outline: 'none' }} />
            <button onClick={() => importCalendar(calUrl)} disabled={calLoading}
              style={{ width: '100%', padding: 14, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 8, fontFamily: 'var(--font)' }}>
              {calLoading ? T.cal_connecting : T.cal_do_connect}
            </button>
            <button onClick={() => setCalModal(null)}
              style={{ width: '100%', padding: 14, background: 'var(--input-bg)', color: 'var(--t2)', border: 'none', borderRadius: 14, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)' }}>
              {T.close}
            </button>
          </div>
        </div>
      )}

      {/* ── 캘린더 선택 모달 ── */}
      {calModal === 'pick' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.40)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--card)', borderRadius: '24px 24px 0 0', padding: 24, width: '100%', maxWidth: 430, maxHeight: '80dvh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, color: 'var(--t1)' }}>{T.cal_pick_title}</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>{T.cal_pick_desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {calEvents.map(title => {
                const checked = picked.includes(title)
                const already = goals.map(g => g.title).includes(title)
                return (
                  <div key={title} onClick={() => setPicked(prev => checked ? prev.filter(t => t !== title) : [...prev, title])}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: checked ? '#EEF4FF' : 'var(--input-bg)', border: `1.5px solid ${checked ? 'var(--accent)' : 'transparent'}`, borderRadius: 14, cursor: 'pointer' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: checked ? 'var(--accent)' : 'transparent', border: `2px solid ${checked ? 'var(--accent)' : 'var(--t3)'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {checked && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--t1)' }}>{title}</span>
                    {already && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{T.cal_already}</span>}
                  </div>
                )
              })}
            </div>
            <button onClick={addPicked}
              style={{ width: '100%', padding: 14, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 8, fontFamily: 'var(--font)' }}>
              {T.cal_add(picked.length)}
            </button>
            <button onClick={() => setCalModal(null)}
              style={{ width: '100%', padding: 14, background: 'var(--input-bg)', color: 'var(--t2)', border: 'none', borderRadius: 14, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)' }}>
              {T.close}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
