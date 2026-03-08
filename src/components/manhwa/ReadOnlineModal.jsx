import React, { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import { useUiStore } from '../../store/uiStore.js'
import { useLibraryStore } from '../../store/libraryStore.js'
import { SOURCES, openChapterPage, openSearchPage } from '../../lib/readOnline.js'
import { ExternalLink, Search, BookOpen, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReadOnlineModal() {
  const closeModal = useUiStore((s) => s.closeModal)
  const modalData = useUiStore((s) => s.modalData)
  const updateEntry = useLibraryStore((s) => s.updateEntry)

  const entry = modalData?.entry
  const manhwa = entry?.manhwa ?? {}
  const title = manhwa.title ?? ''

  // Chapter state — pre-fill with next chapter or 1
  const savedChapter = entry?.currentChapter ?? 0
  const [chapterInput, setChapterInput] = useState(
    savedChapter > 0 ? savedChapter + 1 : 1
  )
  const [sourceClicked, setSourceClicked] = useState(null)

  // Cover bg
  let hue = 0
  for (let i = 0; i < title.length; i++) hue = (hue * 31 + title.charCodeAt(i)) % 360
  const coverBg = manhwa.coverUrl
    ? `url(${manhwa.coverUrl}) center/cover`
    : `linear-gradient(135deg,hsl(${hue},38%,12%),hsl(${(hue + 50) % 360},50%,20%))`

  const isWishlist = entry?.readingStatus === 'WANT_TO_READ'

  const handleRead = (sourceId) => {
    setSourceClicked(sourceId)

    // Auto-update: set status to READING + save chapter
    if (entry?._id) {
      const patch = { currentChapter: chapterInput }
      if (isWishlist || entry?.readingStatus !== 'READING') {
        patch.readingStatus = 'READING'
      }
      updateEntry(entry._id, patch)
      if (isWishlist) toast.success('Status updated to Reading!')
    }

    openChapterPage(sourceId, { title, chapter: chapterInput })
    closeModal()
  }

  const handleSearch = (sourceId) => {
    if (entry?._id && isWishlist) {
      updateEntry(entry._id, { readingStatus: 'READING', currentChapter: chapterInput })
      toast.success('Status updated to Reading!')
    }
    openSearchPage(sourceId, { title })
    closeModal()
  }

  const adjustChapter = (delta) => {
    setChapterInput((v) => Math.max(1, v + delta))
  }

  return (
    <Modal title="Read Online" onClose={closeModal}>

      {/* Cover strip */}
      <div style={{
        height: 90, borderRadius: 8, marginBottom: 18,
        background: coverBg, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.82),rgba(0,0,0,.15))' }} />
        <div style={{ position: 'absolute', bottom: 10, left: 14, zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', lineHeight: 1 }}>{title}</div>
          <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
            {isWishlist ? 'Wishlist → will move to Reading' : `Currently at Ch. ${savedChapter}`}
          </div>
        </div>
      </div>

      {/* Status change notice */}
      {isWishlist && (
        <div style={{
          padding: '8px 14px', marginBottom: 14,
          background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.25)',
          borderRadius: 8, fontSize: 12, color: 'var(--muted)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <BookOpen size={13} color="#f97316" />
          Clicking Read will automatically move this to <strong style={{ color: '#f97316', margin: '0 2px' }}>Reading</strong>
        </div>
      )}

      {/* Chapter selector */}
      <div style={{
        marginBottom: 16, padding: '12px 16px',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
      }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          Chapter to read
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => adjustChapter(-1)} style={{
            width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)', flexShrink: 0,
          }}>
            <ChevronDown size={16} />
          </button>

          <input
            type="number"
            min={1}
            value={chapterInput}
            onChange={(e) => setChapterInput(Math.max(1, parseInt(e.target.value) || 1))}
            style={{
              flex: 1, textAlign: 'center', padding: '8px 12px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 18, fontWeight: 700,
              fontFamily: 'var(--font-mono)', outline: 'none',
            }}
          />

          <button onClick={() => adjustChapter(1)} style={{
            width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)', flexShrink: 0,
          }}>
            <ChevronUp size={16} />
          </button>

          {savedChapter > 0 && chapterInput !== savedChapter + 1 && (
            <button
              onClick={() => setChapterInput(savedChapter + 1)}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 11,
                fontFamily: 'var(--font-mono)', cursor: 'pointer',
                border: '1px solid var(--border)', background: 'var(--surface2)',
                color: 'var(--muted)', flexShrink: 0,
              }}
            >
              Reset to {savedChapter + 1}
            </button>
          )}
        </div>

        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 8, textAlign: 'center' }}>
          {savedChapter > 0
            ? `Last read: Ch. ${savedChapter} · This will save Ch. ${chapterInput} to your library`
            : `This will save Ch. ${chapterInput} and mark as Reading`}
        </div>
      </div>

      {/* Source buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SOURCES.map((source) => (
          <div key={source.id} style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleRead(source.id)}
              style={{
                flex: 1, padding: '14px 16px',
                background: sourceClicked === source.id ? `${source.color}14` : 'var(--surface)',
                border: `1px solid ${sourceClicked === source.id ? source.color + '55' : 'var(--border)'}`,
                borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all .15s', textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = source.color + '66'
                e.currentTarget.style.background = source.color + '0e'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = sourceClicked === source.id ? source.color + '55' : 'var(--border)'
                e.currentTarget.style.background = sourceClicked === source.id ? `${source.color}14` : 'var(--surface)'
              }}
            >
              <span style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `${source.color}18`, border: `1px solid ${source.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                {source.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  {source.name}
                  <span style={{ marginLeft: 8, fontSize: 11, color: source.color, fontFamily: 'var(--font-mono)' }}>
                    Ch. {chapterInput}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  {source.note}
                </div>
              </div>
              <ExternalLink size={15} color={source.color} style={{ opacity: 0.7, flexShrink: 0 }} />
            </button>

            {/* Search fallback */}
            <button
              title={`Search "${title}" on ${source.name}`}
              onClick={() => handleSearch(source.id)}
              style={{
                width: 42, borderRadius: 10,
                background: 'var(--surface)', border: '1px solid var(--border)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--muted)', transition: 'all .15s', flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = source.color + '55'; e.currentTarget.style.color = source.color }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
            >
              <Search size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: 16, padding: '8px 12px', background: 'var(--surface2)',
        borderRadius: 6, fontSize: 11, color: '#555', lineHeight: 1.5, fontFamily: 'var(--font-mono)',
      }}>
        ℹ️ All links open in a new tab. Chapter number is saved to your library automatically.
        Use 🔍 if the direct link doesn't work.
      </div>
    </Modal>
  )
}