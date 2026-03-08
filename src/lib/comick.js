/**
 * ComicK API
 * LOCAL DEV:  BASE='/comick' → Vite proxy → https://api.comick.app
 * PRODUCTION: BASE='/comick' → vercel.json rewrite → /api/comick serverless fn → https://api.comick.app
 */

// const BASE = '/comick'
const BASE = 'https://corsproxy.io/?' + encodeURIComponent('https://api.comick.dev');

const COVER_BASE = 'https://meo.comick.pictures'
const LIMIT = 20

export const LIMIT_PER_PAGE = LIMIT

export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Historical', 'Horror', 'Isekai', 'Martial Arts', 'Mecha',
  'Mystery', 'Psychological', 'Romance', 'School Life',
  'Sci-Fi', 'Seinen', 'Shoujo', 'Shounen', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller', 'Webtoons',
]

export const TYPES = [
  { id: '', label: 'All' },
  { id: 'manhwa', label: 'Manhwa 🇰🇷' },
  { id: 'manga', label: 'Manga 🇯🇵' },
  { id: 'manhua', label: 'Manhua 🇨🇳' },
]

export const STATUSES = [
  { id: '', label: 'Any Status' },
  { id: '1', label: 'Ongoing' },
  { id: '2', label: 'Completed' },
  { id: '3', label: 'Cancelled' },
  { id: '4', label: 'Hiatus' },
]

const STATUS_LABEL = { 1: 'ongoing', 2: 'completed', 3: 'cancelled', 4: 'hiatus' }

export function getCoverUrl(md5) {
  return md5 ? `${COVER_BASE}/${md5}?width=400` : null
}

export function normalizeComic(item) {
  const md5 = item.md5 ?? item.comic?.md5 ?? null
  const title = (item.title ?? item.eng_title ?? item.slug?.replace(/-/g, ' ') ?? 'Untitled').trim()
  const genres = (item.genres ?? item.comic_genres ?? [])
    .map((g) => (typeof g === 'string' ? g : g?.name ?? g?.genre?.name))
    .filter(Boolean)
  return {
    id: item.id ?? item.comic?.id,
    hid: item.hid ?? item.comic?.hid,
    slug: item.slug ?? item.comic?.slug,
    title,
    coverUrl: getCoverUrl(md5),
    author: (item.author_name ?? []).join(', ') || 'Unknown',
    genres,
    status: STATUS_LABEL[item.status] ?? 'ongoing',
    description: item.desc ?? item.comic?.desc ?? '',
    year: item.year,
    type: item.country ?? 'jp',
    rating: item.bayesian_rating ? Number(item.bayesian_rating).toFixed(1) : null,
    comickUrl: item.slug ? `https://comick.dev/comic/${item.slug}` : null,
  }
}

async function comickFetch(path) {
  const url = `${BASE}${path}`
  console.log('[ComicK] →', url)
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    console.log('[ComicK] ←', res.status, res.statusText)
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[ComicK] error body:', body.slice(0, 300))
      throw new Error(`ComicK ${res.status}: ${res.statusText}`)
    }
    const data = await res.json()
    console.log('[ComicK] items:', Array.isArray(data) ? data.length : typeof data)
    return data
  } catch (err) {
    console.error('[ComicK] fetch threw:', err.message)
    throw err
  }
}

export async function searchComics({
  query = '',
  type = '',
  status = '',
  genres = [],
  page = 1,
} = {}) {
  const params = new URLSearchParams({ page, limit: LIMIT, tachiyomi: 'true' })
  if (query.trim()) params.set('q', query.trim())
  if (type) params.set('country', type === 'manhwa' ? 'kr' : type === 'manhua' ? 'cn' : 'jp')
  if (status) params.set('status', status)
  if (!query.trim()) params.set('sort', 'follow')
  genres.forEach((g) => params.append('genres', g))

  const data = await comickFetch(`/v1.0/search?${params.toString()}`)
  const items = Array.isArray(data) ? data : (data.data ?? data.results ?? [])
  return { results: items.map(normalizeComic), hasMore: items.length === LIMIT, page }
}

export async function getTrending({ type = '', page = 1 } = {}) {
  return searchComics({ type, page })
}