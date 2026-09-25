import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LangContext'
import { useHellMode } from '../DarkModeContext'
import { useUser, useRefreshUser } from '../hooks/useUser'

function WalkingChar({ emoji, containerW, containerH }) {
  const size = 48
  const speed = 1.2 + Math.random() * 0.8
  const initX = Math.random() * (containerW - size)
  const initY = Math.random() * (containerH - size)
  const initDX = (Math.random() > 0.5 ? 1 : -1) * speed
  const initDY = (Math.random() > 0.5 ? 1 : -1) * speed

  const pos = useRef({ x: initX, y: initY, dx: initDX, dy: initDY })
  const [render, setRender] = useState({ x: initX, y: initY, flip: initDX < 0 })
  const raf = useRef(null)

  useEffect(() => {
    const animate = () => {
      const p = pos.current
      let { x, y, dx, dy } = p
      x += dx; y += dy
      if (x <= 0 || x >= containerW - size) { dx = -dx; x = Math.max(0, Math.min(x, containerW - size)) }
      if (y <= 0 || y >= containerH - size) { dy = -dy; y = Math.max(0, Math.min(y, containerH - size)) }
      pos.current = { x, y, dx, dy }
      setRender({ x, y, flip: dx < 0 })
      raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf.current)
  }, [containerW, containerH])

  return (
    <div style={{
      position: 'absolute',
      left: render.x, top: render.y,
      fontSize: size,
      transform: render.flip ? 'scaleX(-1)' : 'scaleX(1)',
      userSelect: 'none', lineHeight: 1,
      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.12))',
    }}>
      {emoji}
    </div>
  )
}

const STAGE_EMOJI = ['🥚', '🐣', '🐥', '🐓']
const HELL_EMOJI  = ['💀', '👹', '🧟', '👺']

function getHellEmoji(idx) {
  return HELL_EMOJI[idx % HELL_EMOJI.length]
}

