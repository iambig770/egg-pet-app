import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Party() {
  const [userData, setUserData] = useState(null)
  const [party, setParty] = useState(null)
  const [members, setMembers] = useState([])
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: u } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()
    setUserData(u)

    const { data: pm } = await supabase
      .from('party_members')
      .select('party_id')
      .eq('user_id', u.id)
      .single()

    if (pm) {
      const { data: p } = await supabase
        .from('parties')
        .select('*')
        .eq('id', pm.party_id)
        .single()
      setParty(p)

      const { data: m } = await supabase
        .from('party_members')
        .select('*, users(nickname, email)')
        .eq('party_id', pm.party_id)
      setMembers(m || [])
    }
  }

  const createParty = async () => {
    if (loading) return
    setLoading(true)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: p, error } = await supabase
      .from('parties')
      .insert({ invite_code: code, owner_id: userData.id })
      .select()
      .single()
    if (!error) {
      await supabase.from('party_members').insert({
        party_id: p.id, user_id: userData.id, achieved_today: false
      })
      await fetchAll()
    }
    setLoading(false)
  }

  const joinParty = async () => {
    if (!inviteCode.trim()) return
    const { data: p } = await supabase
      .from('parties')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()
    if (!p) return alert('존재하지 않는 코드입니다')

    const { data: existing } = await supabase
      .from('party_members')
      .select('id')
      .eq('party_id', p.id)
      .eq('user_id', userData.id)
      .single()
    if (existing) return alert('이미 참여 중인 파티입니다')

    const { count } = await supabase
      .from('party_members')
      .select('id', { count: 'exact' })
      .eq('party_id', p.id)
    if (count >= 10) return alert('파티 인원이 가득 찼습니다')

    await supabase.from('party_members').insert({
      party_id: p.id, user_id: userData.id, achieved_today: false
    })
    await fetchAll()
  }

  const leaveParty = async () => {
    if (!window.confirm('파티를 나가시겠습니까?')) return
    await supabase.from('party_members')
      .delete()
      .eq('party_id', party.id)
      .eq('user_id', userData.id)

    const { count } = await supabase
      .from('party_members')
      .select('id', { count: 'exact' })
      .eq('party_id', party.id)
    if (count === 0) {
      await supabase.from('parties').delete().eq('id', party.id)
    }
    setParty(null)
    setMembers([])
  }

  const kickMember = async (memberId) => {
    if (!window.confirm('이 파티원을 강퇴하시겠습니까?')) return
    await supabase.from('party_members').delete().eq('id', memberId)
    await fetchAll()
  }

  const copyCode = () => {
    navigator.clipboard.writeText(party.invite_code)
    alert('초대 코드가 복사됐습니다!')
  }

  if (!userData) return <div style={{ padding: 20 }}>로딩 중...</div>

  const isOwner = party?.owner_id === userData.id
  const achievedCount = members.filter(m => m.achieved_today).length
  const allAchieved = members.length > 0 && achievedCount === members.length

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>파티</h2>

      {!party ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={createParty}
            disabled={loading}
            style={{
              padding: 16, background: '#2F6B5A', color: '#fff',
              border: 'none', borderRadius: 12, fontWeight: 700,
              fontSize: 15, cursor: 'pointer'
            }}
          >
            방 만들기
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="초대 코드 입력"
              style={{ flex: 1, padding: 12, border: '1px solid #ddd', borderRadius: 10, fontSize: 15, textTransform: 'uppercase' }}
            />
            <button
              onClick={joinParty}
              style={{
                padding: '12px 16px', background: '#fff', color: '#2F6B5A',
                border: '1px solid #2F6B5A', borderRadius: 10,
                fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}
            >
              입장
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>초대 코드</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4 }}>
                {party.invite_code}
              </span>
              <button
                onClick={copyCode}
                style={{
                  padding: '6px 12px', background: '#f5f5f5',
                  border: '1px solid #ddd', borderRadius: 8,
                  fontSize: 13, cursor: 'pointer'
                }}
              >
                복사
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 700 }}>파티원 {members.length} / 10</span>
              <span style={{ fontSize: 13, color: allAchieved ? '#2F6B5A' : '#888' }}>
                {achievedCount} / {members.length} 달성
              </span>
            </div>

            <div style={{ height: 8, borderRadius: 4, background: '#ECE8E0', marginBottom: 16 }}>
              <div style={{
                width: members.length > 0 ? `${(achievedCount / members.length) * 100}%` : '0%',
                height: 8, borderRadius: 4,
                background: allAchieved ? '#2F6B5A' : '#f39c12',
                transition: 'width 0.3s'
              }} />
            </div>

            {allAchieved && (
              <div style={{
                padding: '8px 12px', background: '#E3EEEA',
                borderRadius: 8, fontSize: 13, color: '#234F43',
                fontWeight: 600, marginBottom: 12, textAlign: 'center'
              }}>
                🎉 전원 달성! 보상 +30%
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid #f5f5f5'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 18,
                    background: '#ECE8E0', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#888'
                  }}>
                    {(m.users?.nickname || m.users?.email || '?')[0].toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: 14 }}>
                    {m.users?.nickname || m.users?.email}
                    {m.user_id === userData.id && <span style={{ color: '#888', fontSize: 12 }}> (나)</span>}
                    {m.user_id === party.owner_id && <span style={{ color: '#f39c12', fontSize: 12 }}> 방장</span>}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: m.achieved_today ? '#2F6B5A' : '#ccc'
                  }}>
                    {m.achieved_today ? '달성' : '미달성'}
                  </span>
                  {isOwner && m.user_id !== userData.id && (
                    <button
                      onClick={() => kickMember(m.id)}
                      style={{
                        background: 'none', border: 'none',
                        color: '#e74c3c', fontSize: 18,
                        cursor: 'pointer', padding: '0 4px'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={leaveParty}
            style={{
              padding: 14, background: '#fff', color: '#e74c3c',
              border: '1px solid #e74c3c', borderRadius: 12,
              fontWeight: 700, fontSize: 14, cursor: 'pointer'
            }}
          >
            파티 나가기
          </button>
        </div>
      )}
    </div>
  )
}