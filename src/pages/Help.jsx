import { useLang } from '../LangContext'

export default function Help() {
  const { T } = useLang()

  return (
    <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* 앱 소개 */}
      <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--input-bg)', fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
          🐣 {T.help_what_title}
        </div>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--t2)', lineHeight: 1.7 }}>{T.help_what_desc}</p>
        </div>
      </div>

      {/* 사용 방법 */}
      <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--input-bg)', fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
          🎮 {T.help_how_title}
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {T.help_how_steps.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.4 }}>{item.emoji}</span>
              <span style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 캘린더 연동 */}
      <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--input-bg)', fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
          📅 {T.help_cal_title}
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--t2)', lineHeight: 1.7 }}>{T.help_cal_desc}</p>

          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginBottom: 6 }}>🔗 {T.help_cal_google_title}</div>
          {T.help_cal_google_steps.map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--t2)', display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <span>{t}</span>
            </div>
          ))}
          {T.help_cal_google_warns.map((t, i) => (
            <div key={'w' + i} style={{ fontSize: 13, color: 'var(--red)', display: 'flex', gap: 8, marginTop: 4 }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{t}</span>
            </div>
          ))}

          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginTop: 16, marginBottom: 6 }}>🍎 {T.help_cal_ios_title}</div>
          {T.help_cal_ios_steps.map((t, i) => (
            <div key={'ios' + i} style={{ fontSize: 13, color: 'var(--t2)', display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <span>{t}</span>
            </div>
          ))}

          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginTop: 16, marginBottom: 6 }}>🤖 {T.help_cal_android_title}</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>{T.help_cal_android_desc}</div>
        </div>
      </div>

      {/* 앱 설치 */}
      <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--input-bg)', fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
          📱 {T.help_install_title}
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginBottom: 8 }}>🍎 {T.help_install_ios_title}</div>
            {T.help_install_ios_steps.map((t, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--t2)', display: 'flex', gap: 8, marginBottom: 5 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginBottom: 8 }}>🤖 {T.help_install_android_title}</div>
            {T.help_install_android_steps.map((t, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--t2)', display: 'flex', gap: 8, marginBottom: 5 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 주의 사항 */}
      <div style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--input-bg)', fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
          ⚠️ {T.help_notice_title}
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {T.help_notice_items.map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--t2)', display: 'flex', gap: 10, lineHeight: 1.6 }}>
              <span style={{ color: 'var(--t3)', flexShrink: 0 }}>•</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}
