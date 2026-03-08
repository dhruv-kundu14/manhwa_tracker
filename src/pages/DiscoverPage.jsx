import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { searchComics, getTrending, GENRES, TYPES, STATUSES, LIMIT_PER_PAGE } from '../lib/comick.js'
import { useLibraryStore } from '../store/libraryStore.js'
import { SOURCES, openTitlePage, openSearchPage } from '../lib/readOnline.js'
import Spinner from '../components/ui/Spinner.jsx'
import {
  Search, Plus, BookOpen, Filter, X,
  ChevronLeft, ChevronRight, ExternalLink, Check, Star,
  Tag, Grid, List
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  ongoing: '#00b4d8',
  completed: '#2dc653',
  cancelled: '#e94560',
  hiatus: '#f5a623',
}

const ALPHA = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

// ─── SEARCH: query ManhwaClan + MangaBuddy ────────────────────────────────────
function getExternalSearchResults(query) {
  if (!query.trim()) return []
  return SOURCES.map((source) => ({
    sourceId: source.id,
    sourceName: source.name,
    sourceIcon: source.icon,
    sourceColor: source.color,
    searchUrl: source.getSearchUrl({ title: query }),
  }))
}

export default function DiscoverPage() {
  const qc = useQueryClient()
  const addEntry = useLibraryStore((s) => s.addEntry)
  const entries = useLibraryStore((s) => s.entries)

  // Mode: 'browse' | 'search'
  const [mode, setMode] = useState('browse')
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')

  // Browse filters
  const [type, setType] = useState('manhwa')
  const [selGenre, setSelGenre] = useState('')   // single genre filter
  const [status, setStatus] = useState('')
  const [alpha, setAlpha] = useState('')   // letter filter
  const [page, setPage] = useState(1)
  const [readSource, setReadSource] = useState('manhwaclan')

  useEffect(() => { setPage(1) }, [type, selGenre, status, alpha])

  // Build comick params for browse
  const browseParams = {
    query: alpha ? alpha : '',   // use alpha as query to get alphabetical
    type,
    status,
    genres: selGenre ? [selGenre] : [],
    page,
  }

  const queryKey = ['comick-browse', type, selGenre, status, alpha, page]

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn: () => {
      // For alphabetical: use sort=title with first letter
      const params = {
        type,
        status,
        genres: selGenre ? [selGenre] : [],
        page,
        query: alpha === '#' ? '' : alpha,
      }
      return searchComics(params)
    },
    enabled: mode === 'browse',
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    retry: 2,
  })

  const results = data?.results ?? []
  const hasMore = data?.hasMore ?? false

  // Sort results alphabetically client-side
  const sortedResults = [...results].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  )

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
      id: String(comic.id),
      title: comic.title,
      coverUrl: comic.coverUrl,
      author: comic.author,
      genres: comic.genres,
      status: comic.status,
      description: comic.description,
      mangadexId: comic.hid,
    }, 'WANT_TO_READ')
    if (result.ok) toast.success(`"${comic.title}" added to library!`)
    else toast.error(result.message ?? 'Already in library')
  }

  const isInLibrary = (comic) =>
    entries.some((e) =>
      e.manhwa?.title?.toLowerCase() === comic.title?.toLowerCase() ||
      e.manhwa?.mangadexId === comic.hid
    )

  const activeSource = SOURCES.find((s) => s.id === readSource)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Read source toggle ──────────────────────────────────────── */}
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
          browse via comick.io · reads on {activeSource?.name}
        </span>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div className="discover-search" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={16} color="var(--muted)" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search title or keyword → opens on ManhwaClan / MangaBuddy…"
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

      {/* ══════════════════════════════════════════════════════════════
          SEARCH MODE — show external links to ManhwaClan + MangaBuddy
      ══════════════════════════════════════════════════════════════ */}
      {mode === 'search' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Search results for <strong style={{ color: 'var(--text)' }}>"{query}"</strong>
            </div>
            <button onClick={handleClear} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
              ← Back to Browse
            </button>
          </div>

          {/* External search cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {SOURCES.map((source) => (
              <a
                key={source.id}
                href={source.getSearchUrl({ title: query })}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px',
                  background: 'var(--surface)', border: `1px solid var(--border)`,
                  borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all .15s',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = source.color + '66'
                    e.currentTarget.style.background = source.color + '0a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'var(--surface)'
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                    background: `${source.color}18`, border: `1px solid ${source.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  }}>
                    {source.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                      Search "{query}" on {source.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      {source.note} · Opens in new tab
                    </div>
                  </div>
                  <ExternalLink size={18} color={source.color} style={{ opacity: 0.7 }} />
                </div>
              </a>
            ))}
          </div>

          {/* Also show comick results as browseable cards */}
          <div style={{
            padding: '10px 14px', marginBottom: 16,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
          }}>
            📚 Related titles from ComicK — click a card to open on <strong style={{ color: activeSource?.color }}>{activeSource?.name}</strong>
          </div>
          <ComickSearchResults query={query} readSource={readSource} entries={entries} onAdd={handleAdd} isInLibrary={isInLibrary} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BROWSE MODE — genres sidebar + alphabetical grid
      ══════════════════════════════════════════════════════════════ */}
      {mode === 'browse' && (
        <div style={{ display: 'flex', gap: 20 }}>

          {/* ── Left sidebar: genres + filters ─────────────────────── */}
          <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Type */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Type</div>
              {TYPES.map((t) => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '6px 10px', marginBottom: 3, borderRadius: 6,
                  fontSize: 12, cursor: 'pointer', transition: 'all .12s',
                  border: `1px solid ${type === t.id ? 'var(--accent)' : 'transparent'}`,
                  background: type === t.id ? 'rgba(233,69,96,.1)' : 'transparent',
                  color: type === t.id ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Status */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Status</div>
              {STATUSES.map((s) => (
                <button key={s.id} onClick={() => setStatus(s.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '6px 10px', marginBottom: 3, borderRadius: 6,
                  fontSize: 12, cursor: 'pointer', transition: 'all .12s',
                  border: `1px solid ${status === s.id ? 'var(--accent)' : 'transparent'}`,
                  background: status === s.id ? 'rgba(233,69,96,.1)' : 'transparent',
                  color: status === s.id ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Genres */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Genre</div>
              <button onClick={() => setSelGenre('')} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '6px 10px', marginBottom: 3, borderRadius: 6,
                fontSize: 12, cursor: 'pointer', transition: 'all .12s',
                border: `1px solid ${selGenre === '' ? 'var(--accent)' : 'transparent'}`,
                background: selGenre === '' ? 'rgba(233,69,96,.1)' : 'transparent',
                color: selGenre === '' ? 'var(--accent)' : 'var(--muted)',
                fontFamily: 'var(--font-mono)',
              }}>All Genres</button>
              {GENRES.map((g) => (
                <button key={g} onClick={() => setSelGenre(selGenre === g ? '' : g)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '6px 10px', marginBottom: 3, borderRadius: 6,
                  fontSize: 12, cursor: 'pointer', transition: 'all .12s',
                  border: `1px solid ${selGenre === g ? 'var(--accent)' : 'transparent'}`,
                  background: selGenre === g ? 'rgba(233,69,96,.1)' : 'transparent',
                  color: selGenre === g ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: A-Z strip + grid ─────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* A-Z alphabet strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
              <button onClick={() => setAlpha('')} style={{
                padding: '4px 8px', borderRadius: 5, fontSize: 11,
                fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${alpha === '' ? 'var(--accent)' : 'var(--border)'}`,
                background: alpha === '' ? 'rgba(233,69,96,.12)' : 'var(--surface)',
                color: alpha === '' ? 'var(--accent)' : 'var(--muted)',
              }}>ALL</button>
              {ALPHA.map((l) => (
                <button key={l} onClick={() => setAlpha(alpha === l ? '' : l)} style={{
                  width: 30, height: 28, borderRadius: 5, fontSize: 11,
                  fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${alpha === l ? 'var(--accent)' : 'var(--border)'}`,
                  background: alpha === l ? 'rgba(233,69,96,.12)' : 'var(--surface)',
                  color: alpha === l ? 'var(--accent)' : 'var(--muted)',
                  transition: 'all .12s',
                }}>{l}</button>
              ))}
            </div>

            {/* Results label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, minHeight: 22 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {!isLoading && (
                  selGenre ? `Genre: ${selGenre}` : alpha ? `Titles starting with "${alpha}"` : `Trending ${TYPES.find(t => t.id === type)?.label ?? ''}`
                )} — Page {page}
              </div>
              {isFetching && !isLoading && <Spinner size={14} />}
            </div>

            {/* Grid */}
            {isLoading ? <LoadingSkeleton /> : isError ? (
              <div className="empty-state">
                <p className="empty-state-text" style={{ color: 'var(--accent)' }}>Could not load titles.</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>{error?.message}</p>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => qc.invalidateQueries(['comick-browse'])}>Retry</button>
              </div>
            ) : sortedResults.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={40} className="empty-state-icon" />
                <p className="empty-state-text">No titles found. Try a different filter.</p>
              </div>
            ) : (
              <>
                <div className="manhwa-grid" style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
                  {sortedResults.map((comic) => (
                    <ComicKCard
                      key={comic.id ?? comic.hid}
                      comic={comic}
                      readSource={readSource}
                      inLibrary={isInLibrary(comic)}
                      onAdd={() => handleAdd(comic)}
                    />
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

// ─── ComicK search results shown below external links ─────────────────────────
function ComickSearchResults({ query, readSource, entries, onAdd, isInLibrary }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['comick-search', query],
    queryFn: () => searchComics({ query, page: 1 }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const results = data?.results ?? []

  if (isLoading) return <LoadingSkeleton />
  if (isError || results.length === 0) return null

  return (
    <div className="manhwa-grid">
      {results.map((comic) => (
        <ComicKCard
          key={comic.id ?? comic.hid}
          comic={comic}
          readSource={readSource}
          inLibrary={isInLibrary(comic)}
          onAdd={() => onAdd(comic)}
        />
      ))}
    </div>
  )
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function ComicKCard({ comic, readSource, inLibrary, onAdd }) {
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(false)

  let hue = 0
  for (let i = 0; i < comic.title.length; i++) hue = (hue * 31 + comic.title.charCodeAt(i)) % 360
  const fallbackBg = `linear-gradient(150deg,hsl(${hue},35%,10%),hsl(${(hue + 50) % 360},50%,18%))`
  const statusColor = STATUS_COLOR[comic.status] ?? '#666'
  const source = SOURCES.find((s) => s.id === readSource)

  const handleOpen = () => openTitlePage(readSource, { title: comic.title })
  const handleAdd = (e) => { e.stopPropagation(); onAdd() }

  return (
    <div className="manhwa-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="manhwa-cover" onClick={handleOpen}
        style={{ padding: 0, position: 'relative', overflow: 'hidden', background: fallbackBg, cursor: 'pointer' }}>

        {comic.coverUrl && !imgError ? (
          <img src={comic.coverUrl} alt={comic.title} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>{comic.title}</span>
          </div>
        )}

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.88) 0%,rgba(0,0,0,.05) 55%,transparent 100%)' }} />

        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4, background: 'rgba(0,0,0,.65)', color: statusColor, border: `1px solid ${statusColor}44` }}>
            {comic.status}
          </span>
        </div>

        {comic.rating && (
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,.65)', padding: '2px 6px', borderRadius: 4 }}>
            <Star size={9} fill="#f5a623" color="#f5a623" />
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#f5a623' }}>{comic.rating}</span>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px', zIndex: 2, fontFamily: 'var(--font-display)', fontSize: 13, lineHeight: 1.2, color: '#fff' }}>
          {comic.title}
        </div>

        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          background: 'rgba(0,0,0,.72)',
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
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {comic.author}
          </div>
        )}
        <div className="genre-tags" style={{ marginBottom: 8 }}>
          {comic.genres.slice(0, 2).map((g) => <span key={g} className="genre-tag">{g}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleAdd} disabled={inLibrary} style={{
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

// ─── SKELETON ─────────────────────────────────────────────────────────────────
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