import React, { useState, useEffect, useRef } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { browseMedia, searchMedia, GENRES, TYPES, STATUSES } from '../lib/anilist.js'
import { useLibraryStore } from '../store/libraryStore.js'
import { SOURCES, openTitlePage, openSearchPage } from '../lib/readOnline.js'
import Spinner from '../components/ui/Spinner.jsx'
import {
  Search, Plus, BookOpen, X, SlidersHorizontal,
  ChevronLeft, ChevronRight, ExternalLink, Check, Star,
  Heart, Eye, Clock, Ban,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  ongoing: '#00b4d8',
  completed: '#2dc653',
  cancelled: '#e94560',
  hiatus: '#f5a623',
  upcoming: '#a855f7',
}

const ALPHA = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

const READING_OPTIONS = [
  { status: 'READING', label: 'Reading', icon: '📖', sub: 'Currently reading this', color: '#00b4d8' },
  { status: 'WANT_TO_READ', label: 'Wishlist', icon: '🔖', sub: 'Want to read later', color: '#f5a623' },
  { status: 'COMPLETED', label: 'Completed', icon: '✅', sub: 'Finished reading', color: '#2dc653' },
  { status: 'DROPPED', label: 'Dropped', icon: '🗑️', sub: 'Not reading anymore', color: '#e94560' },
]

