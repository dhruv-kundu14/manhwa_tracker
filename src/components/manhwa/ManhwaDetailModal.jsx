import React from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import StatusBadge from './StatusBadge.jsx'
import { useUiStore } from '../../store/uiStore.js'
import { Star, BookOpen, Hash, Globe, Edit } from 'lucide-react'

export default function ManhwaDetailModal({ entry, onEdit }) {
  const closeModal = useUiStore((s) => s.closeModal)
  const openModal  = useUiStore((s) => s.openModal)
  const manhwa     = entry?.manhwa ?? entry
  if (!entry) return null

  // cover gradient fallback
  let hue = 0
  const t = manhwa.title ?? ''
  for (let i = 0; i < t.length; i++) hue = (hue * 31 + t.charCodeAt(i)) % 360
  const coverBg = manhwa.coverUrl
    ? `url(${manhwa.coverUrl}) center/cover`
    : `linear-gradient(135deg,hsl(${hue},38%,12%),hsl(${(hue+50)%360},50%,20%))`

  const handleReadOnline = () => {
    closeModal()
    openModal('readOnline', { entry })
  }

  return (
    <Modal
      title={manhwa.title}
      onClose={closeModal}
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between' }}>
          <Button variant="ghost" onClick={closeModal}>Close</Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={() => { closeModal(); onEdit(entry) }}>
              <Edit size={14} /> Edit
            </Button>
            <Button onClick={handleReadOnline}>
              <Globe size={14} /> Read Online
            </Button>
          </div>
        </div>
      }
    >
      {/* Cover */}
      <div style={{
        height: 150, borderRadius: 8, marginBottom: 16,
        background: coverBg, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.75),rgba(0,0,0,.1))' }} />
        <div style={{ position: 'absolute', bottom: 12, left: 14, zIndex: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge status={entry.readingStatus} />
          {manhwa.status && (
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#aaa', background: 'rgba(0,0,0,.5)', padding: '2px 8px', borderRadius: 4 }}>
              {manhwa.status}
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 14, flexWrap: 'wrap' }}>
        <InfoChip icon={<BookOpen size={13} />}
          label={`Ch. ${entry.currentChapter ?? 0}${manhwa.totalChapters ? ` / ${manhwa.totalChapters}` : ''}`} />
        {entry.rating && <InfoChip icon={<Star size={13} fill="#f5a623" color="#f5a623" />} label={`${entry.rating} / 10`} />}
        {manhwa.author && <InfoChip icon={<Hash size={13} />} label={manhwa.author} />}
      </div>

      {/* Description */}
      {manhwa.description && (
        <p style={{
          fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12,
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {manhwa.description}
        </p>
      )}

      {/* Genres */}
      <div className="genre-tags">
        {(manhwa.genres ?? []).map((g) => <span key={g} className="genre-tag">{g}</span>)}
      </div>

      {/* Notes */}
      {entry.notes && (
        <div style={{
          marginTop: 12, padding: '10px 12px', background: 'var(--surface2)',
          borderRadius: 6, fontSize: 13, color: 'var(--text2)',
          fontStyle: 'italic', borderLeft: '2px solid var(--accent)',
        }}>
          "{entry.notes}"
        </div>
      )}

      {/* Read online hint */}
      <div style={{
        marginTop: 14, padding: '10px 14px',
        background: 'rgba(0,180,216,.06)', border: '1px solid rgba(0,180,216,.15)',
        borderRadius: 8, fontSize: 12, color: 'var(--muted)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Globe size={13} color="var(--accent2)" />
        Click <strong style={{ color: 'var(--text)' }}>Read Online</strong> to choose from
        ManhwaClan, MangaDex, Toonily, and more.
      </div>
    </Modal>
  )
}

function InfoChip({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>
      {icon}{label}
    </div>
  )
}
