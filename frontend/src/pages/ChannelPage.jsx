import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import VideoCard from '../components/VideoCard'
import useAuthStore from '../store/authStore'

export default function ChannelPage() {
  const { id }                        = useParams()
  const { user }                      = useAuthStore()
  const [channel, setChannel]         = useState(null)
  const [videos, setVideos]           = useState([])
  const [subscribed, setSubscribed]   = useState(false)
  const [subCount, setSubCount]       = useState(0)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  useEffect(() => {
    fetchChannel()
    fetchVideos()
  }, [id])

  const fetchChannel = async () => {
    try {
      const { data } = await api.get(`/channels/${id}`)
      setChannel(data.channel)
      setSubscribed(data.subscribed)
      setSubCount(data.channel.subscriber_count || 0)
    } catch {
      setError('チャンネルが見つかりません。')
    } finally {
      setLoading(false)
    }
  }

  const fetchVideos = async () => {
    try {
      const { data } = await api.get(`/channels/${id}/videos`)
      setVideos(data.data)
    } catch {}
  }

  const handleSubscribe = async () => {
    if (!user) { window.location.href = '/login'; return }
    try {
      const { data } = await api.post(`/channels/${id}/subscribe`)
      setSubscribed(data.subscribed)
      setSubCount(data.subscriber_count)
    } catch {}
  }

  if (loading) return (
    <div style={styles.page}><Navbar />
      <div style={styles.msg}>読み込み中...</div>
    </div>
  )

  if (error || !channel) return (
    <div style={styles.page}><Navbar />
      <div style={{ ...styles.msg, color: '#ff4444' }}>{error}</div>
    </div>
  )

  const isOwner = user?.id === channel.user_id

  return (
    <div style={styles.page}>
      <Navbar />

      {/* バナー */}
      <div style={styles.banner}>
        {channel.banner
          ? <img src={`http://localhost:8000/storage/${channel.banner}`} alt="" style={styles.bannerImg} />
          : <div style={styles.bannerPlaceholder} />
        }
      </div>

      {/* チャンネルヘッダー */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.avatar}>
            {channel.name?.[0]?.toUpperCase()}
          </div>
          <div style={styles.info}>
            <h1 style={styles.name}>{channel.name}</h1>
            <p style={styles.handle}>{channel.handle}</p>
            <p style={styles.stats}>
              チャンネル登録者 {subCount.toLocaleString()}人 · 動画 {videos.length}本
            </p>
            {channel.description && (
              <p style={styles.desc}>{channel.description}</p>
            )}
          </div>

          {/* サブスクボタン */}
          <div style={styles.actions}>
            {isOwner ? (
              <Link to="/upload" style={styles.uploadBtn}>＋ 動画をアップロード</Link>
            ) : (
              <button
                style={{
                  ...styles.subBtn,
                  background: subscribed ? '#333' : '#ff4444',
                }}
                onClick={handleSubscribe}
              >
                {subscribed ? '登録済み' : 'チャンネル登録'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 動画一覧 */}
      <div style={styles.content}>
        <h2 style={styles.sectionTitle}>動画</h2>
        {videos.length === 0 ? (
          <p style={styles.empty}>まだ動画がありません。</p>
        ) : (
          <div style={styles.grid}>
            {videos.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#0f0f0f', fontFamily: "'Noto Sans JP', sans-serif" },
  msg: { color: '#555', textAlign: 'center', padding: '80px 0', fontSize: '15px' },
  banner: { width: '100%', height: '180px', overflow: 'hidden', background: '#1a1a1a' },
  bannerImg: { width: '100%', height: '100%', objectFit: 'cover' },
  bannerPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
  header: { borderBottom: '1px solid #222', padding: '24px 0' },
  headerInner: {
    maxWidth: '1280px', margin: '0 auto', padding: '0 24px',
    display: 'flex', gap: '20px', alignItems: 'flex-start',
  },
  avatar: {
    width: '80px', height: '80px', borderRadius: '50%',
    background: '#ff4444', color: '#fff', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '32px', fontWeight: '700',
  },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' },
  handle: { color: '#888', fontSize: '14px', margin: '0 0 4px' },
  stats: { color: '#888', fontSize: '13px', margin: '0 0 8px' },
  desc: { color: '#aaa', fontSize: '14px', margin: 0, lineHeight: '1.5' },
  actions: { flexShrink: 0 },
  subBtn: {
    border: 'none', borderRadius: '20px', color: '#fff',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '10px 24px',
    transition: 'background 0.2s',
  },
  uploadBtn: {
    background: '#ff4444', borderRadius: '20px', color: '#fff',
    fontSize: '14px', fontWeight: '600', padding: '10px 24px',
    textDecoration: 'none', whiteSpace: 'nowrap',
  },
  content: { maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' },
  sectionTitle: { color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px 16px' },
  empty: { color: '#555', fontSize: '14px' },
}
