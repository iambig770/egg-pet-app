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
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>{isSignUp ? '회원가입' : '로그인'}</h2>
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 12, marginBottom: 12, boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 8 }}
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 12, marginBottom: 12, boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 8 }}
      />
      <button
        onClick={handleSubmit}
        style={{ width: '100%', padding: 12, background: '#2F6B5A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15 }}
      >
        {isSignUp ? '가입하기' : '로그인'}
      </button>
      {message && <p style={{ color: 'red', marginTop: 12 }}>{message}</p>}
      <p
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ marginTop: 16, textAlign: 'center', color: '#2F6B5A', cursor: 'pointer' }}
      >
        {isSignUp ? '이미 계정이 있어요' : '계정이 없어요'}
      </p>
    </div>
  )
}