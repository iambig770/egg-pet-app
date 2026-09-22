import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const STAGE_LABEL = ['알', '1단계', '2단계', '3단계 완성']
const STAGE_MEALS = [2, 9, 10]
const STAGE_EMOJI = ['🥚', '🐣', '🐥', '🐓']
const STAGE_SELL = [20, 30, 50, null]
const GRADE_COLOR = { S: '#f39c12', A: '#9b59b6', B: '#2980b9', C: '#27ae60' }

export default function Home() {
  const [userData, setUserData] = useState(null)
  const [characters, setCharacters] = useState([])
  const [selected, setSelected] = useState(null)
  const [feeding, setFeeding] = useState(false)
  const [feedAmount, setFeedAmount] = useState(1)

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
    const { data: c } = await supabase
      .from('user_characters')
      .select('*, characters(name, grade)')
      .eq('user_id', u.id)
      .order('created_at')
    setCharacters(c || [])
    if (c && c.length > 0) {
      setSelected(prev => prev ? c.find(x => x.id === prev.id) || c[0] : c[0])
    }
  }

  const buyEgg = async () => {
    if (userData.coin < 100) return
    const { data: charId } = await supabase.rpc('get_random_character')
    const { data: charData } = await supabase
      .from('characters')
      .select('name, grade')
      .eq('id', charId)
      .single()
    const { error } = await supabase
      .from('user_characters')
      .insert({ user_id: userData.id, character_id: charId, stage: 0, star: 1, meals_fed: 0 })
    if (!error) {
      await supabase.rpc('add_reward', { uid: userData.id, amount: -100 })
      await fetchAll()
      alert(`${charData.grade}등급 "${charData.name}" 알을 얻었습니다!`)
    }
  }

  const sellCharacter = async () => {
    if (!current) return
    if (current.stage >= 3) return alert('3단계 완성 캐릭터는 판매할 수 없습니다')
    if (characters.length <= 1) return alert('마지막 캐릭터는 판매할 수 없습니다')
    const price = STAGE_SELL[current.stage]
    if (!window.confirm(`"${current.characters?.name}" 을 ${price}코인에 판매할까요?`)) return
    await supabase.from('user_characters').delete().eq('id', current.id)
    await supabase.rpc('add_reward', { uid: userData.id, amount: price })
    setSelected(null)
    await fetchAll()
  }

  const getMaxFeed = (current, energy) => {
    if (!current || current.stage >= 3) return 0
    const remainingMeals = STAGE_MEALS[current.stage] - (current.meals_fed || 0)
    const maxByEnergy = Math.floor(energy / 10)
    return Math.min(remainingMeals, maxByEnergy)
  }

  const feedMeal = async () => {
    if (feeding) return
    if (!selected) return
    const current = characters.find(c => c.id === selected.id)
    if (!current) return
    if (current.stage >= 3) return alert('이미 완성된 캐릭터입니다')
    if (userData.energy < 10) return alert('에너지가 부족합니다')

    const maxFeed = getMaxFeed(current, userData.energy)
    const amount = Math.min(feedAmount, maxFeed)
    if (amount <= 0) return alert('에너지가 부족합니다')

    setFeeding(true)

    let meals = current.meals_fed || 0
    let stage = current.stage
    let totalEnergy = 0

    for (let i = 0; i < amount; i++) {
      meals += 1
      totalEnergy += 10
      if (meals >= STAGE_MEALS[stage]) {
        stage += 1
        meals = 0
        if (stage >= 3) break
      }
    }

    await supabase
      .from('user_characters')
      .update({ meals_fed: meals, stage })
      .eq('id', current.id)
    await supabase.rpc('add_reward', { uid: userData.id, amount: -totalEnergy })
    await fetchAll()
    setFeeding(false)
  }

  if (!userData) return <div style={{ padding: 20 }}>로딩 중...</div>

  const current = selected ? characters.find(c => c.id === selected.id) : null
  const maxFeed = current ? getMaxFeed(current, userData.energy) : 0

  return (
    <div style={{ padding: 20 }}>
      {userData.streak > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: '#FFF8E7',
          border: '1px solid #f39c12', borderRadius: 12, marginBottom: 16
        }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#f39c12' }}>
            {userData.streak}일 연속 달성 중
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, padding: '12px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🪙</span>
          <div>
            <div style={{ fontSize: 11, color: '#888' }}>코인</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{userData.coin}</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚡</span>
          <div>
            <div style={{ fontSize: 11, color: '#888' }}>에너지</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{userData.energy}</div>
          </div>
        </div>
      </div>

      {current ? (
        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {current.characters?.name || '???'}
              </span>
              {current.characters?.grade && (
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 6,
                  border: `1px solid ${GRADE_COLOR[current.characters.grade]}`,
                  color: GRADE_COLOR[current.characters.grade]
                }}>
                  {current.characters.grade}등급
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, color: '#888' }}>
              {'★'.repeat(current.star)}{'☆'.repeat(5 - current.star)}
            </span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 80, margin: '16px 0' }}>
            {STAGE_EMOJI[current.stage]}
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 12 }}>
            {STAGE_LABEL[current.stage]}
          </div>
          {current.stage < 3 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>다음 단계까지</span>
                <span style={{ color: '#888' }}>밥 {current.meals_fed || 0} / {STAGE_MEALS[current.stage]}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#ECE8E0', marginBottom: 16 }}>
                <div style={{
                  width: `${((current.meals_fed || 0) / STAGE_MEALS[current.stage]) * 100}%`,
                  height: 8, borderRadius: 4, background: '#2F6B5A', transition: 'width 0.3s'
                }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[1, 5, maxFeed].map((n, i) => (
                  <button
                    key={i}
                    onClick={() => setFeedAmount(n)}
                    style={{
                      flex: 1, padding: '8px 0',
                      background: feedAmount === n ? '#2F6B5A' : '#fff',
                      color: feedAmount === n ? '#fff' : '#2F6B5A',
                      border: '1px solid #2F6B5A', borderRadius: 8,
                      fontWeight: 700, fontSize: 13, cursor: 'pointer'
                    }}
                  >
                    {i === 2 ? '최대' : `${n}개`}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={feedMeal}
                  disabled={feeding || maxFeed === 0}
                  style={{
                    flex: 1, padding: 14,
                    background: feeding || maxFeed === 0 ? '#ccc' : '#2F6B5A',
                    color: '#fff', border: 'none', borderRadius: 12,
                    fontWeight: 700, fontSize: 15,
                    cursor: feeding || maxFeed === 0 ? 'default' : 'pointer'
                  }}
                >
                  {feeding ? '처리 중...' : `밥 주기 ${feedAmount}개 (에너지 ${feedAmount * 10})`}
                </button>
                <button
                  onClick={sellCharacter}
                  disabled={characters.length <= 1}
                  style={{
                    padding: '14px 16px',
                    background: '#fff',
                    color: characters.length <= 1 ? '#ccc' : '#e74c3c',
                    border: `1px solid ${characters.length <= 1 ? '#ccc' : '#e74c3c'}`,
                    borderRadius: 12,
                    fontWeight: 700, fontSize: 13,
                    cursor: characters.length <= 1 ? 'default' : 'pointer'
                  }}
                >
                  판매{'\n'}{STAGE_SELL[current.stage]}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#2F6B5A', fontWeight: 700, fontSize: 16 }}>
              🎉 완성!
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 20, textAlign: 'center', color: '#888', marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🥚</div>
          <div style={{ fontSize: 14 }}>알을 구매해서 캐릭터를 키워보세요</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }}>
        {characters.map(c => (
          <div
            key={c.id}
            onClick={() => setSelected(c)}
            style={{
              width: 52, height: 52, borderRadius: 26, flexShrink: 0,
              background: '#ECE8E0',
              border: selected?.id === c.id ? '2px solid #2F6B5A' : '1px solid #ddd',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, cursor: 'pointer'
            }}
          >
            {STAGE_EMOJI[c.stage]}
          </div>
        ))}
        <div
          onClick={buyEgg}
          style={{
            width: 52, height: 52, borderRadius: 26, flexShrink: 0,
            border: '1.5px dashed #ccc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, cursor: userData.coin >= 100 ? 'pointer' : 'default',
            color: userData.coin >= 100 ? '#2F6B5A' : '#ccc'
          }}
        >
          +
        </div>
      </div>
    </div>
  )
}