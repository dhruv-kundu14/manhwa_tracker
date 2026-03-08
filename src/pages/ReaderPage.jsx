import React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAllChapters, getChapterPages } from '../lib/mangadex.js'
import { useLibraryStore } from '../store/libraryStore.js'
import Spinner from '../components/ui/Spinner.jsx'
import {
  ChevronLeft, ChevronRight, BookOpen, List, X,
  ZoomIn, ZoomOut, RotateCcw, AlignJustify, Layers,
  ArrowLeft, ChevronDown, ChevronUp, Check
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── READING PROGRESS localStorage ───────────────────────────────────────────
const PROGRESS_KEY = 'manhwa_reading_progress'
function loadProgress(mangaId) {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')[mangaId] ?? {} }
  catch { return {} }
}
function saveProgress(mangaId, data) {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...all, [mangaId]: { ...all[mangaId], ...data } }))
  } catch {}
}

// ─── READER PAGE ──────────────────────────────────────────────────────────────
export default function ReaderPage() {
  const { mangaId }   = useParams()
  const location      = useLocation()
  const navigate      = useNavigate()
  const entry         = location.state?.entry ?? null
  const manhwa        = entry?.manhwa ?? {}
  const entries       = useLibraryStore((s) => s.entries)
  const updateEntry   = useLibraryStore((s) => s.updateEntry)

  // find the library entry to update chapter progress
  const libEntry = entries.find((e) =>
    e.manhwa?.mangadexId === mangaId || e.manhwa?.id === mangaId || e._id === entry?._id
  )

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedChapterId, setSelectedChapterId] = useState(null)
  const [mode,    setMode]    = useState('longstrip')  // 'longstrip' | 'paged'
  const [zoom,    setZoom]    = useState(100)          // percentage
  const [page,    setPage]    = useState(0)            // paged mode index
  const [showSidebar, setShowSidebar] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const containerRef = useRef()
  const hideTimer    = useRef()

  // ── Restore last-read progress ─────────────────────────────────────────────
  useEffect(() => {
    const prog = loadProgress(mangaId)
    if (prog.chapterId) setSelectedChapterId(prog.chapterId)
  }, [mangaId])

  // ── Fetch chapter list ─────────────────────────────────────────────────────
  const { data: chapters = [], isLoading: loadingChapters } = useQuery({
    queryKey: ['chapters', mangaId],
    queryFn:  () => getAllChapters(mangaId),
    staleTime: 1000 * 60 * 30,
  })

  // Auto-select first chapter or last-read
  useEffect(() => {
    if (!chapters.length || selectedChapterId) return
    const prog = loadProgress(mangaId)
    if (prog.chapterId && chapters.find((c) => c.id === prog.chapterId)) {
      setSelectedChapterId(prog.chapterId)
    } else {
      // Start from current chapter in library
      const curCh = libEntry?.currentChapter ?? 0
      if (curCh > 0) {
        const match = chapters.find((c) => parseFloat(c.chapter) >= curCh)
        setSelectedChapterId(match?.id ?? chapters[0]?.id)
      } else {
        setSelectedChapterId(chapters[0]?.id)
      }
    }
  }, [chapters])

  // ── Fetch pages for selected chapter ──────────────────────────────────────
  const { data: pagesData, isLoading: loadingPages } = useQuery({
    queryKey: ['pages', selectedChapterId],
    queryFn:  () => getChapterPages(selectedChapterId),
    enabled:  !!selectedChapterId,
    staleTime: 1000 * 60 * 60,
  })
  const pages = pagesData?.pages ?? []

  // ── Current chapter object ─────────────────────────────────────────────────
  const currentChapterObj = chapters.find((c) => c.id === selectedChapterId)
  const currentChapterIdx = chapters.findIndex((c) => c.id === selectedChapterId)
  const hasPrev = currentChapterIdx > 0
  const hasNext = currentChapterIdx < chapters.length - 1

  // ── Reset page on chapter change ───────────────────────────────────────────
  useEffect(() => {
    setPage(0)
    containerRef.current?.scrollTo({ top: 0 })
    if (selectedChapterId) saveProgress(mangaId, { chapterId: selectedChapterId, page: 0 })
  }, [selectedChapterId])

  // ── Update library chapter when chapter changes ────────────────────────────
  useEffect(() => {
    if (!currentChapterObj || !libEntry) return
    const chNum = parseFloat(currentChapterObj.chapter)
    if (!isNaN(chNum) && chNum > (libEntry.currentChapter ?? 0)) {
      updateEntry(libEntry._id, {
        currentChapter: Math.floor(chNum),
        readingStatus: libEntry.readingStatus === 'WANT_TO_READ' ? 'READING' : libEntry.readingStatus,
      })
    }
  }, [currentChapterObj])

  // ── Auto-hide controls ─────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [])
  useEffect(() => { resetHideTimer(); return () => clearTimeout(hideTimer.current) }, [])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      switch (e.key) {
        case 'ArrowRight': case 'd':
          if (mode === 'paged') setPage((p) => Math.min(p + 1, pages.length - 1))
          else if (hasNext) goChapter(1)
          break
        case 'ArrowLeft': case 'a':
          if (mode === 'paged') setPage((p) => Math.max(p - 1, 0))
          else if (hasPrev) goChapter(-1)
          break
        case 'ArrowUp':    if (mode === 'longstrip') containerRef.current?.scrollBy({ top: -300, behavior: 'smooth' }); break
        case 'ArrowDown':  if (mode === 'longstrip') containerRef.current?.scrollBy({ top:  300, behavior: 'smooth' }); break
        case '+': case '=': setZoom((z) => Math.min(z + 10, 200)); break
        case '-':           setZoom((z) => Math.max(z - 10, 50));  break
        case '0':           setZoom(100); break
        case 'l': case 'L': setMode((m) => m === 'paged' ? 'longstrip' : 'paged'); break
        case 'Escape':      navigate(-1); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode, pages.length, hasPrev, hasNext, selectedChapterId])

  const goChapter = (dir) => {
    const next = chapters[currentChapterIdx + dir]
    if (next) {
      setSelectedChapterId(next.id)
      setPage(0)
    }
  }

  const zoomStyle = { maxWidth: `${zoom}%`, margin: '0 auto' }

  // ── Mark chapter completed ─────────────────────────────────────────────────
  const markCompleted = () => {
    if (!libEntry || !currentChapterObj) return
    const chNum = parseFloat(currentChapterObj.chapter)
    if (!isNaN(chNum)) {
      updateEntry(libEntry._id, { currentChapter: Math.floor(chNum) })
      toast.success(`Ch. ${currentChapterObj.chapter} marked as read!`)
    }
    if (hasNext) goChapter(1)
  }

  return (
    <div
      style={{ minHeight: '100vh', background: '#000', color: '#fff', position: 'relative' }}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
    >

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'linear-gradient(180deg,rgba(0,0,0,.95) 0%,transparent 100%)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'opacity .3s', opacity: showControls ? 1 : 0,
        pointerEvents: showControls ? 'auto' : 'none',
      }}>
        {/* Back */}
        <button onClick={() => navigate(-1)}
          style={iconBtnStyle}>
          <ArrowLeft size={18} />
        </button>

        {/* Title + chapter */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {manhwa.title || 'Reading'}
          </div>
          {currentChapterObj && (
            <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              Chapter {currentChapterObj.chapter}
              {currentChapterObj.title ? ` — ${currentChapterObj.title}` : ''}
              {loadingPages && <span style={{ marginLeft: 8, opacity: .6 }}>Loading…</span>}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Mode toggle */}
          <ToolBtn
            title={mode === 'longstrip' ? 'Switch to Paged' : 'Switch to Long-strip'}
            onClick={() => setMode((m) => m === 'paged' ? 'longstrip' : 'paged')}
            active={false}
          >
            {mode === 'longstrip' ? <Layers size={16} /> : <AlignJustify size={16} />}
          </ToolBtn>

          {/* Zoom out */}
          <ToolBtn title="Zoom Out (-)" onClick={() => setZoom((z) => Math.max(z - 10, 50))}>
            <ZoomOut size={16} />
          </ToolBtn>

          {/* Zoom level */}
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 40, textAlign: 'center', color: '#ccc' }}>
            {zoom}%
          </span>

          {/* Zoom in */}
          <ToolBtn title="Zoom In (+)" onClick={() => setZoom((z) => Math.min(z + 10, 200))}>
            <ZoomIn size={16} />
          </ToolBtn>

          {/* Reset zoom */}
          <ToolBtn title="Reset Zoom (0)" onClick={() => setZoom(100)}>
            <RotateCcw size={14} />
          </ToolBtn>

          {/* Chapter list */}
          <ToolBtn title="Chapter List" active={showSidebar} onClick={() => setShowSidebar((v) => !v)}>
            <List size={16} />
          </ToolBtn>
        </div>
      </div>

      {/* ── CHAPTER SIDEBAR ─────────────────────────────────────────── */}
      {showSidebar && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, zIndex: 200,
          background: '#111', borderLeft: '1px solid #222',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInRight .2s ease',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Chapters</span>
            <button onClick={() => setShowSidebar(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {loadingChapters ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {chapters.map((ch) => {
                const isCurrent = ch.id === selectedChapterId
                const isRead    = libEntry && parseFloat(ch.chapter) <= (libEntry.currentChapter ?? 0)
                return (
                  <button
                    key={ch.id}
                    onClick={() => { setSelectedChapterId(ch.id); setShowSidebar(false) }}
                    style={{
                      width: '100%', padding: '10px 16px', textAlign: 'left',
                      background: isCurrent ? 'rgba(233,69,96,.15)' : 'none',
                      border: 'none', borderLeft: `3px solid ${isCurrent ? 'var(--accent)' : 'transparent'}`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'background .1s',
                    }}
                  >
                    {isRead && !isCurrent
                      ? <Check size={13} color="#2dc653" style={{ flexShrink: 0 }} />
                      : <span style={{ width: 13, flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: isCurrent ? '#fff' : isRead ? '#666' : '#ccc', fontFamily: 'var(--font-mono)' }}>
                        Ch. {ch.chapter}
                        {ch.title && <span style={{ color: '#555', marginLeft: 6 }}>{ch.title}</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{ch.group}</div>
                    </div>
                    <span style={{ fontSize: 10, color: '#444', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{ch.pages}p</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      {loadingChapters ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
          <Spinner size={40} />
          <span style={{ color: '#666', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading chapters…</span>
        </div>
      ) : chapters.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, color: '#666' }}>
          <BookOpen size={48} />
          <p style={{ fontSize: 15 }}>No English chapters available on MangaDex.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, border: '1px solid #333', background: 'none', color: '#ccc', cursor: 'pointer' }}>
            Go Back
          </button>
        </div>
      ) : mode === 'longstrip' ? (
        // ── LONG STRIP MODE ──
        <LongstripMode
          pages={pages}
          loading={loadingPages}
          zoom={zoom}
          containerRef={containerRef}
        />
      ) : (
        // ── PAGED MODE ──
        <PagedMode
          pages={pages}
          loading={loadingPages}
          page={page}
          setPage={setPage}
          zoom={zoom}
          showControls={showControls}
        />
      )}

      {/* ── BOTTOM NAVIGATION BAR ───────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'linear-gradient(0deg,rgba(0,0,0,.95) 0%,transparent 100%)',
        padding: '16px 20px 20px',
        transition: 'opacity .3s', opacity: showControls ? 1 : 0,
        pointerEvents: showControls ? 'auto' : 'none',
      }}>
        {/* Progress bar */}
        {mode === 'paged' && pages.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', color: '#666', marginBottom: 4 }}>
              <span>Page {page + 1} of {pages.length}</span>
              <span>{Math.round(((page + 1) / pages.length) * 100)}%</span>
            </div>
            <div style={{ height: 3, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${((page + 1) / pages.length) * 100}%`, transition: 'width .3s' }} />
            </div>
          </div>
        )}

        {/* Chapter navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => goChapter(-1)} disabled={!hasPrev}
            style={navBtnStyle(!hasPrev)}
          >
            <ChevronLeft size={16} /> Prev Chapter
          </button>

          {/* Chapter selector dropdown */}
          <div style={{ flex: 1, position: 'relative' }}>
            <select
              value={selectedChapterId ?? ''}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              style={{
                width: '100%', background: '#1a1a1a', border: '1px solid #333',
                borderRadius: 8, padding: '8px 12px', color: '#fff',
                fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer', outline: 'none',
              }}
            >
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  Chapter {c.chapter}{c.title ? ` — ${c.title}` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={markCompleted}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #2dc65344', background: 'rgba(45,198,83,.1)', color: '#2dc653', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
          >
            <Check size={13} /> {hasNext ? 'Read & Next' : 'Mark Read'}
          </button>

          <button
            onClick={() => goChapter(1)} disabled={!hasNext}
            style={navBtnStyle(!hasNext)}
          >
            Next Chapter <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Keyboard shortcut hint — fades after 5s */}
      <KeyboardHint mode={mode} />

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeOut {
          0%   { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        :root {
          --accent:  #e94560;
          --font-display: 'Bebas Neue', sans-serif;
          --font-mono:    'JetBrains Mono', monospace;
        }
      `}</style>
    </div>
  )
}

// ─── LONG STRIP MODE ──────────────────────────────────────────────────────────
function LongstripMode({ pages, loading, zoom, containerRef }) {
  const [loaded, setLoaded] = useState({})
  const mark = (i) => setLoaded((p) => ({ ...p, [i]: true }))

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spinner size={36} />
    </div>
  )

  return (
    <div
      ref={containerRef}
      style={{ paddingTop: 60, paddingBottom: 100, overflowY: 'auto', height: '100vh' }}
    >
      <div style={{ maxWidth: `${zoom}%`, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {pages.map((p, i) => (
          <div key={i} style={{ position: 'relative', background: '#111', minHeight: 200 }}>
            {!loaded[i] && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size={24} color="#333" />
              </div>
            )}
            <img
              src={p.compressed}
              alt={`Page ${i + 1}`}
              onLoad={() => mark(i)}
              onError={(e) => { e.target.src = p.original; mark(i) }}
              style={{ width: '100%', display: loaded[i] ? 'block' : 'none', userSelect: 'none' }}
              draggable={false}
            />
          </div>
        ))}
        {pages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>No pages available</div>
        )}
      </div>
    </div>
  )
}

// ─── PAGED MODE ───────────────────────────────────────────────────────────────
function PagedMode({ pages, loading, page, setPage, zoom, showControls }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const currentPage = pages[page]

  useEffect(() => setImgLoaded(false), [page])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spinner size={36} />
    </div>
  )
  if (!currentPage) return null

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingBottom: 80, position: 'relative' }}>

      {/* Click zones: left = prev, right = next */}
      <div
        onClick={() => setPage((p) => Math.max(p - 1, 0))}
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'w-resize', zIndex: 10 }}
      />
      <div
        onClick={() => setPage((p) => Math.min(p + 1, pages.length - 1))}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', cursor: 'e-resize', zIndex: 10 }}
      />

      {/* Page image */}
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...( { maxWidth: `${zoom}%`, width: '100%' }) }}>
        {!imgLoaded && <div style={{ position: 'absolute' }}><Spinner size={36} /></div>}
        <img
          src={currentPage.compressed}
          alt={`Page ${page + 1}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { e.target.src = currentPage.original }}
          style={{
            maxHeight: '100%', maxWidth: '100%',
            objectFit: 'contain', userSelect: 'none',
            display: imgLoaded ? 'block' : 'none',
          }}
          draggable={false}
        />
      </div>

      {/* Side arrows — visible on hover */}
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 0))}
        disabled={page === 0}
        style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          zIndex: 20, ...arrowBtnStyle(page === 0),
          opacity: showControls ? 1 : 0, transition: 'opacity .3s',
        }}
      >
        <ChevronLeft size={22} />
      </button>

      <button
        onClick={() => setPage((p) => Math.min(p + 1, pages.length - 1))}
        disabled={page === pages.length - 1}
        style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          zIndex: 20, ...arrowBtnStyle(page === pages.length - 1),
          opacity: showControls ? 1 : 0, transition: 'opacity .3s',
        }}
      >
        <ChevronRight size={22} />
      </button>

      {/* Page indicator */}
      <div style={{
        position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,.7)', padding: '4px 14px', borderRadius: 20,
        fontSize: 12, fontFamily: 'var(--font-mono)', color: '#ccc',
        opacity: showControls ? 1 : 0, transition: 'opacity .3s',
        zIndex: 20,
      }}>
        {page + 1} / {pages.length}
      </div>
    </div>
  )
}

// ─── KEYBOARD HINT ────────────────────────────────────────────────────────────
function KeyboardHint({ mode }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => { const t = setTimeout(() => setVisible(false), 5000); return () => clearTimeout(t) }, [])
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,.8)', border: '1px solid #333',
      borderRadius: 8, padding: '8px 16px', fontSize: 11,
      fontFamily: 'var(--font-mono)', color: '#888', zIndex: 50,
      animation: 'fadeOut 5s forwards', pointerEvents: 'none',
      display: 'flex', gap: 16, whiteSpace: 'nowrap',
    }}>
      {mode === 'paged'
        ? <><KKey>←→</KKey> pages &nbsp; <KKey>L</KKey> long-strip &nbsp; <KKey>+/-</KKey> zoom &nbsp; <KKey>Esc</KKey> back</>
        : <><KKey>↑↓</KKey> scroll &nbsp; <KKey>L</KKey> paged mode &nbsp; <KKey>+/-</KKey> zoom &nbsp; <KKey>Esc</KKey> back</>
      }
    </div>
  )
}
function KKey({ children }) {
  return <span style={{ background: '#222', border: '1px solid #444', borderRadius: 4, padding: '1px 6px', color: '#bbb' }}>{children}</span>
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
function ToolBtn({ children, onClick, title, active }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 34, height: 34, borderRadius: 8,
        border: `1px solid ${active ? '#e94560' : '#333'}`,
        background: active ? 'rgba(233,69,96,.15)' : 'rgba(0,0,0,.5)',
        color: active ? '#e94560' : '#bbb',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  )
}

const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 8,
  border: '1px solid #333', background: 'rgba(0,0,0,.6)',
  color: '#bbb', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
}

const navBtnStyle = (disabled) => ({
  padding: '8px 14px', borderRadius: 8,
  border: '1px solid #333', background: 'rgba(0,0,0,.5)',
  color: disabled ? '#444' : '#ccc', cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 13, fontFamily: 'var(--font-mono)',
  display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
  transition: 'all .15s',
})

const arrowBtnStyle = (disabled) => ({
  width: 44, height: 44, borderRadius: '50%',
  border: '1px solid #333', background: 'rgba(0,0,0,.7)',
  color: disabled ? '#333' : '#ccc', cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
})