// ─── Add to Library Sheet ──────────────────────────────────────────────────────
function AddSheet({ comic, onClose, onAdd, currentStatus }) {
  const sheetRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  let hue = 0
  for (let i = 0; i < comic.title.length; i++) hue = (hue * 31 + comic.title.charCodeAt(i)) % 360
  const coverBg = comic.coverUrl
    ? `url(${comic.coverUrl}) center/cover no-repeat`
    : `linear-gradient(135deg,hsl(${hue},38%,12%),hsl(${(hue + 50) % 360},50%,20%))`

  return (
    <>
      <div className="add-sheet-overlay" onClick={onClose} />
      <div className="add-sheet" ref={sheetRef}>
        <div className="add-sheet-handle" />

        {/* Cover strip */}
        <div className="add-sheet-cover" style={{ background: coverBg, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.7),transparent)', borderRadius: 10 }} />
        </div>

        <div className="add-sheet-title">{comic.title}</div>
        <div className="add-sheet-meta">
          {comic.author !== 'Unknown' && `${comic.author} · `}
          {comic.status} · {comic.genres.slice(0, 2).join(', ')}
          {comic.rating && ` · ⭐ ${comic.rating}`}
        </div>

        <div className="add-sheet-options">
          {READING_OPTIONS.map((opt) => {
            const isActive = currentStatus === opt.status
            return (
              <button
                key={opt.status}
                className={`add-sheet-btn ${isActive ? 'active' : ''}`}
                onClick={() => onAdd(opt.status)}
              >
                <div className="add-sheet-btn-icon" style={{ background: `${opt.color}18`, border: `1px solid ${opt.color}33` }}>
                  {isActive ? '✓' : opt.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="add-sheet-btn-label" style={{ color: isActive ? opt.color : 'var(--text)' }}>
                    {isActive ? `Currently: ${opt.label}` : opt.label}
                  </div>
                  <div className="add-sheet-btn-sub">{opt.sub}</div>
                </div>
                {isActive && <Check size={16} color={opt.color} />}
              </button>
            )
          })}

          <div className="add-sheet-divider" />

          {/* External read links */}
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6, paddingLeft: 2 }}>
            READ ON EXTERNAL SITE
          </div>
          {SOURCES.map((source) => (
            <button
              key={source.id}
              className="add-sheet-btn"
              onClick={() => { openTitlePage(source.id, { title: comic.title }); onClose() }}
            >
              <div className="add-sheet-btn-icon" style={{ background: `${source.color}18`, border: `1px solid ${source.color}33`, fontSize: 20 }}>
                {source.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div className="add-sheet-btn-label">Read on {source.name}</div>
                <div className="add-sheet-btn-sub">{source.note} · Opens new tab</div>
              </div>
              <ExternalLink size={14} color={source.color} />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const addEntry = useLibraryStore((s) => s.addEntry)
  const updateEntry = useLibraryStore((s) => s.updateEntry)
  const entries = useLibraryStore((s) => s.entries)

  const [mode, setMode] = useState('browse')
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('MANHWA')
  const [selGenre, setSelGenre] = useState('')
  const [status, setStatus] = useState('')
  const [alpha, setAlpha] = useState('')
  const [page, setPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sheetComic, setSheetComic] = useState(null)   // comic shown in add sheet

  useEffect(() => { setPage(1) }, [type, selGenre, status, alpha])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!sidebarOpen) return
    const close = () => setSidebarOpen(false)
    document.addEventListener('keydown', (e) => e.key === 'Escape' && close())
  }, [sidebarOpen])

  const { data: browseData, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['anilist-browse', type, selGenre, status, alpha, page],
    queryFn: () => browseMedia({ type, status, genre: selGenre, alpha, page }),
    enabled: mode === 'browse',
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    retry: 2,
  })

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['anilist-search', query, type],
    queryFn: () => searchMedia({ query, type }),
    enabled: mode === 'search' && !!query,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const browseResults = browseData?.results ?? []
  const searchResults = searchData?.results ?? []
  const hasMore = browseData?.hasMore ?? false

  const handleSearch = () => {
    if (!input.trim()) return
    setQuery(input.trim())
    setMode('search')
  }

  const handleClear = () => {
    setInput('')
    setQuery('')
    setMode('browse')
  }

  const getEntryForComic = (comic) =>
    entries.find((e) =>
      e.manhwa?.title?.toLowerCase() === comic.title?.toLowerCase() ||
      e.manhwa?.mangadexId === comic.id
    )

  const handleAdd = (comic, readingStatus) => {
    const existing = getEntryForComic(comic)
    if (existing) {
      updateEntry(existing._id, { readingStatus })
      toast.success(`Moved to ${readingStatus.replace(/_/g, ' ').toLowerCase()}!`)
    } else {
      const result = addEntry({
        id: comic.id,
        title: comic.title,
        coverUrl: comic.coverUrl,
        author: comic.author,
        genres: comic.genres,
        status: comic.status,
        description: comic.description,
        mangadexId: comic.id,
        totalChapters: comic.chapters,
      }, readingStatus)
      if (result.ok) toast.success(`"${comic.title}" added as ${readingStatus.replace(/_/g, ' ').toLowerCase()}!`)
      else toast.error(result.message ?? 'Error adding')
    }
    setSheetComic(null)
  }

  const displayResults = mode === 'search' ? searchResults : browseResults
  const loading = mode === 'search' ? searchLoading : isLoading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {/* Mobile filter toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="btn btn-ghost btn-md"
          style={{ flexShrink: 0, display: 'none' }}
          id="filter-toggle"
        >
          <SlidersHorizontal size={16} />
        </button>

        <div className="discover-search" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={16} color="var(--muted)" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search manga, manhwa, manhua…"
          />
          {input && (
            <button onClick={handleClear} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button onClick={handleSearch} className="btn btn-primary btn-md" style={{ flexShrink: 0 }}>
          Search
        </button>
        {/* Mobile filter button shown via CSS */}
        <style>{`@media(max-width:768px){#filter-toggle{display:flex!important}}`}</style>
      </div>

      {/* Search mode back bar */}
      {mode === 'search' && (
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            Results for <strong style={{ color: 'var(--text)' }}>"{query}"</strong>
          </div>
          <button onClick={handleClear} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
            ← Browse
          </button>
          {isFetching && <Spinner size={13} />}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BROWSE MODE — sidebar + grid
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: 20 }}>

        {/* ── Single sidebar — desktop: always visible inline, mobile: overlay ── */}
        <>
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 299, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(3px)' }}
            />
          )}

          <div className="discover-filter-sidebar" data-open={sidebarOpen}>
            {/* Close btn — mobile only */}
            <div className="discover-filter-header">
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Filters</span>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>

            <SidebarSection label="Type">
              {TYPES.map((t) => (
                <SidebarBtn key={t.id} label={t.label} active={type === t.id}
                  onClick={() => { setType(t.id); setSidebarOpen(false) }} />
              ))}
            </SidebarSection>

            <div style={{ marginTop: 14 }}>
              <SidebarSection label="Status">
                {STATUSES.map((s) => (
                  <SidebarBtn key={s.id} label={s.label} active={status === s.id}
                    onClick={() => { setStatus(s.id); setSidebarOpen(false) }} />
                ))}
              </SidebarSection>
            </div>

            <div style={{ marginTop: 14 }}>
              <SidebarSection label="Genre">
                <SidebarBtn label="All Genres" active={selGenre === ''}
                  onClick={() => { setSelGenre(''); setSidebarOpen(false) }} />
                {GENRES.map((g) => (
                  <SidebarBtn key={g} label={g} active={selGenre === g}
                    onClick={() => { setSelGenre(selGenre === g ? '' : g); setSidebarOpen(false) }} />
                ))}
              </SidebarSection>
            </div>
          </div>
        </>

        {/* ── Main area ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* A-Z strip — only in browse mode */}
          {mode === 'browse' && (
            <div className="discover-alpha" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
              <AlphaBtn label="ALL" active={alpha === ''} onClick={() => setAlpha('')} wide />
              {ALPHA.map((l) => (
                <AlphaBtn key={l} label={l} active={alpha === l} onClick={() => setAlpha(alpha === l ? '' : l)} />
              ))}
            </div>
          )}

          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              {mode === 'browse' && !loading && (
                selGenre ? `Genre: ${selGenre}` : alpha ? `"${alpha}…"` : `Popular ${TYPES.find(t => t.id === type)?.label ?? ''}`
              )}
              {mode === 'browse' && ` · Page ${page}`}
            </div>
            {isFetching && !loading && <Spinner size={13} />}
          </div>

          {/* Grid */}
          {loading ? <LoadingSkeleton /> : isError && mode === 'browse' ? (
            <div className="empty-state">
              <p className="empty-state-text" style={{ color: 'var(--accent)' }}>Failed to load. {error?.message}</p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : displayResults.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={40} className="empty-state-icon" />
              <p className="empty-state-text">{mode === 'search' ? `No results for "${query}"` : 'No titles found.'}</p>
            </div>
          ) : (
            <>
              <div className="manhwa-grid" style={{ opacity: isFetching ? 0.65 : 1, transition: 'opacity .2s' }}>
                {displayResults.map((comic) => {
                  const entry = getEntryForComic(comic)
                  return (
                    <MediaCard
                      key={comic.id}
                      comic={comic}
                      entry={entry}
                      onOpen={() => setSheetComic(comic)}
                    />
                  )
                })}
              </div>

              {/* Pagination — browse only */}
              {mode === 'browse' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 28 }}>
                  <button className="btn btn-ghost btn-sm" disabled={page === 1 || isFetching}
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0) }}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span style={{
                    fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--muted)',
                    padding: '6px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)',
                  }}>Page {page}</span>
                  <button className="btn btn-ghost btn-sm" disabled={!hasMore || isFetching}
                    onClick={() => { setPage((p) => p + 1); window.scrollTo(0, 0) }}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Add to Library Sheet ─────────────────────────────────────────── */}
      {sheetComic && (
        <AddSheet
          comic={sheetComic}
          onClose={() => setSheetComic(null)}
          onAdd={(status) => handleAdd(sheetComic, status)}
          currentStatus={getEntryForComic(sheetComic)?.readingStatus ?? null}
        />
      )}
    </div>
  )
}

