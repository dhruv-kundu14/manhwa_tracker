import React from 'react'
import { useAuthStore } from '../store/authStore.js'
import { useLibraryStore } from '../store/libraryStore.js'
import Avatar from '../components/ui/Avatar.jsx'
import { BookOpen, CheckCircle, Bookmark, XCircle, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const user          = useAuthStore((s) => s.user)
  const navigate      = useNavigate()
  const entries       = useLibraryStore((s) => s.entries)
  const exportLibrary = useLibraryStore((s) => s.exportLibrary)

  const reading   = entries.filter((e) => e.readingStatus === 'READING').length
  const completed = entries.filter((e) => e.readingStatus === 'COMPLETED').length
  const wishlist  = entries.filter((e) => e.readingStatus === 'WANT_TO_READ').length
  const dropped   = entries.filter((e) => e.readingStatus === 'DROPPED').length

  const rated     = entries.filter((e) => e.rating)
  const avgRating = rated.length
    ? (rated.reduce((s, e) => s + Number(e.rating), 0) / rated.length).toFixed(1)
    : '—'

  const topGenres = (() => {
    const map = {}
    entries.forEach((e) =>
      (e.manhwa?.genres ?? []).forEach((g) => { map[g] = (map[g] ?? 0) + 1 })
    )
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  })()

  return (
    <>
      {/* Hero */}
      <div className="profile-hero">
        <Avatar username={user?.username} size="xl" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 4 }}>
            {user?.username}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            {user?.bio || 'No bio yet — edit in Settings.'}
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <StatChip icon={<BookOpen   size={14} color="var(--accent2)" />} n={reading}   label="Reading"   color="var(--accent2)" />
            <StatChip icon={<CheckCircle size={14} color="var(--green)"  />} n={completed} label="Completed" color="var(--green)"   />
            <StatChip icon={<Bookmark   size={14} color="var(--accent3)" />} n={wishlist}  label="Wishlist"  color="var(--accent3)" />
            <StatChip icon={<XCircle    size={14} color="var(--accent)"  />} n={dropped}   label="Dropped"   color="var(--accent)"  />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => navigate('/settings')}
            style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '7px 14px', cursor: 'pointer' }}>
            Edit Profile
          </button>
          <button onClick={exportLibrary}
            style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      <div className="two-col">
        {/* Overview */}
        <div>
          <div className="section-block">
            <div className="section-header"><div className="section-title">Overview</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total in Library', value: entries.length },
                { label: 'Avg Rating Given', value: avgRating },
                { label: 'Total Rated',      value: rated.length },
              ].map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>{r.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top genres */}
        {topGenres.length > 0 && (
          <div>
            <div className="section-block">
              <div className="section-header"><div className="section-title">Top Genres</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topGenres.map(([genre, count], i) => (
                  <div key={genre} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', width: 18 }}>#{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13 }}>{genre}</span>
                    <div style={{ width: 80, height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(count / (topGenres[0]?.[1] ?? 1)) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', width: 20, textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function StatChip({ icon, n, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon}
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color }}>{n}</span>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}
