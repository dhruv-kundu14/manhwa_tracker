/**
 * AniList GraphQL API
 * Endpoint: https://graphql.anilist.co
 * No CORS issues — works directly from browser in both dev and production.
 * No API key needed.
 */

const ENDPOINT = 'https://graphql.anilist.co'
const PER_PAGE = 20

export const PER_PAGE_COUNT = PER_PAGE

// AniList format for manga types
export const TYPES = [
    { id: '', label: 'All' },
    { id: 'MANHWA', label: 'Manhwa 🇰🇷' },
    { id: 'MANGA', label: 'Manga 🇯🇵' },
    { id: 'MANHUA', label: 'Manhua 🇨🇳' },
]

export const STATUSES = [
    { id: '', label: 'Any Status' },
    { id: 'RELEASING', label: 'Ongoing' },
    { id: 'FINISHED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'HIATUS', label: 'Hiatus' },
]

export const GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
    'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery',
    'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller',
]

const STATUS_LABEL = {
    RELEASING: 'ongoing',
    FINISHED: 'completed',
    CANCELLED: 'cancelled',
    HIATUS: 'hiatus',
    NOT_YET_RELEASED: 'upcoming',
}

// ─── Normalize AniList media → our shape ──────────────────────────────────────
export function normalizeMedia(item) {
    return {
        id: String(item.id),
        title: item.title?.english || item.title?.romaji || item.title?.native || 'Untitled',
        coverUrl: item.coverImage?.large || item.coverImage?.medium || null,
        author: item.staff?.edges?.find(e => e.role?.toLowerCase().includes('story'))?.node?.name?.full
            || item.staff?.edges?.[0]?.node?.name?.full
            || 'Unknown',
        genres: item.genres ?? [],
        status: STATUS_LABEL[item.status] ?? 'ongoing',
        description: item.description?.replace(/<[^>]*>/g, '') ?? '',
        year: item.startDate?.year ?? null,
        type: item.countryOfOrigin ?? 'JP',
        rating: item.averageScore ? (item.averageScore / 10).toFixed(1) : null,
        chapters: item.chapters ?? null,
        anilistUrl: `https://anilist.co/manga/${item.id}`,
        format: item.format,
    }
}

// ─── GraphQL query fragment ────────────────────────────────────────────────────
const MEDIA_FIELDS = `
  id
  title { english romaji native }
  coverImage { large medium }
  genres
  status
  averageScore
  chapters
  format
  countryOfOrigin
  startDate { year }
  description(asHtml: false)
  staff(perPage: 3) {
    edges { role node { name { full } } }
  }
`

// ─── Fetch helper ──────────────────────────────────────────────────────────────
async function gql(query, variables = {}) {
    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
    })
    if (!res.ok) throw new Error(`AniList ${res.status}`)
    const { data, errors } = await res.json()
    if (errors?.length) throw new Error(errors[0].message)
    return data
}

// ─── Browse: trending / filtered ──────────────────────────────────────────────
export async function browseMedia({
    type = 'MANHWA',
    status = '',
    genre = '',
    alpha = '',
    page = 1,
} = {}) {
    const variables = {
        page,
        perPage: PER_PAGE,
        type: 'MANGA',
        sort: alpha ? ['TITLE_ROMAJI'] : ['POPULARITY_DESC'],
    }

    // Country filter for manhwa/manhua
    if (type === 'MANHWA') variables.countryOfOrigin = 'KR'
    else if (type === 'MANHUA') variables.countryOfOrigin = 'CN'
    else if (type === 'MANGA') variables.countryOfOrigin = 'JP'

    if (status) variables.status = status
    if (genre) variables.genre = genre

    // Alpha filter — AniList doesn't support startsWith natively,
    // we use search with the letter as query to approximate
    if (alpha && alpha !== '#') variables.search = alpha

    const query = `
    query Browse(
      $page: Int $perPage: Int $type: MediaType
      $sort: [MediaSort] $status: MediaStatus $genre: String
      $countryOfOrigin: CountryCode $search: String
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage currentPage }
        media(
          type: $type sort: $sort status: $status
          genre: $genre countryOfOrigin: $countryOfOrigin
          search: $search isAdult: false
        ) { ${MEDIA_FIELDS} }
      }
    }
  `

    const data = await gql(query, variables)
    const page_ = data.Page
    const results = (page_.media ?? []).map(normalizeMedia)

    // Sort alphabetically client-side
    results.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))

    return {
        results,
        hasMore: page_.pageInfo?.hasNextPage ?? false,
        currentPage: page_.pageInfo?.currentPage ?? page,
    }
}

// ─── Search by title ──────────────────────────────────────────────────────────
export async function searchMedia({ query = '', type = '', page = 1 } = {}) {
    if (!query.trim()) return { results: [], hasMore: false }

    const variables = {
        page, perPage: PER_PAGE,
        type: 'MANGA',
        search: query.trim(),
        sort: ['SEARCH_MATCH'],
    }
    if (type === 'MANHWA') variables.countryOfOrigin = 'KR'
    else if (type === 'MANHUA') variables.countryOfOrigin = 'CN'
    else if (type === 'MANGA') variables.countryOfOrigin = 'JP'

    const q = `
    query Search(
      $page: Int $perPage: Int $type: MediaType
      $search: String $sort: [MediaSort] $countryOfOrigin: CountryCode
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(
          type: $type search: $search sort: $sort
          countryOfOrigin: $countryOfOrigin isAdult: false
        ) { ${MEDIA_FIELDS} }
      }
    }
  `

    const data = await gql(q, variables)
    const results = (data.Page.media ?? []).map(normalizeMedia)
    return { results, hasMore: data.Page.pageInfo?.hasNextPage ?? false }
}