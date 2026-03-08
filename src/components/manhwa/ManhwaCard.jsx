import React, { useState } from 'react'
import { Star, Globe } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import { useUiStore } from '../../store/uiStore.js'

function titleToColors(title = '') {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) % 360
  return {
    bg:     `hsl(${h}, 40%, 10%)`,
    accent: `hsl(${(h + 40) % 360}, 70%, 55%)`,
  }
}

export default function ManhwaCard({ entry, onClick }) {
  const [imgError, setImgError] = useState(false)
  const [hovered,  setHovered]  = useState(false)
  const openModal  = useUiStore((s) => s.openModal)

  const manhwa = entry.manhwa ?? entry
  const { bg, accent } = titleToColors(manhwa.title)
  const fallbackBg = `linear-gradient(135deg, ${bg}, ${accent}22)`
  const hasCover   = manhwa.coverUrl && !imgError

  const progress = manhwa.totalChapters && entry.currentChapter
    ? Math.min(100, Math.round((entry.currentChapter / manhwa.totalChapters) * 100))
    : 0

  const statusColors = {
    READING:      '#00b4d8',
    WANT_TO_READ: '#f5a623',
    COMPLETED:    '#2dc653',
    DROPPED:      '#e94560',
  }
  const barColor = statusColors[entry.readingStatus] ?? '#666'

  const handleReadOnline = (e) => {
    e.stopPropagation()
    openModal('readOnline', { entry })
  }

  return (
    <div
      className="manhwa-card"
      onClick={() => onClick?.(entry)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      {/* Cover */}
      <div className="manhwa-cover" style={{ background: fallbackBg, padding: 0, position: 'relative', overflow: 'hidden' }}>
        {hasCover && (
          <img
            src={manhwa.coverUrl}
            alt={manhwa.title}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {!hasCover && (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>
              {manhwa.title}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.8) 0%,transparent 55%)' }} />

        {/* Status badge */}
        <div style={{ position: 'absolute', top: 7, left: 7, zIndex: 2 }}>
          <StatusBadge status={entry.readingStatus} small />
        </div>

        {/* Title overlay */}
        {hasCover && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '8px 10px', zIndex: 2,
            fontFamily: 'var(--font-display)', fontSize: 12, lineHeight: 1.2, color: '#fff',
          }}>
            {manhwa.title}
          </div>
        )}

        {/* Read Online hover overlay */}
        <div
          onClick={handleReadOnline}
          style={{
            position: 'absolute', inset: 0, zIndex: 3,
            background: 'rgba(0,0,0,.65)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: hovered ? 1 : 0,
            transition: 'opacity .2s',
            cursor: 'pointer',
          }}
        >
          <Globe size={22} color="#fff" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fff', letterSpacing: '.5px' }}>
            READ ONLINE
          </span>
          {entry.currentChapter > 0 && (
            <span style={{ fontSize: 10, color: '#aaa', fontFamily: 'var(--font-mono)' }}>
              Ch. {entry.currentChapter + 1} →
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="manhwa-info">
        {!hasCover && (
          <div style={{
            fontSize: 12, fontWeight: 600, marginBottom: 4, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {manhwa.title}
          </div>
        )}

        <div className="manhwa-meta">
          <span className="chapter-text">
            {entry.readingStatus === 'WANT_TO_READ'
              ? 'Not started'
              : `Ch. ${entry.currentChapter ?? 0}${manhwa.totalChapters ? `/${manhwa.totalChapters}` : ''}`}
          </span>
          {entry.rating && (
            <span className="rating-badge">
              <Star size={12} fill="#f5a623" color="#f5a623" />
              {entry.rating}
            </span>
          )}
        </div>

        {entry.readingStatus !== 'WANT_TO_READ' && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%`, background: barColor }} />
          </div>
        )}

        <div className="genre-tags">
          {(manhwa.genres ?? []).slice(0, 2).map((g) => (
            <span key={g} className="genre-tag">{g}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
