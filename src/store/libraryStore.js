import { create } from 'zustand'

const STORAGE_KEY = 'manhwa_library'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { }
}

function makeId() {
  return `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export const useLibraryStore = create((set, get) => ({
  entries: load(),

  // ── Add ──────────────────────────────────────────────────────────────
  addEntry: (manhwaData, readingStatus = 'WANT_TO_READ') => {
    const existing = get().entries.find(
      (e) => String(e.manhwa.id) === String(manhwaData.id) || e.manhwa.title === manhwaData.title
    )
    if (existing) return { ok: false, message: 'Already in your library' }

    const entry = {
      _id: makeId(),
      readingStatus,
      currentChapter: 0,
      rating: null,
      notes: '',
      updatedAt: new Date().toISOString(),
      manhwa: {
        _id: manhwaData.id ?? makeId(),
        id: manhwaData.id ?? '',
        title: manhwaData.title,
        coverUrl: manhwaData.coverUrl ?? null,
        author: manhwaData.author ?? 'Unknown',
        genres: manhwaData.genres ?? [],
        status: manhwaData.status ?? 'ongoing',
        description: manhwaData.description ?? '',
        mangadexId: manhwaData.mangadexId ?? manhwaData.id ?? '',
        totalChapters: manhwaData.totalChapters ?? null,
      },
    }

    const next = [entry, ...get().entries]
    save(next)
    set({ entries: next })
    return { ok: true }
  },

  // ── Update ────────────────────────────────────────────────────────────
  updateEntry: (entryId, patch) => {
    const next = get().entries.map((e) =>
      e._id === entryId
        ? { ...e, ...patch, updatedAt: new Date().toISOString() }
        : e
    )
    save(next)
    set({ entries: next })
  },

  // ── Remove ────────────────────────────────────────────────────────────
  removeEntry: (entryId) => {
    const next = get().entries.filter((e) => e._id !== entryId)
    save(next)
    set({ entries: next })
  },

  // ── Helpers ───────────────────────────────────────────────────────────
  getByStatus: (status) => get().entries.filter((e) => e.readingStatus === status),

  getStats: () => {
    const entries = get().entries
    return {
      reading: entries.filter((e) => e.readingStatus === 'READING').length,
      completed: entries.filter((e) => e.readingStatus === 'COMPLETED').length,
      wishlist: entries.filter((e) => e.readingStatus === 'WANT_TO_READ').length,
      dropped: entries.filter((e) => e.readingStatus === 'DROPPED').length,
      total: entries.length,
    }
  },

  // ── Export / Import ───────────────────────────────────────────────────
  exportLibrary: () => {
    const data = JSON.stringify(get().entries, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manhwa-library-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  importLibrary: (jsonString) => {
    try {
      const imported = JSON.parse(jsonString)
      if (!Array.isArray(imported)) throw new Error('Invalid format')
      save(imported)
      set({ entries: imported })
      return { ok: true, count: imported.length }
    } catch {
      return { ok: false, message: 'Invalid file' }
    }
  },
}))