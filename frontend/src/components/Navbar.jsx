import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function Navbar() {
  const navigate              = useNavigate()
  const { user, logout }      = useAuthStore()
  const [query, setQuery]     = useState('')
  const [menuOpen, setMenu]   = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/?search=${encodeURIComponent(query.trim())}`)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      {/* ロゴ */}
      <Link to="/" style={styles.logo}>▶ TabiTube</Link>

      {/* 検索バー */}
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="動画を検索..."
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchBtn}>🔍</button>
      </form>

      {/* 右側メニュー */}
      <div style={styles.right}>
        {user ? (
          <>
            <Link to="/upload" style={styles.uploadBtn}>＋ アップロード</Link>
            <div style={styles.avatarWrap} onClick={() => setMenu(!menuOpen)}>
              <div style={styles.avatar}>
                {user.avatar
                  ? <img src={user.avatar} alt="" style={{ width: '100%', borderRadius: '50%' }} />
                  : user.name[0].toUpperCase()
                }
              </div>
              {menuOpen && (
                <div style={styles.dropdown}>
                  <Link to="/channel" style={styles.dropItem}>マイチャンネル</Link>
                  <button onClick={handleLogout} style={styles.dropItemBtn}>ログアウト</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" style={styles.loginBtn}>ログイン</Link>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '0 24px',
    height: '60px',
    background: '#111',
    borderBottom: '1px solid #222',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    color: '#ff4444',
    fontSize: '20px',
    fontWeight: '700',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  searchForm: {
    display: 'flex',
    flex: 1,
    maxWidth: '600px',
  },
  searchInput: {
    flex: 1,
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRight: 'none',
    borderRadius: '8px 0 0 8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    padding: '8px 14px',
  },
  searchBtn: {
    background: '#222',
    border: '1px solid #333',
    borderRadius: '0 8px 8px 0',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '8px 14px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: 'auto',
  },
  uploadBtn: {
    background: '#ff4444',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    padding: '8px 14px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  loginBtn: {
    background: '#222',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    padding: '8px 16px',
    textDecoration: 'none',
  },
  avatarWrap: {
    position: 'relative',
    cursor: 'pointer',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: '#ff4444',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: '700',
  },
  dropdown: {
    position: 'absolute',
    top: '44px',
    right: 0,
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    minWidth: '160px',
    overflow: 'hidden',
  },
  dropItem: {
    display: 'block',
    color: '#fff',
    fontSize: '14px',
    padding: '12px 16px',
    textDecoration: 'none',
  },
  dropItemBtn: {
    background: 'none',
    border: 'none',
    color: '#ff4444',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '12px 16px',
    textAlign: 'left',
    width: '100%',
  },
}
