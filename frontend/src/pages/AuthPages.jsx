import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'

// ─── ログインページ ───────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error, token, clearError } = useAuthStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (token) navigate('/')
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) navigate('/')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>▶ TabiTube</div>
        <h1 style={styles.heading}>ログイン</h1>

        {error && (
          <div style={styles.errorBox} onClick={clearError}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="you@example.com"
            required
          />

          <label style={styles.label}>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="••••••••"
            required
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? '確認中...' : 'ログイン'}
          </button>
        </form>

        <p style={styles.footer}>
          アカウントをお持ちでない方は{' '}
          <Link to="/register" style={styles.link}>新規登録</Link>
        </p>
      </div>
    </div>
  )
}

// ─── 登録ページ ───────────────────────────────────────────────
export function RegisterPage() {
  const navigate = useNavigate()
  const { register, loading, error, token, clearError } = useAuthStore()
  const [name, setName]                         = useState('')
  const [email, setEmail]                       = useState('')
  const [password, setPassword]                 = useState('')
  const [passwordConfirm, setPasswordConfirm]   = useState('')

  useEffect(() => {
    if (token) navigate('/')
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== passwordConfirm) {
      alert('パスワードが一致しません。')
      return
    }
    const ok = await register(name, email, password, passwordConfirm)
    if (ok) navigate('/')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>▶ TabiTube</div>
        <h1 style={styles.heading}>新規登録</h1>

        {error && (
          <div style={styles.errorBox} onClick={clearError}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>ユーザー名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="山田 太郎"
            required
          />

          <label style={styles.label}>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="you@example.com"
            required
          />

          <label style={styles.label}>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="8文字以上"
            required
          />

          <label style={styles.label}>パスワード（確認）</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            style={styles.input}
            placeholder="••••••••"
            required
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? '登録中...' : 'アカウントを作成'}
          </button>
        </form>

        <p style={styles.footer}>
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login" style={styles.link}>ログイン</Link>
        </p>
      </div>
    </div>
  )
}

// ─── スタイル ─────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f0f0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Noto Sans JP', sans-serif",
    padding: '24px',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    color: '#ff4444',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    marginBottom: '28px',
  },
  heading: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#888',
    fontSize: '13px',
    marginTop: '12px',
    marginBottom: '4px',
  },
  input: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    padding: '12px 14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    background: '#ff4444',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '24px',
    padding: '14px',
    transition: 'background 0.2s',
  },
  errorBox: {
    background: '#2a1515',
    border: '1px solid #ff4444',
    borderRadius: '8px',
    color: '#ff8080',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '16px',
    padding: '12px 14px',
  },
  footer: {
    color: '#666',
    fontSize: '14px',
    marginTop: '24px',
    textAlign: 'center',
  },
  link: {
    color: '#ff4444',
    textDecoration: 'none',
  },
}