export default function Kingdom() {
  const [characters,    setCharacters]    = useState([])
  const [showNameModal, setShowNameModal] = useState(false)
  const [kingdomName,   setKingdomName]   = useState('')
  const [saving,        setSaving]        = useState(false)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [pullY,         setPullY]         = useState(0)
  const [pulling,       setPulling]       = useState(false)
  const containerRef  = useRef(null)
  const touchStartY   = useRef(null)
  const { T } = useLang()
  const { hell, setHell } = useHellMode()
  const { data: userData } = useUser()
  const refreshUser = useRefreshUser()

  useEffect(() => {
    if (userData) {
      if (!userData.kingdom_name) setShowNameModal(true)
      fetchCharacters(userData.id)
    }
  }, [userData?.id])

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ w: rect.width, h: rect.height })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const fetchCharacters = async (uid) => {
    const { data: c } = await supabase.from('user_characters').select('*, characters(name, grade)').eq('user_id', uid).order('created_at')
    setCharacters(c || [])
  }

  const saveKingdomName = async () => {
    if (!kingdomName.trim()) return
    setSaving(true)
    await supabase.from('users').update({ kingdom_name: kingdomName.trim() }).eq('id', userData.id)
    await refreshUser()
    setShowNameModal(false)
    setSaving(false)
  }

  /* ── 풀다운 제스처 ── */
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy > 0) {
      setPullY(Math.min(dy, 110))
      setPulling(true)
    }
  }
  const handleTouchEnd = () => {
    if (pullY >= 80) {
      setHell(prev => !prev)
    }
    setPullY(0)
    setPulling(false)
    touchStartY.current = null
  }

  if (!userData) return <div className="px-loading">로딩 중...</div>

  const xpCurrent = userData.point || 0
  const xpMax = 500
  const xpPercent = Math.min((xpCurrent % xpMax) / xpMax * 100, 100)

  const pullProgress = Math.min(pullY / 80, 1)
  const pullReady = pullY >= 80

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 52px - 90px)', overflow: 'hidden' }}>

      {/* ── 왕국 이름 헤더 ── */}
      <div style={{
        padding: '10px 20px 8px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>
            {hell ? '🔥 지옥' : '🏰 왕국'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>
            {userData.kingdom_name || '...'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            background: hell
              ? 'linear-gradient(135deg, #2A0000, #1A0000)'
              : 'linear-gradient(135deg, #B8D4FF, #D4EDFF)',
            borderRadius: 100, padding: '6px 14px',
            fontSize: 12, fontWeight: 700, color: 'var(--accent)',
          }}>
            🪙 {userData.coin ?? 0}
          </div>
          <button
            onClick={() => { setKingdomName(userData.kingdom_name || ''); setShowNameModal(true) }}
            style={{
              background: 'var(--input-bg)', border: 'none', borderRadius: 100,
              padding: '6px 12px', fontSize: 12, fontWeight: 600, color: 'var(--t3)', cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
          >✏️ 편집</button>
        </div>
      </div>

      {/* ── XP 바 ── */}
      <div style={{ padding: '0 20px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)', marginBottom: 5 }}>
          <span>경험치</span><span>{xpCurrent} XP</span>
        </div>
        <div style={{ background: 'var(--input-bg)', borderRadius: 100, height: 7 }}>
          <div style={{
            width: `${xpPercent}%`, height: 7, borderRadius: 100,
            background: hell
              ? 'linear-gradient(90deg, #FF6060, #FF2D2D)'
              : 'linear-gradient(90deg, #A8C8FF, var(--accent))',
            transition: 'width 0.4s, background 0.4s',
          }} />
        </div>
      </div>

      {/* ── 캐릭터 필드 ── */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          margin: '0 20px',
          background: hell
            ? 'linear-gradient(160deg, #1A0000 0%, #0D0000 100%)'
            : 'linear-gradient(160deg, #E8F0FF 0%, #F0EEFF 100%)',
          borderRadius: 20,
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 0.5s',
          cursor: 'grab',
        }}
      >
        {/* 풀다운 인디케이터 */}
        {pulling && pullY > 16 && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: Math.min(pullY * 0.7, 70),
            fontSize: 26,
            opacity: pullProgress,
            pointerEvents: 'none',
            zIndex: 10,
            gap: 4,
          }}>
            <span style={{
              transform: `scale(${0.7 + pullProgress * 0.5})`,
              transition: 'transform 0.05s',
              filter: pullReady ? 'drop-shadow(0 0 8px rgba(255,45,45,0.8))' : 'none',
            }}>
              {hell ? '🌈' : '👹'}
            </span>
            {pullReady && (
              <span style={{ fontSize: 10, fontWeight: 700, color: hell ? '#88F' : '#FF4444', letterSpacing: 0.5 }}>
                {hell ? '해방!' : '지옥 소환!'}
              </span>
            )}
          </div>
        )}

        {/* 바닥 그라데이션 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 50,
          background: hell
            ? 'linear-gradient(to top, rgba(255,0,0,0.08), transparent)'
            : 'linear-gradient(to top, rgba(200,220,255,0.25), transparent)',
          pointerEvents: 'none',
        }} />

        {containerSize.w > 0 && containerSize.h > 0 && characters.map((c, i) => (
          <WalkingChar
            key={c.id}
            emoji={hell ? getHellEmoji(i) : STAGE_EMOJI[c.stage ?? 0]}
            containerW={containerSize.w}
            containerH={containerSize.h}
          />
        ))}

        {characters.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'var(--t3)', gap: 8,
          }}>
            <span style={{ fontSize: 48 }}>{hell ? '💀' : '🥚'}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {hell ? '여기는 아무도 없어...' : '캐릭터가 없어요'}
            </span>
          </div>
        )}

        {/* 지옥 모드 불꽃 오버레이 */}
        {hell && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 30,
            background: 'linear-gradient(to top, rgba(255,45,45,0.15), transparent)',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* ── 스탯 카드 ── */}
      <div style={{ display: 'flex', gap: 10, padding: '10px 20px 0', flexShrink: 0 }}>
        {[
          { icon: '🔥', value: userData.streak ?? 0, label: '연속 달성' },
          { icon: '⭐', value: userData.point ?? 0, label: '포인트' },
          { icon: hell ? '💀' : '🐣', value: characters.length, label: '캐릭터' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'var(--card)', borderRadius: 16,
            padding: '12px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginTop: 3 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── 지옥 모드 배너 ── */}
      {hell && (
        <div style={{
          margin: '8px 20px 0',
          padding: '8px 14px',
          background: 'rgba(255,45,45,0.10)',
          borderRadius: 12,
          fontSize: 12, fontWeight: 700,
          color: 'var(--accent)',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          👹 지옥 모드 활성화 · 왕국을 당겨 해제
        </div>
      )}

      {/* ── 왕국 이름 모달 ── */}
      {showNameModal && (
        <div className="px-overlay">
          <div className="px-modal">
            <div className="px-bar">
              <span>{T.kingdom_name_title || '왕국 이름 설정'}</span>
            </div>
            <div className="px-body">
              <input
                className="px-input"
                placeholder={T.kingdom_name_placeholder || '왕국 이름을 입력하세요'}
                value={kingdomName}
                onChange={e => setKingdomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveKingdomName()}
                autoFocus
              />
              <button className="px-btn" onClick={saveKingdomName} disabled={saving}>
                {saving ? '저장 중...' : (T.save || '저장')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
