import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Navbar from '../components/Navbar'

export default function UploadPage() {
  const navigate              = useNavigate()
  const fileRef               = useRef(null)
  const [file, setFile]       = useState(null)
  const [title, setTitle]     = useState('')
  const [desc, setDesc]       = useState('')
  const [tags, setTags]       = useState('')
  const [visibility, setVis]  = useState('public')
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError]     = useState(null)
  const [done, setDone]       = useState(false)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setError(null)

    const form = new FormData()
    form.append('video', file)
    form.append('title', title)
    form.append('description', desc)
    form.append('visibility', visibility)
    tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
      form.append('tags[]', t)
    })

    try {
      const { data } = await api.post('/videos', form, {
        headers: { 'Content-Type': 'multipart/form-data' ,
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total))
        },
      })
      setDone(true)
      setTimeout(() => navigate(`/watch/${data.video.id}`), 2000)
    } catch (err) {
      // バリデーションエラーの詳細を表示
      console.log(err.response?.data)
      setError(JSON.stringify(err.response?.data?.errors || err.response?.data?.message))
      setUploading(false)
    }
  }

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <h1 style={styles.heading}>動画をアップロード</h1>

        {done ? (
          <div style={styles.successBox}>
            ✅ アップロード完了！処理中です。動画ページへ移動します...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* ファイル選択 */}
            <div
              style={styles.dropZone}
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <p style={styles.fileName}>📹 {file.name}</p>
              ) : (
                <>
                  <p style={styles.dropIcon}>📁</p>
                  <p style={styles.dropText}>クリックして動画を選択</p>
                  <p style={styles.dropSub}>MP4 / MOV / AVI / WebM · 最大500MB</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
            </div>

            {/* タイトル */}
            <label style={styles.label}>タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={styles.input}
              placeholder="動画のタイトルを入力"
              required
            />

            {/* 説明 */}
            <label style={styles.label}>説明</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              style={{ ...styles.input, height: '100px', resize: 'vertical' }}
              placeholder="動画の説明（任意）"
            />

            {/* タグ */}
            <label style={styles.label}>タグ（カンマ区切り）</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              style={styles.input}
              placeholder="旅行, 観光, 日本"
            />

            {/* 公開設定 */}
            <label style={styles.label}>公開設定</label>
            <select
              value={visibility}
              onChange={e => setVis(e.target.value)}
              style={styles.input}
            >
              <option value="public">公開</option>
              <option value="unlisted">限定公開</option>
              <option value="private">非公開</option>
            </select>

            {/* エラー */}
            {error && <div style={styles.errorBox}>{error}</div>}

            {/* プログレスバー */}
            {uploading && (
              <div style={styles.progressWrap}>
                <div style={{ ...styles.progressBar, width: `${progress}%` }} />
                <span style={styles.progressText}>{progress}%</span>
              </div>
            )}

            {/* 送信 */}
            <button
              type="submit"
              style={styles.button}
              disabled={uploading || !file}
            >
              {uploading ? `アップロード中... ${progress}%` : 'アップロード'}
            </button>
          </form>
        )}
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
  container: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '40px 16px',
  },
  heading: {
    color: '#fff',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  dropZone: {
    background: '#1a1a1a',
    border: '2px dashed #333',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '16px',
    minHeight: '160px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    transition: 'border-color 0.2s',
  },
  dropIcon: {
    fontSize: '48px',
    margin: '0 0 8px',
  },
  dropText: {
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 4px',
  },
  dropSub: {
    color: '#666',
    fontSize: '13px',
    margin: 0,
  },
  fileName: {
    color: '#fff',
    fontSize: '14px',
    margin: 0,
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
    fontSize: '14px',
    outline: 'none',
    padding: '12px 14px',
    width: '100%',
    boxSizing: 'border-box',
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
    transition: 'opacity 0.2s',
  },
  errorBox: {
    background: '#2a1515',
    border: '1px solid #ff4444',
    borderRadius: '8px',
    color: '#ff8080',
    fontSize: '14px',
    marginTop: '8px',
    padding: '12px 14px',
  },
  successBox: {
    background: '#152a15',
    border: '1px solid #44ff44',
    borderRadius: '8px',
    color: '#80ff80',
    fontSize: '15px',
    padding: '20px',
    textAlign: 'center',
  },
  progressWrap: {
    background: '#1a1a1a',
    borderRadius: '8px',
    height: '8px',
    marginTop: '12px',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    background: '#ff4444',
    height: '100%',
    transition: 'width 0.3s',
  },
  progressText: {
    color: '#888',
    fontSize: '12px',
    position: 'absolute',
    right: '8px',
    top: '-18px',
  },
}
