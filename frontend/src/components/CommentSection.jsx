import { useState, useEffect } from 'react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins  = Math.floor(diff / 60000)
  if (days >= 1)  return `${days}日前`
  if (hours >= 1) return `${hours}時間前`
  return `${mins}分前`
}

// ─── 単一コメント ──────────────────────────────────────────────
function CommentItem({ comment, videoId, onDelete }) {
  const { user }              = useAuthStore()
  const [liked, setLiked]     = useState(false)
  const [likes, setLikes]     = useState(comment.like_count || 0)
  const [reply, setReply]     = useState('')
  const [showReply, setShowReply] = useState(false)
  const [replies, setReplies] = useState(comment.replies || [])

  const handleLike = async () => {
    if (!user) return
    try {
      const { data } = await api.post(`/comments/${comment.id}/like`)
      setLiked(data.liked)
      setLikes(data.like_count)
    } catch {}
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    try {
      const { data } = await api.post(`/videos/${videoId}/comments`, {
        body: reply,
        parent_id: comment.id,
      })
      setReplies(prev => [data, ...prev])
      setReply('')
      setShowReply(false)
    } catch {}
  }

  return (
    <div style={styles.commentItem}>
      <div style={styles.avatar}>{comment.user?.name?.[0]?.toUpperCase()}</div>
      <div style={styles.commentBody}>
        <div style={styles.commentMeta}>
          <span style={styles.commentUser}>{comment.user?.name}</span>
          <span style={styles.commentTime}>{timeAgo(comment.created_at)}</span>
        </div>
        <p style={styles.commentText}>{comment.body}</p>

        {/* アクション */}
        <div style={styles.commentActions}>
          <button style={styles.actionBtn} onClick={handleLike}>
            {liked ? '❤️' : '🤍'} {likes > 0 && likes}
          </button>
          {user && (
            <button style={styles.actionBtn} onClick={() => setShowReply(!showReply)}>
              返信
            </button>
          )}
          {user?.id === comment.user_id && (
            <button style={{ ...styles.actionBtn, color: '#ff4444' }} onClick={() => onDelete(comment.id)}>
              削除
            </button>
          )}
        </div>

        {/* 返信フォーム */}
        {showReply && (
          <form onSubmit={handleReply} style={styles.replyForm}>
            <input
              type="text"
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="返信を入力..."
              style={styles.replyInput}
              autoFocus
            />
            <button type="submit" style={styles.replyBtn}>送信</button>
            <button type="button" style={styles.cancelBtn} onClick={() => setShowReply(false)}>キャンセル</button>
          </form>
        )}

        {/* 返信一覧 */}
        {replies.length > 0 && (
          <div style={styles.replies}>
            {replies.map(r => (
              <div key={r.id} style={styles.replyItem}>
                <div style={{ ...styles.avatar, width: '28px', height: '28px', fontSize: '12px' }}>
                  {r.user?.name?.[0]?.toUpperCase()}
                </div>
                <div style={styles.commentBody}>
                  <div style={styles.commentMeta}>
                    <span style={styles.commentUser}>{r.user?.name}</span>
                    <span style={styles.commentTime}>{timeAgo(r.created_at)}</span>
                  </div>
                  <p style={styles.commentText}>{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── コメントセクション本体 ────────────────────────────────────
export default function CommentSection({ video }) {
  const { user }                = useAuthStore()
  const [comments, setComments] = useState([])
  const [body, setBody]         = useState('')
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(true)

  useEffect(() => {
    fetchComments(1, true)
  }, [video.id])

  const fetchComments = async (pageNum = page, reset = false) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/videos/${video.id}/comments`, {
        params: { page: pageNum },
      })
      setComments(prev => reset ? data.data : [...prev, ...data.data])
      setHasMore(data.current_page < data.last_page)
      setPage(pageNum + 1)
    } catch {}
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    try {
      const { data } = await api.post(`/videos/${video.id}/comments`, { body })
      setComments(prev => [data, ...prev])
      setBody('')
    } catch {}
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/comments/${id}`)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch {}
  }

  return (
    <div style={styles.section}>
      <h2 style={styles.heading}>{video.comment_count || 0} 件のコメント</h2>

      {/* 投稿フォーム */}
      {user ? (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.avatar}>{user.name?.[0]?.toUpperCase()}</div>
            <input
              type="text"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="コメントを追加..."
              style={styles.input}
            />
          </div>
          <div style={styles.formActions}>
            <button type="submit" style={styles.submitBtn} disabled={!body.trim()}>
              コメント
            </button>
          </div>
        </form>
      ) : (
        <p style={styles.loginPrompt}>コメントするには<a href="/login" style={styles.link}>ログイン</a>してください</p>
      )}

      {/* コメント一覧 */}
      <div style={styles.list}>
        {comments.map(c => (
          <CommentItem
            key={c.id}
            comment={c}
            videoId={video.id}
            onDelete={handleDelete}
          />
        ))}
        {loading && <p style={styles.loading}>読み込み中...</p>}
        {!loading && hasMore && (
          <button style={styles.moreBtn} onClick={() => fetchComments()}>
            もっと見る
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  section: { marginTop: '24px' },
  heading: { color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '20px' },
  form: { marginBottom: '24px' },
  formRow: { display: 'flex', gap: '12px', alignItems: 'center' },
  formActions: { display: 'flex', justifyContent: 'flex-end', marginTop: '8px' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: '#ff4444', color: '#fff', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: '700', flexShrink: 0,
  },
  input: {
    flex: 1, background: 'transparent', border: 'none',
    borderBottom: '1px solid #333', color: '#fff',
    fontSize: '14px', outline: 'none', padding: '8px 0',
  },
  submitBtn: {
    background: '#ff4444', border: 'none', borderRadius: '20px',
    color: '#fff', cursor: 'pointer', fontSize: '13px',
    fontWeight: '600', padding: '8px 20px',
  },
  loginPrompt: { color: '#666', fontSize: '14px', marginBottom: '24px' },
  link: { color: '#ff4444', textDecoration: 'none' },
  list: { display: 'flex', flexDirection: 'column', gap: '20px' },
  commentItem: { display: 'flex', gap: '12px' },
  commentBody: { flex: 1 },
  commentMeta: { display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px' },
  commentUser: { color: '#fff', fontSize: '13px', fontWeight: '600' },
  commentTime: { color: '#666', fontSize: '12px' },
  commentText: { color: '#ccc', fontSize: '14px', lineHeight: '1.5', margin: '0 0 8px' },
  commentActions: { display: 'flex', gap: '12px' },
  actionBtn: {
    background: 'none', border: 'none', color: '#888',
    cursor: 'pointer', fontSize: '13px', padding: '0',
  },
  replyForm: { display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' },
  replyInput: {
    flex: 1, background: 'transparent', border: 'none',
    borderBottom: '1px solid #333', color: '#fff',
    fontSize: '13px', outline: 'none', padding: '6px 0',
  },
  replyBtn: {
    background: '#ff4444', border: 'none', borderRadius: '16px',
    color: '#fff', cursor: 'pointer', fontSize: '12px', padding: '6px 14px',
  },
  cancelBtn: {
    background: 'none', border: 'none', color: '#888',
    cursor: 'pointer', fontSize: '12px', padding: '6px',
  },
  replies: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' },
  replyItem: { display: 'flex', gap: '10px' },
  loading: { color: '#555', fontSize: '14px', textAlign: 'center' },
  moreBtn: {
    background: 'none', border: '1px solid #333', borderRadius: '8px',
    color: '#aaa', cursor: 'pointer', fontSize: '13px', padding: '8px 20px',
  },
}
