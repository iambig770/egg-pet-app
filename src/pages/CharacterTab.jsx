import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LangContext'

const STAGE_EMOJI   = ['🥚', '🐣', '🐥', '🐓']
const MONSTER_EMOJI = ['👹', '💀', '🧟', '👺', '🦇', '🐺', '👻', '🕷️', '🦂', '🐍', '🦴', '😈']
const STAGE_MEALS   = [2, 9, 10]
const STAGE_SELL    = [20, 30, 50, null]
const GRADE_COLOR   = { S: '#f39c12', A: '#9b59b6', B: '#2980b9', C: '#27ae60' }
const DAY_MS        = 24 * 60 * 60 * 1000

const daysUnfed  = (c) => c.last_fed_at ? (Date.now() - new Date(c.last_fed_at).getTime()) / DAY_MS : 0
const isMonster  = (c) => daysUnfed(c) > 7
const isWarning  = (c) => { const d = daysUnfed(c); return d >= 5 && d <= 7 }
const daysLeft   = (c) => Math.max(0, Math.ceil(7 - daysUnfed(c)))
const monsterEmoji = (c) => {
  const hex = (c.character_id || '').replace(/-/g, '').slice(-2)
  return MONSTER_EMOJI[parseInt(hex, 16) % 12] || '👹'
}

