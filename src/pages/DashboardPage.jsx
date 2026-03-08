import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import { useLibraryStore } from '../store/libraryStore.js'
import { useUiStore } from '../store/uiStore.js'
import ManhwaCard from '../components/manhwa/ManhwaCard.jsx'
import { ChevronRight, BookOpen, Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const user          = useAuthStore((s) => s.user)
  const openModal     = useUiStore((s) => s.openModal)
  const navigate      = useNavigate()
  const entries       = useLibraryStore((s) => s.entries)
  const getStats      = useLibraryStore((s) => s.getStats)
  const exportLibrary = useLibraryStore((s) => s.exportLibrary)
  const importLibrary = useLibraryStore((s) => s.importLibrary)
  const importRef     = useRef()

  const stats   = getStats()
  const reading = entries.filter((e) => e.readingStatus === 'READING')
  const recent  = [...entries]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6)

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importLibrary(ev.target.result)
      if (result.ok) toast.success(`Imported ${result.count} entries!`)
      else toast.error(result.message)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 4 }}>
          Hey, {user?.username} 👋
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {stats.total === 0
            ? 'Your library is empty — head to Discover to add some manhwa!'
            : `${stats.total} titles in your library`}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ marginBottom: 28 }}>
        {[
          { cls: 'reading',   n: stats.reading,   label: 'Reading'   },
          { cls: 'completed', n: stats.completed,  label: 'Completed' },
          { cls: 'wishlist',  n: stats.wishlist,   label: 'Wishlist'  },
          { cls: 'dropped',   n: stats.dropped,    label: 'Dropped'   },
        ].map((s) => (
          <div key={s.cls} className={`stat-card ${s.cls}`} onClick={() => navigate('/library')} style={{ cursor: 'pointer' }}>
            <div className="stat-number">{s.n}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Currently reading */}
      {reading.length > 0 && (
        <div className="section-block">
          <div className="section-header">
            <div className="section-title">Currently Reading</div>
            <button className="see-all" onClick={() => navigate('/library')}>
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="horizontal-scroll">
            {reading.map((e) => (
              <ManhwaCard key={e._id} entry={e} onClick={(entry) => openModal('detail', entry)} />
            ))}
          </div>
        </div>
      )}

      {/* Recently updated */}
      {recent.length > 0 && (
        <div className="section-block">
          <div className="section-header">
            <div className="section-title">Recently Updated</div>
          </div>
          <div className="manhwa-grid">
            {recent.map((e) => (
              <ManhwaCard key={e._id} entry={e} onClick={(entry) => openModal('detail', entry)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.total === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <BookOpen size={48} className="empty-state-icon" />
          <p className="empty-state-text">No manhwa yet!</p>
          <button className="btn btn-primary btn-md" style={{ marginTop: 16 }} onClick={() => navigate('/discover')}>
            Browse Discover
          </button>
        </div>
      )}

      {/* Export / Import toolbar */}
      {stats.total > 0 && (
        <div style={{
          marginTop: 40, padding: '14px 18px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            💾 Your data is saved in this browser.
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={exportLibrary} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={13} /> Export
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={13} /> Import
            </button>
            <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>
        </div>
      )}
    </>
  )
}
