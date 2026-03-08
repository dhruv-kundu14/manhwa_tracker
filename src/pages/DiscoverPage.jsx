import React, { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { browseMedia, searchMedia, GENRES, TYPES, STATUSES } from '../lib/anilist.js'
import { useLibraryStore } from '../store/libraryStore.js'
import { SOURCES, openTitlePage, openSearchPage } from '../lib/readOnline.js'
import Spinner from '../components/ui/Spinner.jsx'
import {
  Search, Plus, BookOpen, X,
  ChevronLeft, ChevronRight, ExternalLink, Check, Star,
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

export default function DiscoverPage() {
  const addEntry = useLibraryStore((s) => s.addEntry)
  const entries = useLibraryStore((s) => s.entries)

  const [mode, setMode] = useState('browse')
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('MANHWA')
  const [selGenre, setSelGenre] = useState('')
  const [status, setStatus] = useState('')
  const [alpha, setAlpha] = useState('')
  const [page, setPage] = useState(1)
  const [readSource, setReadSource] = useState('manhwaclan')

  useEffect(() => { setPage(1) }, [type, selGenre, status, alpha])

  // ── Browse query ────────────────────────────────────────────────────────────
  const { data: browseData, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['anilist-browse', type, selGenre, status, alpha, page],
    queryFn: () => browseMedia({ type, status, genre: selGenre, alpha, page }),
    enabled: mode === 'browse',
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    retry: 2,
  })

  // ── Search query ────────────────────────────────────────────────────────────
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

  const handleAdd = (comic) => {
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
    }, 'WANT_TO_READ')
    if (result.ok) toast.success(`"${comic.title}" added to library!`)
    else toast.error(result.message ?? 'Already in library')
  }

  const isInLibrary = (comic) =>
    entries.some((e) =>
      e.manhwa?.title?.toLowerCase() === comic.title?.toLowerCase() ||
      e.manhwa?.mangadexId === comic.id
    )

  const activeSource = SOURCES.find((s) => s.id === readSource)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Read source toggle ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '10px 14px', marginBottom: 14,
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
          Read on:
        </span>
        {SOURCES.map((s) => (
          <button key={s.id} onClick={() => setReadSource(s.id)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: `1px solid ${readSource === s.id ? s.color : 'var(--border)'}`,
            background: readSource === s.id ? `${s.color}18` : 'transparent',
            color: readSource === s.id ? s.color : 'var(--muted)',
            fontFamily: 'var(--font-mono)', fontWeight: 600, transition: 'all .15s',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {s.icon} {s.name}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#444', fontFamily: 'var(--font-mono)' }}>
          browse via AniList · reads on {activeSource?.name}
        </span>
      </div>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div className="discover-search" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={16} color="var(--muted)" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search title or keyword…"
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
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SEARCH MODE
      ══════════════════════════════════════════════════════════════════════ */}
      {mode === 'search' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Results for <strong style={{ color: 'var(--text)' }}>"{query}"</strong>
            </div>
            <button onClick={handleClear} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
              ← Back to Browse
            </button>
          </div>

          {/* External search cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {SOURCES.map((source) => (
              <a key={source.id} href={source.getSearchUrl({ title: query })} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all .15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = source.color + '66'; e.currentTarget.style.background = source.color + '0a' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 10, flexShrink: 0, fontSize: 22,
                    background: `${source.color}18`, border: `1px solid ${source.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{source.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                      Search "{query}" on {source.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      {source.note} · Opens in new tab
                    </div>
                  </div>
                  <ExternalLink size={16} color={source.color} style={{ opacity: 0.7 }} />
                </div>
              </a>
            ))}
          </div>

          {/* AniList search results */}
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
            📚 Related titles from AniList — add to library or click Read to open on {activeSource?.name}
          </div>
          {searchLoading ? <LoadingSkeleton /> : searchResults.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={36} className="empty-state-icon" />
              <p className="empty-state-text">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="manhwa-grid">
              {searchResults.map((comic) => (
                <MediaCard key={comic.id} comic={comic} readSource={readSource}
                  inLibrary={isInLibrary(comic)} onAdd={() => handleAdd(comic)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BROWSE MODE
      ══════════════════════════════════════════════════════════════════════ */}
      {mode === 'browse' && (
        <div style={{ display: 'flex', gap: 20 }}>

          {/* ── Sidebar ──────────────────────────────────────────────────────── */}
          <div style={{ width: 175, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            <SidebarSection label="Type">
              {TYPES.map((t) => (
                <SidebarBtn key={t.id} label={t.label} active={type === t.id} onClick={() => setType(t.id)} />
              ))}
            </SidebarSection>

            <SidebarSection label="Status">
              {STATUSES.map((s) => (
                <SidebarBtn key={s.id} label={s.label} active={status === s.id} onClick={() => setStatus(s.id)} />
              ))}
            </SidebarSection>

            <SidebarSection label="Genre">
              <SidebarBtn label="All Genres" active={selGenre === ''} onClick={() => setSelGenre('')} />
              {GENRES.map((g) => (
                <SidebarBtn key={g} label={g} active={selGenre === g} onClick={() => setSelGenre(selGenre === g ? '' : g)} />
              ))}
            </SidebarSection>
          </div>

          {/* ── Main area ────────────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* A-Z strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
              <AlphaBtn label="ALL" active={alpha === ''} onClick={() => setAlpha('')} wide />
              {ALPHA.map((l) => (
                <AlphaBtn key={l} label={l} active={alpha === l} onClick={() => setAlpha(alpha === l ? '' : l)} />
              ))}
            </div>

            {/* Label row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, minHeight: 22 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {!isLoading && (
                  selGenre ? `Genre: ${selGenre}` : alpha ? `Titles starting with "${alpha}"` : `Popular ${TYPES.find(t => t.id === type)?.label ?? ''}`
                )} · Page {page}
              </div>
              {isFetching && !isLoading && <Spinner size={14} />}
            </div>

            {/* Grid */}
            {isLoading ? <LoadingSkeleton /> : isError ? (
              <div className="empty-state">
                <p className="empty-state-text" style={{ color: 'var(--accent)' }}>Failed to load. {error?.message}</p>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : browseResults.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={40} className="empty-state-icon" />
                <p className="empty-state-text">No titles found. Try a different filter.</p>
              </div>
            ) : (
              <>
                <div className="manhwa-grid" style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
                  {browseResults.map((comic) => (
                    <MediaCard key={comic.id} comic={comic} readSource={readSource}
                      inLibrary={isInLibrary(comic)} onAdd={() => handleAdd(comic)} />
                  ))}
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 28 }}>
                  <button className="btn btn-ghost btn-sm" disabled={page === 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span style={{
                    fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--muted)',
                    padding: '6px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)',
                  }}>
                    Page {page}
                  </span>
                  <button className="btn btn-ghost btn-sm" disabled={!hasMore || isFetching}
                    onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Media Card ───────────────────────────────────────────────────────────────
function MediaCard({ comic, readSource, inLibrary, onAdd }) {
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(false)

  let hue = 0
  for (let i = 0; i < comic.title.length; i++) hue = (hue * 31 + comic.title.charCodeAt(i)) % 360
  const fallbackBg = `linear-gradient(150deg,hsl(${hue},35%,10%),hsl(${(hue + 50) % 360},50%,18%))`
  const statusColor = STATUS_COLOR[comic.status] ?? '#666'
  const source = SOURCES.find((s) => s.id === readSource)

  const handleOpen = () => openTitlePage(readSource, { title: comic.title })

  return (
    <div className="manhwa-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="manhwa-cover" onClick={handleOpen}
        style={{ padding: 0, position: 'relative', overflow: 'hidden', background: fallbackBg, cursor: 'pointer' }}>

        {comic.coverUrl && !imgError ? (
          <img src={comic.coverUrl} alt={comic.title} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>{comic.title}</span>
          </div>
        )}

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.88) 0%,rgba(0,0,0,.05) 55%,transparent 100%)' }} />

        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4,
            background: 'rgba(0,0,0,.65)', color: statusColor, border: `1px solid ${statusColor}44`
          }}>
            {comic.status}
          </span>
        </div>

        {comic.rating && (
          <div style={{
            position: 'absolute', top: 8, left: 8, zIndex: 2, display: 'flex', alignItems: 'center', gap: 3,
            background: 'rgba(0,0,0,.65)', padding: '2px 6px', borderRadius: 4
          }}>
            <Star size={9} fill="#f5a623" color="#f5a623" />
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#f5a623' }}>{comic.rating}</span>
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px', zIndex: 2,
          fontFamily: 'var(--font-display)', fontSize: 13, lineHeight: 1.2, color: '#fff'
        }}>
          {comic.title}
        </div>

        <div style={{
          position: 'absolute', inset: 0, zIndex: 3, background: 'rgba(0,0,0,.72)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          opacity: hovered ? 1 : 0, transition: 'opacity .2s',
        }}>
          <span style={{ fontSize: 22 }}>{source?.icon}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fff', letterSpacing: '.5px' }}>
            READ ON {source?.name?.toUpperCase()}
          </span>
          <ExternalLink size={13} color="#aaa" />
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
        <div className="genre-tags" style={{ marginBottom: 8 }}>
          {comic.genres.slice(0, 2).map((g) => <span key={g} className="genre-tag">{g}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); onAdd() }} disabled={inLibrary} style={{
            flex: 1, padding: '6px 0', borderRadius: 6,
            fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
            cursor: inLibrary ? 'default' : 'pointer',
            border: `1px solid ${inLibrary ? 'rgba(45,198,83,.3)' : 'rgba(233,69,96,.3)'}`,
            background: inLibrary ? 'rgba(45,198,83,.08)' : 'rgba(233,69,96,.08)',
            color: inLibrary ? 'var(--green)' : 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {inLibrary ? <><Check size={11} /> Saved</> : <><Plus size={11} /> Library</>}
          </button>
          <button onClick={handleOpen} style={{
            flex: 1, padding: '6px 0', borderRadius: 6,
            fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${source?.color}44`,
            background: `${source?.color}0e`, color: source?.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <ExternalLink size={11} /> Read
          </button>
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