import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const GRADE_COLOR = { S: '#f39c12', A: '#9b59b6', B: '#2980b9', C: '#27ae60' }

export default function Dex() {
  const [allChars, setAllChars] = useState([])
  const [owned, setOwned] = useState([])
  const [filter, setFilter] = useState('전체')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: u } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    const { data: chars } = await supabase
      .from('characters')
      .select('*')
      .order('grade')
    setAllChars(chars || [])

    const { data: myChars } = await supabase
      .from('user_characters')
      .select('character_id')
      .eq('user_id', u.id)
    setOwned(myChars?.map(c => c.character_id) || [])
  }

  const grades = ['전체', 'S', 'A', 'B', 'C']
  const filtered = filter === '전체' ? allChars : allChars.filter(c => c.grade === filter)

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>도감</h2>
        <span style={{ fontSize: 14, color: '#888' }}>
          <span style={{ color: '#2F6B5A', fontWeight: 700 }}>
            {new Set(owned).size}
          </span> / {allChars.length}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {grades.map(g => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            style={{
              padding: '6px 12px', borderRadius: 20,
              border: filter === g ? 'none' : '1px solid #ddd',
              background: filter === g ? '#1F1E1B' : '#fff',
              color: filter === g ? '#fff' : '#888',
              fontWeight: 700, fontSize: 13, cursor: 'pointer'
            }}
          >
            {g}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {filtered.map(char => {
          const isOwned = owned.includes(char.id)
          return (
            <div
              key={char.id}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '12px 6px', borderRadius: 14,
                background: isOwned ? '#fff' : '#F0EDE6',
                border: '1px solid #ddd'
              }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: 12, marginBottom: 6,
                background: isOwned ? '#ECE8E0' : '#DCD8CF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32
              }}>
                {isOwned ? '🐣' : '❓'}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: isOwned ? '#1F1E1B' : '#888' }}>
                {isOwned ? char.name : '???'}
              </span>
              <span style={{
                marginTop: 4, fontSize: 11, fontWeight: 700,
                color: isOwned ? GRADE_COLOR[char.grade] : '#bbb'
              }}>
                {char.grade}등급
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}