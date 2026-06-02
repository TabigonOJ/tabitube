import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import VideoCard from '../components/VideoCard'
import Navbar from '../components/Navbar'

export default function HomePage() {
  const [videos, setVideos]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [hasMore, setHasMore]       = useState(true)
  const [searchParams]              = useSearchParams()
  const search                      = searchParams.get('search') || ''
  const tag                         = searchParams.get('tag') || ''

  useEffect(() => {
    setVideos([])
    setPage(1)
    setHasMore(true)
    fetchVideos(1, true)
  }, [search, tag])

  const fetchVideos = async (pageNum = page, reset = false) => {
    setLoading(true)
    try {
      const { data } = await api.get('/videos', {
        params: { page: pageNum, search, tag },
      })
      setVideos(prev => reset ? data.data : [...prev, ...data.data])
      setHasMore(data.current_page < data.last_page)
      setPage(pageNum + 1)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>
        {/* 検索・タグヘッダー */}
        {(search || tag) && (
          <p style={styles.searchLabel}>
            {search && `「${search}」の検索結果`}
            {tag && `タグ: #${tag}`}
          </p>
        )}

        {/* 動画グリッド */}
        {videos.length === 0 && !loading ? (
          <div style={styles.empty}>動画がまだありません。</div>
        ) : (
          <div style={styles.grid}>
            {videos.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div style={styles.loading}>読み込み中...</div>
        )}

        {/* もっと見るボタン */}
        {!loading && hasMore && (
          <div style={styles.moreWrap}>
            <button style={styles.moreBtn} onClick={() => fetchVideos()}>
              もっと見る
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f0f0f',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  main: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  searchLabel: {
    color: '#aaa',
    fontSize: '14px',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px 16px',
  },
  empty: {
    color: '#555',
    textAlign: 'center',
    padding: '80px 0',
    fontSize: '15px',
  },
  loading: {
    color: '#555',
    textAlign: 'center',
    padding: '40px 0',
    fontSize: '14px',
  },
  moreWrap: {
    textAlign: 'center',
    marginTop: '40px',
  },
  moreBtn: {
    background: '#222',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '12px 32px',
  },
}