// ─── Card ──────────────────────────────────────────────────────────────────────
function MediaCard({ comic, entry, onOpen }) {
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(false)

  let hue = 0
  for (let i = 0; i < comic.title.length; i++) hue = (hue * 31 + comic.title.charCodeAt(i)) % 360
  const fallbackBg = `linear-gradient(150deg,hsl(${hue},35%,10%),hsl(${(hue + 50) % 360},50%,18%))`
  const statusColor = STATUS_COLOR[comic.status] ?? '#666'
  const inLibrary = !!entry

  const statusOpt = READING_OPTIONS.find(o => o.status === entry?.readingStatus)

  return (
    <div
      className="manhwa-card"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="manhwa-cover" style={{ padding: 0, position: 'relative', overflow: 'hidden', background: fallbackBg, cursor: 'pointer' }}>

        {comic.coverUrl && !imgError ? (
          <img src={comic.coverUrl} alt={comic.title} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>{comic.title}</span>
          </div>
        )}

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.88) 0%,rgba(0,0,0,.05) 55%,transparent 100%)' }} />

        {/* Status badge */}
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4,
            background: 'rgba(0,0,0,.65)', color: statusColor, border: `1px solid ${statusColor}44`
          }}>
            {comic.status}
          </span>
        </div>

        {/* Rating */}
        {comic.rating && (
          <div style={{
            position: 'absolute', top: 8, left: 8, zIndex: 2, display: 'flex', alignItems: 'center', gap: 3,
            background: 'rgba(0,0,0,.65)', padding: '2px 6px', borderRadius: 4
          }}>
            <Star size={9} fill="#f5a623" color="#f5a623" />
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#f5a623' }}>{comic.rating}</span>
          </div>
        )}

        {/* Library badge */}
        {inLibrary && (
          <div style={{ position: 'absolute', bottom: 36, left: 8, zIndex: 2 }}>
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4,
              background: `${statusOpt?.color ?? '#2dc653'}22`, color: statusOpt?.color ?? '#2dc653',
              border: `1px solid ${statusOpt?.color ?? '#2dc653'}44`
            }}>
              {statusOpt?.icon} {statusOpt?.label ?? 'In Library'}
            </span>
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px', zIndex: 2,
          fontFamily: 'var(--font-display)', fontSize: 13, lineHeight: 1.2, color: '#fff'
        }}>
          {comic.title}
        </div>

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3, background: 'rgba(0,0,0,.72)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          opacity: hovered ? 1 : 0, transition: 'opacity .2s',
        }}>
          <Plus size={22} color="#fff" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fff', letterSpacing: '.5px' }}>
            {inLibrary ? 'CHANGE STATUS' : 'ADD TO LIBRARY'}
          </span>
        </div>
      </div>

      <div className="manhwa-info">
        {comic.author && comic.author !== 'Unknown' && (
          <div style={{
            fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {comic.author}
          </div>
        )}
        <div className="genre-tags">
          {comic.genres.slice(0, 2).map((g) => <span key={g} className="genre-tag">{g}</span>)}
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar helpers ──────────────────────────────────────────────────────────
function SidebarSection({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6
      }}>{label}</div>
      {children}
    </div>
  )
}

function SidebarBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '6px 10px', marginBottom: 2, borderRadius: 6,
      fontSize: 12, cursor: 'pointer', transition: 'all .12s',
      border: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
      background: active ? 'rgba(233,69,96,.1)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--muted)',
      fontFamily: 'var(--font-mono)',
    }}>{label}</button>
  )
}

function AlphaBtn({ label, active, onClick, wide }) {
  return (
    <button onClick={onClick} style={{
      width: wide ? 'auto' : 30, height: 28,
      padding: wide ? '0 10px' : 0,
      borderRadius: 5, fontSize: 11,
      fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'rgba(233,69,96,.12)' : 'var(--surface)',
      color: active ? 'var(--accent)' : 'var(--muted)',
      transition: 'all .12s',
    }}>{label}</button>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="manhwa-grid">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="manhwa-card" style={{ pointerEvents: 'none' }}>
          <div style={{ height: 195, background: 'var(--surface2)', animation: 'pulse 1.4s ease infinite', animationDelay: `${i * 0.04}s` }} />
          <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 10, borderRadius: 4, background: 'var(--surface2)', width: '70%', animation: 'pulse 1.4s ease infinite' }} />
            <div style={{ height: 10, borderRadius: 4, background: 'var(--surface2)', width: '45%', animation: 'pulse 1.4s ease infinite' }} />
          </div>
        </div>
      ))}
    </div>
  )
}