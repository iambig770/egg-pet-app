import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LangContext'
import { useUser } from '../hooks/useUser'

export default function Party() {
  const [party,      setParty]      = useState(null)
  const [members,    setMembers]    = useState([])
  const [inviteCode, setInviteCode] = useState('')
  const [loading,    setLoading]    = useState(false)
  const { T } = useLang()
  const { data: userData } = useUser()

  useEffect(() => {
    if (userData) fetchParty(userData.id)
  }, [userData?.id])

  const fetchParty = async (uid) => {
    const { data: pm } = await supabase.from('party_members').select('party_id').eq('user_id', uid).single()
    if (pm) {
      const { data: p } = await supabase.from('parties').select('*').eq('id', pm.party_id).single()
      setParty(p)
      const { data: m } = await supabase.from('party_members').select('*, users(nickname, email)').eq('party_id', pm.party_id)
      setMembers(m || [])
    } else {
      setParty(null)
      setMembers([])
    }
  }

  const createParty = async () => {
    if (loading || !userData) return
    setLoading(true)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: p, error } = await supabase.from('parties').insert({ invite_code: code, owner_id: userData.id }).select().single()
    if (!error) {
      await supabase.from('party_members').insert({ party_id: p.id, user_id: userData.id, achieved_today: false })
      await fetchParty(userData.id)
    }
    setLoading(false)
  }

  const joinParty = async () => {
    if (!inviteCode.trim() || !userData) return
    const { data: p } = await supabase.from('parties').select('*').eq('invite_code', inviteCode.toUpperCase()).single()
    if (!p) return alert(T.no_code)
    const { data: existing } = await supabase.from('party_members').select('id').eq('party_id', p.id).eq('user_id', userData.id).single()
    if (existing) return alert(T.already_joined)
    const { count } = await supabase.from('party_members').select('id', { count: 'exact' }).eq('party_id', p.id)
    if (count >= 10) return alert(T.party_full)
    await supabase.from('party_members').insert({ party_id: p.id, user_id: userData.id, achieved_today: false })
    await fetchParty(userData.id)
  }

  const leaveParty = async () => {
    if (!window.confirm(T.leave_confirm) || !userData) return
    await supabase.from('party_members').delete().eq('party_id', party.id).eq('user_id', userData.id)
    const { count } = await supabase.from('party_members').select('id', { count: 'exact' }).eq('party_id', party.id)
    if (count === 0) await supabase.from('parties').delete().eq('id', party.id)
    setParty(null); setMembers([])
  }

  const kickMember = async (memberId) => {
    if (!window.confirm(T.kick_confirm)) return
    await supabase.from('party_members').delete().eq('id', memberId)
    await fetchParty(userData.id)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(party.invite_code)
    alert(T.copy_done)
  }

  if (!userData) return <div className="px-loading">로딩 중...</div>

  const isOwner       = party?.owner_id === userData.id
  const achievedCount = members.filter(m => m.achieved_today).length
  const allAchieved   = members.length > 0 && achievedCount === members.length
  const pct           = members.length > 0 ? (achievedCount / members.length) * 100 : 0

  return (
    <div style={{ padding: '14px 16px 0' }}>
      {!party ? (
        /* ── No party ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--input-bg)',
              fontSize: 15, fontWeight: 700, color: 'var(--t1)',
            }}>⚔️ 파티</div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', margin: 0 }}>
                파티를 만들거나 코드로 합류하세요
              </p>
              <button className="px-btn" onClick={createParty} disabled={loading}>
                {loading ? '생성 중...' : T.create_party}
              </button>
              <div className="px-divider" />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="px-input"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder={T.invite_placeholder}
                  style={{ flex: 1, textTransform: 'uppercase' }}
                />
                <button
                  onClick={joinParty}
                  style={{
                    padding: '12px 16px', background: 'var(--input-bg)',
                    border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, color: 'var(--t2)',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'var(--font)',
                  }}
                >
                  {T.join_party}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Party view ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Invite code card */}
          <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--input-bg)',
              fontSize: 15, fontWeight: 700, color: 'var(--t1)',
            }}>{T.invite_code}</div>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: 6 }}>
                {party.invite_code}
              </span>
              <button
                onClick={copyCode}
                style={{
                  background: 'var(--input-bg)', border: 'none', borderRadius: 10,
                  padding: '8px 14px', fontSize: 13, fontWeight: 600,
                  color: 'var(--t2)', cursor: 'pointer', fontFamily: 'var(--font)',
                }}
              >
                {T.copy_code}
              </button>
            </div>
          </div>

          {/* Members card */}
          <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--input-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
                {T.members(members.length)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: allAchieved ? 'var(--gold)' : 'var(--t3)' }}>
                {T.achieved(achievedCount, members.length)}
              </span>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="px-track">
                <div className={`px-fill${allAchieved ? ' gold' : ''}`} style={{ width: `${pct}%` }} />
              </div>

              {allAchieved && (
                <div style={{
                  background: 'rgba(244,166,42,0.1)', borderRadius: 12,
                  padding: '10px 16px', textAlign: 'center',
                  fontSize: 13, fontWeight: 700, color: 'var(--gold)',
                }}>
                  ✦ {T.all_achieved} ✦
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {members.map((m, i) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 0',
                    borderBottom: i < members.length - 1 ? '1px solid var(--input-bg)' : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                      background: 'var(--input-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 700, color: 'var(--t2)',
                    }}>
                      {(m.users?.nickname || m.users?.email || '?')[0].toUpperCase()}
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.users?.nickname || m.users?.email}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        {m.user_id === userData.id    && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{T.me}</span>}
                        {m.user_id === party.owner_id && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>OWNER</span>}
                      </div>
                    </div>

                    <span style={{ fontSize: 12, fontWeight: 600, color: m.achieved_today ? 'var(--accent)' : 'var(--t3)', flexShrink: 0 }}>
                      {m.achieved_today ? '✓ ' + T.achieved_label : T.not_achieved}
                    </span>

                    {isOwner && m.user_id !== userData.id && (
                      <button
                        onClick={() => kickMember(m.id)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--red)', fontSize: 18,
                          cursor: 'pointer', padding: '0 2px', lineHeight: 1,
                        }}
                      >×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="px-btn-red" onClick={leaveParty}>{T.leave_party}</button>
        </div>
      )}
    </div>
  )
}
