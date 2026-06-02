import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import VideoCard from '../components/VideoCard'

function formatViews(count) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万回視聴`
  if (count >= 1000)  return `${(count / 1000).toFixed(1)}千回視聴`
  return `${count}回視聴`
}

export default function WatchPage() {
  const { id }              = useParams()
  const [video, setVideo]   = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setVideo(null)
    fetchVideo()
    fetchRelated()
  }, [id])

  const fetchVideo = async () => {
    try {
      const { data } = await api.get(`/videos/${id}`)
      setVideo(data)
    } catch {
      setError('動画が見つかりません。')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelated = async () => {
    try {
      const { data } = await api.get('/videos', { params: { page: 1 } })
      setRelated(data.data.filter(v => v.id !== Number(id)).slice(0, 8))
    } catch {}
  }

  if (loading) return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.loadingMsg}>読み込み中...</div>
    </div>
  )

  if (error || !video) return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.errorMsg}>{error || '動画が見つかりません。'}</div>
    </div>
  )

  const streamUrl = `http://localhost:8000/api/videos/${video.id}/stream`

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.layout}>

        {/* 左: プレーヤー＋詳細 */}
        <div style={styles.main}>
          {/* 動画プレーヤー */}
          <div style={styles.playerWrap}>
            <video
              src={streamUrl}
              controls
              autoPlay
              style={styles.player}
            />
          </div>

          {/* タイトル */}
          <h1 style={styles.title}>{video.title}</h1>

          {/* チャンネル＋再生数 */}
          <div style={styles.metaRow}>
            <Link to={`/channel/${video.channel?.id}`} style={styles.channelLink}>
              <div style={styles.channelAvatar}>
                {video.channel?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={styles.channelName}>{video.channel?.name}</p>
              </div>
            </Link>
            <span style={styles.views}>{formatViews(video.view_count)}</span>
          </div>

          {/* 説明文 */}
          {video.description && (
            <div style={styles.descBox}>
              <p style={{
                ...styles.desc,
                WebkitLineClamp: expanded ? 'unset' : 3,
                WebkitBoxOrient: 'vertical',
                display: expanded ? 'block' : '-webkit-box',
                overflow: expanded ? 'visible' : 'hidden',
              }}>
                {video.description}
              </p>
              <button style={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
                {expanded ? '折りたたむ' : 'もっと見る'}
              </button>
            </div>
          )}

          {/* タグ */}
          {video.tags?.length > 0 && (
            <div style={styles.tags}>
              {video.tags.map(tag => (
                <Link key={tag.id} to={`/?tag=${tag.slug}`} style={styles.tag}>
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 右: 関連動画 */}
        <aside style={styles.aside}>
          <p style={styles.asideTitle}>関連動画</p>
          <div style={styles.relatedList}>
            {related.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        </aside>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f0f0f',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  layout: {
    display: 'flex',
    gap: '24px',
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  playerWrap: {
    width: '100%',
    aspectRatio: '16/9',
    background: '#000',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  player: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: '#fff',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 16px',
    lineHeight: '1.4',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  channelLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  channelAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#ff4444',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700',
    flexShrink: 0,
  },
  channelName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
  },
  views: {
    color: '#888',
    fontSize: '13px',
  },
  descBox: {
    background: '#1a1a1a',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '16px',
  },
  desc: {
    color: '#ccc',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 8px',
    whiteSpace: 'pre-wrap',
  },
  expandBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '13px',
    padding: 0,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    background: '#1a2a3a',
    borderRadius: '20px',
    color: '#4da8ff',
    fontSize: '13px',
    padding: '4px 12px',
    textDecoration: 'none',
  },
  aside: {
    width: '360px',
    flexShrink: 0,
  },
  asideTitle: {
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 16px',
  },
  relatedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  loadingMsg: {
    color: '#555',
    textAlign: 'center',
    padding: '80px 0',
    fontSize: '15px',
  },
  errorMsg: {
    color: '#ff4444',
    textAlign: 'center',
    padding: '80px 0',
    fontSize: '15px',
  },
}
