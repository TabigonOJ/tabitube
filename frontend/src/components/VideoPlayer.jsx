import { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

/**
 * VideoPlayer
 * - HLS（m3u8）が利用可能な場合 → Video.js + HLS.js で品質切り替え対応
 * - HLS未対応の場合 → チャンクストリーミング（Range対応）にフォールバック
 */
export default function VideoPlayer({ video }) {
  const videoRef  = useRef(null)
  const playerRef = useRef(null)

  const BASE_URL      = 'http://localhost:8000/api'
  const hlsUrl        = `${BASE_URL}/videos/${video.id}/hls/playlist.m3u8`
  const streamUrl     = `${BASE_URL}/videos/${video.id}/stream`
  const hlsAvailable  = video.hls_available === true

  useEffect(() => {
    if (!videoRef.current) return

    // Video.js の初期化オプション
    const options = {
      controls:    true,
      autoplay:    false,
      preload:     'auto',
      fluid:       true,          // アスペクト比を自動維持
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      html5: {
        vhs: {
          overrideNative: true,   // HLS.jsを優先（Safariでも統一）
        },
      },
      sources: hlsAvailable
        ? [{ src: hlsUrl, type: 'application/x-mpegURL' }]
        : [{ src: streamUrl, type: video.mime_type || 'video/mp4' }],
    }

    playerRef.current = videojs(videoRef.current, options, function () {
      console.log(
        hlsAvailable
          ? 'Video.js: HLSモードで起動'
          : 'Video.js: チャンクストリーミングモードで起動'
      )
    })

    // 品質切り替えプラグイン（HLS時のみ）
    if (hlsAvailable) {
      playerRef.current.on('loadedmetadata', () => {
        const qualityLevels = playerRef.current.qualityLevels?.()
        if (qualityLevels) {
          qualityLevels.on('addqualitylevel', (e) => {
            const level = e.qualityLevel
            // 高品質から自動選択
            level.enabled = true
          })
        }
      })
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [video.id])

  return (
    <div style={styles.wrap}>
      {/* ストリーミングモード表示 */}
      <div style={styles.badge}>
        {hlsAvailable ? '📡 HLS' : '▶ チャンクストリーミング'}
      </div>

      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered vjs-theme-tabitube"
          playsInline
        />
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    position: 'relative',
    width: '100%',
    background: '#000',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '20px',
    zIndex: 10,
    letterSpacing: '0.5px',
  },
}
