/**
 * External reading sources — ManhwaClan & MangaBuddy
 * Used only for reading redirects, never for browsing.
 */

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[''"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const SOURCES = [
  {
    id: 'manhwaclan',
    name: 'ManhwaClan',
    color: '#f97316',
    icon: '⚔️',
    note: 'Best manhwa coverage',
    getTitleUrl: ({ title }) => `https://manhwaclan.com/manga/${slugify(title)}/`,
    getChapterUrl: ({ title, chapter }) => `https://manhwaclan.com/manga/${slugify(title)}/chapter-${chapter}/`,
    getSearchUrl: ({ title }) => `https://manhwaclan.com/?s=${encodeURIComponent(title)}&post_type=wp-manga`,
  },
  {
    id: 'mangabuddy',
    name: 'MangaBuddy',
    color: '#3b82f6',
    icon: '📘',
    note: 'Great manga & manhwa library',
    getTitleUrl: ({ title }) => `https://mangabuddy.com/search?q=${encodeURIComponent(title)}`,
    getChapterUrl: ({ title, chapter }) => `https://mangabuddy.com/${slugify(title)}/chapter-${chapter}`,
    getSearchUrl: ({ title }) => `https://mangabuddy.com/search?q=${encodeURIComponent(title)}`,
  },
]

export function openTitlePage(sourceId, { title }) {
  const s = SOURCES.find((x) => x.id === sourceId)
  if (s) window.open(s.getTitleUrl({ title }), '_blank', 'noopener,noreferrer')
}

export function openChapterPage(sourceId, { title, chapter }) {
  const s = SOURCES.find((x) => x.id === sourceId)
  if (!s) return
  const url = chapter > 0 ? s.getChapterUrl({ title, chapter }) : s.getTitleUrl({ title })
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function openSearchPage(sourceId, { title }) {
  const s = SOURCES.find((x) => x.id === sourceId)
  if (s) window.open(s.getSearchUrl({ title }), '_blank', 'noopener,noreferrer')
}