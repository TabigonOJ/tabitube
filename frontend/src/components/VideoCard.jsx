import { Link } from 'react-router-dom'

// 秒数を "mm:ss" に変換
function formatDuration(seconds) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// 再生数を "1.2万回" などに変換
function formatViews(count) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万回`
  if (count >= 1000)  return `${(count / 1000).toFixed(1)}千回`
  return `${count}回`
}

// 投稿日を "3日前" などに変換
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins  = Math.floor(diff / 60000)
  if (days >= 365) return `${Math.floor(days / 365)}年前`
  if (days >= 30)  return `${Math.floor(days / 30)}ヶ月前`
  if (days >= 1)   return `${days}日前`
  if (hours >= 1)  return `${hours}時間前`
  return `${mins}分前`
}

export default function VideoCard({ video }) {
  return (
    <Link to={`/watch/${video.id}`} style={styles.card}>
      {/* サムネイル */}
      <div style={styles.thumbWrap}>
        {video.thumbnail ? (
          <img
            src={`http://localhost:8000/storage/${video.thumbnail}`}
            alt={video.title}
            style={styles.thumb}
          />
        ) : (
          <div style={styles.thumbPlaceholder}>▶</div>
        )}
        {video.duration && (
          <span style={styles.duration}>{formatDuration(video.duration)}</span>
        )}
      </div>

      {/* メタ情報 */}
      <div style={styles.meta}>
        <p style={styles.title}>{video.title}</p>
        <p style={styles.channel}>{video.channel?.name}</p>
        <p style={styles.stats}>
          {formatViews(video.view_count)} · {timeAgo(video.published_at)}
        </p>
      </div>
    </Link>
  )
}

const styles = {
  card: {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
  thumbWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    background: '#1a1a1a',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  thumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    color: '#333',
    background: '#111',
  },
  duration: {
    position: 'absolute',
    bottom: '6px',
    right: '8px',
    background: 'rgba(0,0,0,0.85)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  meta: {
    padding: '0 4px',
  },
  title: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  channel: {
    color: '#aaa',
    fontSize: '13px',
    margin: '0 0 2px',
  },
  stats: {
    color: '#888',
    fontSize: '12px',
    margin: 0,
  },
}
