import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('가입 완료! 이메일을 확인해 주세요.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 28px',
    }}>
      {/* Logo */}
      <div style={{ marginTop: 72, marginBottom: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 14, filter: 'drop-shadow(0 4px 12px rgba(52,114,216,0.20))' }}>🥚</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--t1)', letterSpacing: -1 }}>ME:UP</div>
        <div style={{ fontSize: 14, color: 'var(--t3)', marginTop: 7 }}>목표를 달성하고 캐릭터를 키워보세요</div>
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: '100%', padding: '16px 18px',
            background: 'var(--input-bg)', border: 'none',
            borderRadius: 14, fontSize: 15, color: 'var(--t1)',
            marginBottom: 10, outline: 'none',
            fontFamily: 'var(--font)',
          }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%', padding: '16px 18px',
            background: 'var(--input-bg)', border: 'none',
            borderRadius: 14, fontSize: 15, color: 'var(--t1)',
            marginBottom: 14, outline: 'none',
            fontFamily: 'var(--font)',
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '16px',
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 14,
            fontWeight: 700, fontSize: 16, cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}
        >
          {isSignUp ? '가입하기' : '로그인'}
        </button>

        {message && (
          <p style={{ color: 'var(--red)', marginTop: 12, fontSize: 13, textAlign: 'center' }}>{message}</p>
        )}

        <p
          onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
          style={{
            marginTop: 20, textAlign: 'center',
            fontSize: 14, color: 'var(--t2)', cursor: 'pointer',
          }}
        >
          {isSignUp ? '이미 계정이 있어요 ' : '계정이 없어요 '}
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {isSignUp ? '로그인' : '회원가입'}
          </span>
        </p>
      </div>
    </div>
  )
}
