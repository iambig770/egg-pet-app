import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { cache } from '../cache'
import { useLang } from '../LangContext'
import { LANGS } from '../i18n'

const STAGE_EMOJI = ['🥚', '🐣', '🐥', '🐓']
const STAGE_LABEL = ['알', '병아리', '닭', '수탉']

export default function Profile() {
  const [userData,    setUserData]    = useState(null)
  const [email,       setEmail]       = useState('')
  const [friends,     setFriends]     = useState([])
  const [addCode,     setAddCode]     = useState('')
  const [addError,    setAddError]    = useState('')
  const [addDone,     setAddDone]     = useState(false)
  const [addLoading,  setAddLoading]  = useState(false)
  const [copied,      setCopied]      = useState(false)
  const { lang, setLang, T } = useLang()

  useEffect(() => { fetchUser() }, [])

  const fetchUser = async () => {
    const cached = cache.get('profile')
    if (cached) {
      setUserData(cached.userData)
      setEmail(cached.email)
      fetchFriends(cached.userData.id)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email)
    const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
    if (data) {
      setUserData(data)
      cache.set('profile', { userData: data, email: user.email })
      fetchFriends(data.id)
    }
  }

  const fetchFriends = async (uid) => {
    const { data: rows } = await supabase.from('friends').select('friend_id').eq('user_id', uid)
    const ids = rows?.map(r => r.friend_id) || []
    if (ids.length === 0) { setFriends([]); return }
    const { data: users } = await supabase.from('users').select('id, kingdom_name, profile_char_stage').in('id', ids)
    setFriends(users || [])
  }

  const logout = async () => {
    if (!window.confirm(T.logout_confirm)) return
    cache.clear()
    await supabase.auth.signOut()
  }

  const copyCode = () => {
    if (!userData?.friend_code) return
    navigator.clipboard.writeText(userData.friend_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const addFriend = async () => {
    const code = addCode.trim().toUpperCase()
    if (!code) return
    setAddLoading(true)
    setAddError('')
    setAddDone(false)

    const { data: target } = await supabase
      .from('users').select('id').eq('friend_code', code).single()

    if (!target) { setAddError('코드를 찾을 수 없어요 🤔'); setAddLoading(false); return }
    if (target.id === userData.id) { setAddError('본인을 추가할 수 없어요'); setAddLoading(false); return }

    await supabase.from('friends').upsert([
      { user_id: userData.id, friend_id: target.id },
      { user_id: target.id,   friend_id: userData.id },
    ])
    await fetchFriends(userData.id)
    setAddCode('')
    setAddDone(true)
    setTimeout(() => setAddDone(false), 2000)
    setAddLoading(false)
  }

  const saveProfileChar = async (stage) => {
    await supabase.from('users').update({ profile_char_stage: stage }).eq('id', userData.id)
    const updated = { ...userData, profile_char_stage: stage }
    setUserData(updated)
    cache.set('profile', { userData: updated, email })
  }

  if (!userData) return <div className="px-loading">로딩 중...</div>

  const avatarStage = userData.profile_char_stage ?? 0

  return (
    <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── 아바타 + 기본 정보 ── */}
      <div style={{ background: 'var(--card)', borderRadius: 20, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28,
            background: 'var(--input-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, flexShrink: 0,
          }}>
            {STAGE_EMOJI[avatarStage]}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
            <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 3 }}>
              {T.streak_label(userData.streak)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div style={{ padding: '12px 16px', background: 'var(--input-bg)', borderRadius: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{T.coin}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>🪙 {userData.coin}</div>
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--input-bg)', borderRadius: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{T.energy}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>⚡ {userData.energy}</div>
          </div>
        </div>
      </div>

      {/* ── 프로필 사진 선택 ── */}
      <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--input-bg)',
          fontSize: 15, fontWeight: 700, color: 'var(--t1)',
        }}>🐾 프로필 사진</div>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 10 }}>
          {STAGE_EMOJI.map((emoji, i) => (
            <button
              key={i}
              onClick={() => saveProfileChar(i)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 14,
                border: avatarStage === i ? '2px solid var(--accent)' : '2px solid transparent',
                background: avatarStage === i ? 'color-mix(in srgb, var(--accent) 10%, var(--input-bg))' : 'var(--input-bg)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font)',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <span style={{ fontSize: 24 }}>{emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: avatarStage === i ? 'var(--accent)' : 'var(--t3)' }}>
                {STAGE_LABEL[i]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 친구 코드 ── */}
      <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--input-bg)',
          fontSize: 15, fontWeight: 700, color: 'var(--t1)',
        }}>👥 친구</div>
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 내 코드 */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600, marginBottom: 6 }}>내 친구 코드</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--input-bg)', borderRadius: 12, padding: '12px 16px',
            }}>
              <span style={{ flex: 1, fontSize: 18, fontWeight: 700, color: 'var(--t1)', letterSpacing: 3 }}>
                {userData.friend_code || '—'}
              </span>
              <button
                onClick={copyCode}
                style={{
                  background: copied ? 'var(--accent)' : 'var(--card)',
                  border: 'none', borderRadius: 8,
                  padding: '6px 12px', fontSize: 12, fontWeight: 600,
                  color: copied ? '#fff' : 'var(--t2)',
                  cursor: 'pointer', fontFamily: 'var(--font)',
                  transition: 'all 0.15s',
                }}
              >
                {copied ? '✓ 복사됨' : '복사'}
              </button>
            </div>
          </div>

          {/* 친구 추가 */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600, marginBottom: 6 }}>코드로 친구 추가</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="px-input"
                placeholder="ABCDEF"
                value={addCode}
                onChange={e => { setAddCode(e.target.value.toUpperCase()); setAddError('') }}
                onKeyDown={e => e.key === 'Enter' && addFriend()}
                maxLength={6}
                style={{
                  flex: 1, letterSpacing: 2, fontWeight: 700, fontSize: 16,
                  textTransform: 'uppercase',
                }}
              />
              <button
                onClick={addFriend}
                disabled={addLoading || !addCode.trim()}
                style={{
                  background: addDone ? '#4CAF50' : 'var(--accent)',
                  border: 'none', borderRadius: 12, padding: '0 18px',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  cursor: addLoading || !addCode.trim() ? 'default' : 'pointer',
                  opacity: addLoading || !addCode.trim() ? 0.5 : 1,
                  fontFamily: 'var(--font)',
                  transition: 'background 0.2s, opacity 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {addDone ? '✓ 추가됨' : addLoading ? '...' : '추가'}
              </button>
            </div>
            {addError && (
              <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 6, fontWeight: 600 }}>
                {addError}
              </div>
            )}
          </div>

          {/* 친구 목록 */}
          {friends.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600, marginBottom: 8 }}>
                친구 {friends.length}명
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {friends.map(f => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: 'var(--input-bg)', borderRadius: 14,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 18,
                      background: 'var(--card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                    }}>
                      {STAGE_EMOJI[f.profile_char_stage ?? 0]}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)' }}>
                      {f.kingdom_name || '이름 없음'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {friends.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', padding: '8px 0' }}>
              아직 친구가 없어요 🥚
            </div>
          )}
        </div>
      </div>

      {/* ── 언어 선택 ── */}
      <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--input-bg)',
          fontSize: 15, fontWeight: 700, color: 'var(--t1)',
        }}>{T.language}</div>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              style={{
                padding: '8px 18px', borderRadius: 100,
                border: 'none',
                background: lang === l.code ? 'var(--accent)' : 'var(--input-bg)',
                color: lang === l.code ? '#fff' : 'var(--t3)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'var(--font)',
                transition: 'all 0.15s',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 로그아웃 ── */}
      <button className="px-btn-red" onClick={logout}>{T.logout}</button>

      <div style={{ height: 8 }} />
    </div>
  )
}
