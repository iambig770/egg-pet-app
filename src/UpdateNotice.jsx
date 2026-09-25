import { useState, useEffect } from 'react'
import { useLang } from './LangContext'

const UPDATE_KEY = 'meup_update_v3_seen'

const updates = {
  ko: [
    '🏰 왕국 탭 추가 — 내 캐릭터들이 자유롭게 돌아다녀요',
    '🐣 캐릭터 탭 — 먹이주기·진화·도감이 한 곳에',
    '🌐 한국어·영어·중국어·일본어 지원',
    '📅 캘린더 연동 개선 — 주소 변경 및 일정 선택 추가',
    '🕛 날짜 기준이 현지 시간으로 바뀌었어요',
    '🔒 핀치 줌 방지 적용',
  ],
  en: [
    '🏰 Kingdom tab — watch your characters roam freely',
    '🐣 Character tab — feeding, evolution & dex in one place',
    '🌐 Korean, English, Chinese, Japanese support',
    '📅 Calendar improvements — URL change & event selection',
    '🕛 Date now follows your local timezone',
    '🔒 Pinch zoom disabled',
  ],
  zh: [
    '🏰 新增王国标签 — 角色可以自由漫步',
    '🐣 角色标签 — 喂食、进化和图鉴合为一处',
    '🌐 支持韩语、英语、中文、日语',
    '📅 日历改进 — 新增地址修改和日程选择功能',
    '🕛 日期现在以本地时间为准',
    '🔒 禁用双指缩放',
  ],
  ja: [
    '🏰 王国タブ追加 — キャラクターが自由に動き回ります',
    '🐣 キャラクタータブ — 餌やり・進化・図鑑が一か所に',
    '🌐 韓国語・英語・中国語・日本語対応',
    '📅 カレンダー改善 — URL変更と予定選択を追加',
    '🕛 日付がローカル時間基準になりました',
    '🔒 ピンチズーム無効化',
  ],
}

const titles = { ko: '업데이트 소식', en: "What's New", zh: '更新内容', ja: 'アップデート情報' }
const btns = { ko: '확인', en: 'Got it', zh: '好的', ja: 'OK' }

export default function UpdateNotice() {
  const [show, setShow] = useState(false)
  const { lang } = useLang()

  useEffect(() => {
    try {
      if (!localStorage.getItem(UPDATE_KEY)) setShow(true)
    } catch {}
  }, [])

  const close = () => {
    try { localStorage.setItem(UPDATE_KEY, '1') } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, maxHeight: '80vh', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>🎉</div>
        <h3 style={{ margin: '0 0 16px', fontSize: 17, textAlign: 'center', color: '#1F1E1B' }}>{titles[lang] || titles.ko}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {(updates[lang] || updates.ko).map((item, i) => (
            <div key={i} style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{item}</div>
          ))}
        </div>
        <button onClick={close} style={{ width: '100%', padding: 14, background: '#2F6B5A', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          {btns[lang] || btns.ko}
        </button>
      </div>
    </div>
  )
}