function DexView({ userId, T }) {
  const [allChars, setAllChars] = useState([])
  const [owned,    setOwned]    = useState([])
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    supabase.from('characters').select('*').order('grade').then(({ data }) => setAllChars(data || []))
    supabase.from('user_characters').select('character_id').eq('user_id', userId).then(({ data }) => setOwned(data?.map(c => c.character_id) || []))
  }, [userId])

  const grades = ['all', 'S', 'A', 'B', 'C', '괴물']

  return (
    <div style={{ padding: '0 16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--t1)' }}>{T.dex}</span>
        {filter !== '괴물' && (
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{new Set(owned).size}</span> / {allChars.length}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
        {grades.map(g => (
          <button key={g} onClick={() => setFilter(g)} style={{
            padding: '6px 12px', borderRadius: 100, flexShrink: 0, border: 'none',
            background: filter === g ? (g === '괴물' ? '#FF2D2D' : 'var(--accent)') : 'var(--input-bg)',
            color: filter === g ? '#fff' : 'var(--t3)',
            fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)',
          }}>
            {g === 'all' ? T.grade_all : g === '괴물' ? '👹 괴물' : g}
          </button>
        ))}
      </div>

      {filter === '괴물' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {MONSTER_EMOJI.map((_, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '12px 6px', borderRadius: 16, background: 'var(--input-bg)', opacity: 0.65,
            }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, marginBottom: 6, background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>❓</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)' }}>???</span>
              <span style={{ marginTop: 3, fontSize: 10, fontWeight: 700, color: '#FF2D2D' }}>괴물</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {(filter === 'all' ? allChars : allChars.filter(c => c.grade === filter)).map(char => {
            const isOwned = owned.includes(char.id)
            return (
              <div key={char.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '12px 6px', borderRadius: 16,
                background: isOwned ? 'var(--card)' : 'var(--input-bg)', opacity: isOwned ? 1 : 0.65,
              }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, marginBottom: 6, background: isOwned ? '#E8F0FF' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                  {isOwned ? '🐣' : '❓'}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: isOwned ? 'var(--t1)' : 'var(--t3)' }}>{isOwned ? char.name : '???'}</span>
                <span style={{ marginTop: 3, fontSize: 10, fontWeight: 700, color: isOwned ? GRADE_COLOR[char.grade] : 'var(--t3)' }}>{char.grade}{T.grade_suffix}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CharCard({ c, userData, characters, T, onRefresh }) {
  const [feedAmount, setFeedAmount] = useState(1)
  const [feeding,    setFeeding]    = useState(false)

  const monster = isMonster(c)
  const warn    = isWarning(c)
  const maxFeed = (!monster && c.stage < 3)
    ? Math.min(STAGE_MEALS[c.stage] - (c.meals_fed || 0), Math.floor(userData.energy / 10))
    : 0

  const feed = async () => {
    if (feeding || monster || c.stage >= 3 || userData.energy < 10) return
    const amount = Math.min(feedAmount, maxFeed)
    if (amount <= 0) return alert(T.coin_lack)
    setFeeding(true)
    let meals = c.meals_fed || 0, stage = c.stage, totalEnergy = 0
    for (let i = 0; i < amount; i++) {
      meals++; totalEnergy += 10
      if (meals >= STAGE_MEALS[stage]) { stage++; meals = 0; if (stage >= 3) break }
    }
    await supabase.from('user_characters').update({ meals_fed: meals, stage, last_fed_at: new Date().toISOString() }).eq('id', c.id)
    await supabase.rpc('add_reward', { uid: userData.id, amount: -totalEnergy })
    await onRefresh()
    setFeeding(false)
  }

  const sell = async () => {
    if (c.stage >= 3) return alert(T.sell_max)
    if (characters.length <= 1) return alert(T.sell_last)
    const price = STAGE_SELL[c.stage]
    if (!window.confirm(T.sell_confirm(c.characters?.name, price))) return
    await supabase.from('user_characters').delete().eq('id', c.id)
    await supabase.rpc('add_reward', { uid: userData.id, amount: price })
    await onRefresh()
  }

  return (
    <div style={{
      background: 'var(--card)', borderRadius: 20, padding: 20,
      border: monster ? '1.5px solid rgba(255,45,45,0.25)' : warn ? '1.5px solid rgba(244,166,42,0.25)' : '1.5px solid transparent',
    }}>
      {/* 상단 좌측: 이름 + 등급 + 단계 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--t1)' }}>
            {c.characters?.name || '???'}
          </span>
          {c.characters?.grade && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
              border: `1px solid ${monster ? '#FF2D2D' : GRADE_COLOR[c.characters.grade]}`,
              color: monster ? '#FF2D2D' : GRADE_COLOR[c.characters.grade],
            }}>
              {monster ? '👹 괴물' : c.characters.grade + T.grade_suffix}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: monster ? '#FF2D2D' : warn ? '#F4A62A' : 'var(--t3)', fontWeight: monster || warn ? 600 : 400 }}>
          {monster ? '🔒 돌이킬 수 없어요' : warn ? `⚠️ ${daysLeft(c)}일 후 괴물 변신` : (T.stage_labels?.[c.stage] || '')}
        </div>
      </div>

      {/* 중앙 이모지 박스 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: monster ? 'rgba(255,45,45,0.06)' : 'var(--input-bg)',
        borderRadius: 16, padding: '28px 0', marginBottom: 14,
        fontSize: 72, lineHeight: 1,
      }}>
        <span className="char-breathe">{monster ? monsterEmoji(c) : STAGE_EMOJI[c.stage]}</span>
      </div>

      {/* 괴물 */}
      {monster ? (
        <div style={{ background: 'rgba(255,45,45,0.08)', borderRadius: 14, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FF2D2D', marginBottom: 2 }}>괴물로 변해버렸어요</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>7일간 밥을 주지 않아 돌이킬 수 없어요</div>
        </div>
      ) : c.stage >= 3 ? (
        /* 성장 완료 */
        <div style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: 15, padding: '8px 0' }}>
          {T.complete}
        </div>
      ) : (
        <>
          {/* 경고 배너 */}
          {warn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(244,166,42,0.10)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F4A62A' }}>{daysLeft(c)}일 후 괴물이 돼요</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>지금 밥을 주면 변신을 막을 수 있어요</div>
              </div>
            </div>
          )}

          {/* 진행도 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ fontWeight: 600, color: 'var(--t2)' }}>{T.next_stage}</span>
            <span style={{ color: 'var(--t3)' }}>{T.meals(c.meals_fed || 0, STAGE_MEALS[c.stage])}</span>
          </div>
          <div className="px-track" style={{ marginBottom: 14 }}>
            <div className="px-fill" style={{ width: `${((c.meals_fed || 0) / STAGE_MEALS[c.stage]) * 100}%` }} />
          </div>

          {/* 밥 수량 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[1, 5, maxFeed].map((n, i) => (
              <button key={i} onClick={() => setFeedAmount(n)} style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 10,
                background: feedAmount === n ? 'var(--accent)' : 'var(--input-bg)',
                color: feedAmount === n ? '#fff' : 'var(--t2)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)',
              }}>
                {i === 2 ? T.max_feed : `${n}`}
              </button>
            ))}
          </div>

          {/* 밥주기 + 판매 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={feed}
              disabled={feeding || maxFeed === 0}
              style={{
                flex: 1, padding: 13, border: 'none', borderRadius: 14,
                background: feeding || maxFeed === 0 ? 'var(--input-bg)' : 'var(--accent)',
                color: feeding || maxFeed === 0 ? 'var(--t3)' : '#fff',
                fontWeight: 700, fontSize: 14, cursor: feeding || maxFeed === 0 ? 'default' : 'pointer',
                fontFamily: 'var(--font)', transition: 'all 0.15s',
              }}
            >
              {feeding ? T.feeding : T.feed_btn(feedAmount, feedAmount * 10)}
            </button>
            <button
              onClick={sell}
              disabled={characters.length <= 1}
              style={{
                padding: '13px 14px', border: 'none', borderRadius: 14,
                background: characters.length <= 1 ? 'var(--input-bg)' : '#FFF0F0',
                color: characters.length <= 1 ? 'var(--t3)' : 'var(--red)',
                fontWeight: 700, fontSize: 13,
                cursor: characters.length <= 1 ? 'default' : 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              {T.sell} {STAGE_SELL[c.stage]}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function CharacterTab() {
  const [userData,   setUserData]   = useState(null)
  const [characters, setCharacters] = useState([])
  const [tab,        setTab]        = useState('chars')
  const { T, lang } = useLang()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: u } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
    setUserData(u)
    const { data: c } = await supabase.from('user_characters').select('*, characters(name, grade)').eq('user_id', u.id).order('created_at')
    setCharacters(c || [])
  }

  const buyEgg = async () => {
    if (userData.coin < 100) return
    const { data: charId } = await supabase.rpc('get_random_character')
    const { data: charData } = await supabase.from('characters').select('name, grade').eq('id', charId).single()
    const { error } = await supabase.from('user_characters').insert({ user_id: userData.id, character_id: charId, stage: 0, star: 1, meals_fed: 0, last_fed_at: new Date().toISOString() })
    if (!error) {
      await supabase.rpc('add_reward', { uid: userData.id, amount: -100 })
      await fetchAll()
      alert(T.egg_result(charData.grade, charData.name))
    }
  }

  if (!userData) return <div className="px-loading">로딩 중...</div>

  return (
    <div key={lang} style={{ paddingBottom: 20 }}>

      {/* 탭 */}
      <div style={{ display: 'flex', padding: '0 16px', gap: 8, marginBottom: 16 }}>
        {[['chars', T.char_tab_my], ['dex', T.dex]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px 0', border: 'none', borderRadius: 100,
            background: tab === key ? 'var(--accent)' : 'var(--input-bg)',
            color: tab === key ? '#fff' : 'var(--t3)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'dex' ? (
        <DexView userId={userData.id} T={T} />
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 재화 */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[['🪙', T.coin, userData.coin], ['⚡', T.energy, userData.energy]].map(([icon, label, value]) => (
              <div key={label} style={{ flex: 1, background: 'var(--card)', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 캐릭터 카드 목록 */}
          {characters.length === 0 ? (
            <div style={{ background: 'var(--card)', borderRadius: 20, padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🥚</div>
              <div style={{ fontSize: 14, color: 'var(--t3)' }}>{T.buy_egg_empty}</div>
            </div>
          ) : (
            characters.map(c => (
              <CharCard
                key={c.id}
                c={c}
                userData={userData}
                characters={characters}
                T={T}
                onRefresh={fetchAll}
              />
            ))
          )}

          {/* 알 구매 */}
          <button
            onClick={buyEgg}
            disabled={userData.coin < 100}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 16,
              border: `1.5px dashed ${userData.coin >= 100 ? 'var(--accent)' : 'var(--input-bg)'}`,
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 14, fontWeight: 700,
              cursor: userData.coin >= 100 ? 'pointer' : 'default',
              color: userData.coin >= 100 ? 'var(--accent)' : 'var(--t3)',
              fontFamily: 'var(--font)',
            }}
          >
            🥚 알 구매 · 100 🪙
          </button>
        </div>
      )}
    </div>
  )
}
