/**
 * ComicK API
 * API:      https://comick.dev/search  (confirmed working)
 * Frontend: https://comick.dev/comic/<slug>
 * Proxy:    /comick → api.comick.dev via vite.config.js
 */

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

// export function normalizeComic(item) {
//   const md5 = item.md5 ?? item.comic?.md5 ?? null
//   const title = (item.title ?? item.eng_title ?? item.slug?.replace(/-/g, ' ') ?? 'Untitled').trim()
//   const genres = (item.genres ?? item.comic_genres ?? [])
//     .map((g) => (typeof g === 'string' ? g : g?.name ?? g?.genre?.name))
//     .filter(Boolean)

//   return {
//     id: item.id ?? item.comic?.id,
//     hid: item.hid ?? item.comic?.hid,
//     slug: item.slug ?? item.comic?.slug,
//     title,
//     coverUrl: getCoverUrl(md5),
//     author: (item.author_name ?? []).join(', ') || 'Unknown',
//     genres,
//     status: STATUS_LABEL[item.status] ?? 'ongoing',
//     description: item.desc ?? item.comic?.desc ?? '',
//     year: item.year,
//     type: item.country ?? 'jp',
//     rating: item.bayesian_rating ? Number(item.bayesian_rating).toFixed(1) : null,
//     // comick.io (not .dev) for user-facing links
//     comickUrl: item.slug ? `https://comick.dev/comic/${item.slug}` : null,

//   }
// }

export function normalizeComic(item) {
  // 1. Extract the unique cover identifier (md5)
  const md5 = item.md5 ?? item.comic?.md5 ?? null;

  // 2. Resolve the title, prioritizing English titles or slugs if necessary
  const title = (item.title ?? item.eng_title ?? item.slug?.replace(/-/g, ' ') ?? 'Untitled').trim();

  // 3. Flatten the genres array (handles both strings and nested objects)
  const genres = (item.genres ?? item.comic_genres ?? [])
    .map((g) => (typeof g === 'string' ? g : g?.name ?? g?.genre?.name))
    .filter(Boolean);

  // 4. Construct the normalized object
  const normalized = {
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
    // Use comick.io for the public URL
    comickUrl: item.slug ? `https://comick.dev/comic/${item.slug}` : null,
  };

  // 5. Debugging: Log the title to the console to track the mapping process
  console.log('[Normalize] Item:', normalized.title);

  return normalized;
}

// comick.js
async function comickFetch(path) {
  // Ensure we don't end up with /comick//search
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE}${cleanPath}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[ComicK Error] ${res.status}:`, errorText);
      throw new Error(`ComicK Error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('[Fetch Failed]', err);
    throw err;
  }
}

// lib/comick.js
export async function searchComics({
  query = '',
  type = '',
  status = '',
  genres = [],
  page = 1,
} = {}) {
  const params = new URLSearchParams({
    page,
    limit: LIMIT,
    // Based on your logs, these are required for a 200 OK
    content_rating: 'safe',
    sort: 'follow'
  })

  // Add second rating to match your log: &content_rating=suggestive
  params.append('content_rating', 'suggestive')

  if (query.trim()) params.set('q', query.trim())
  if (type) params.set('country', type === 'manhwa' ? 'kr' : type === 'manhua' ? 'cn' : 'jp')
  if (status) params.set('status', status)

  genres.forEach((g) => params.append('genres', g.toLowerCase()))

  // Note the /v1.0/ prefix from your logs
  const data = await comickFetch(`/v1.0/search?${params.toString()}`)

  // ComicK usually returns an array directly for search results
  const items = Array.isArray(data) ? data : (data.results ?? [])

  return {
    results: items.map(normalizeComic),
    hasMore: items.length >= LIMIT,
    page
  }
}

export async function getTrending({ type = '', page = 1 } = {}) {
  return searchComics({ type, page })
}