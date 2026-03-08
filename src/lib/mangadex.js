/**
 * MangaDex API service
 * Docs: https://api.mangadex.org/docs/
 *
 * All requests go through the Vite dev proxy at /mangadex → https://api.mangadex.org
 * Cover images go through /mdcovers → https://uploads.mangadex.org
 * This avoids all CORS issues in development.
 * In production, set up the same proxy rules in your Express backend.
 */

const BASE = '/mangadex'   // proxied by Vite → https://api.mangadex.org
const LIMIT = 20

// MangaDex tag IDs for genres we care about
export const TAG_IDS = {
    Action: '391b0423-d847-456f-aff0-8b0cfc03066b',
    Adventure: '87cc87cd-a395-47af-b27a-93258283bbc6',
    Comedy: '4d32cc48-9f00-4cca-9b5a-a839f0764984',
    Drama: 'b9af3a63-f058-46de-a9a0-e0c13906197a',
    Fantasy: 'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
    Horror: 'cdad7e68-1419-41dd-bdce-27753074a640',
    Romance: '423e2eae-a7a2-4a8b-ac03-a8351462d71d',
    'Martial Arts': '799c202e-7daa-44eb-9cf7-8a3c0441531e',
    'Sci-Fi': '256c8bd9-4904-4360-bf4f-508a76d67183',
    'Slice of Life': 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9',
    Sports: '69964a64-2f90-4d33-beeb-107d3f6cd40b',
    Supernatural: 'eabc5b4c-6aff-42f3-b657-3e90cbd00b75',
    Thriller: '07251805-a27e-4d59-b488-f0bfbec15168',
}

const ORIGIN_LANG = {
    manhwa: ['ko'],
    manga: ['ja'],
    manhua: ['zh', 'zh-hk'],
    all: [],
}

/**
 * Cover image URL — routed through Vite proxy to avoid CORS on <img> tags
 */
export function getCoverUrl(mangaId, coverFilename, size = 256) {
    return `/mdcovers/covers/${mangaId}/${coverFilename}.${size}.jpg`
}

export function getTitle(attributes) {
    return (
        attributes.title?.en ||
        attributes.title?.['ja-ro'] ||
        Object.values(attributes.title ?? {})[0] ||
        'Untitled'
    )
}

export function getDescription(attributes) {
    return attributes.description?.en || Object.values(attributes.description ?? {})[0] || ''
}

export function normalizeManga(item) {
    const attr = item.attributes

    const coverRel = item.relationships?.find((r) => r.type === 'cover_art')
    const coverFile = coverRel?.attributes?.fileName
    const coverUrl = coverFile ? getCoverUrl(item.id, coverFile, 256) : null

    const authorRel = item.relationships?.find((r) => r.type === 'author')
    const author = authorRel?.attributes?.name ?? 'Unknown'

    const genres = (attr.tags ?? [])
        .filter((t) => t.attributes?.group === 'genre' || t.attributes?.group === 'theme')
        .map((t) => t.attributes?.name?.en)
        .filter(Boolean)

    return {
        id: item.id,
        title: getTitle(attr),
        description: getDescription(attr),
        coverUrl,
        author,
        genres,
        status: attr.status ?? 'ongoing',
        year: attr.year,
        originalLang: attr.originalLanguage,
    }
}

/**
 * Search / browse — hits Vite proxy → MangaDex directly, no CORS issue
 */
export async function searchManhwa({ query = '', origin = 'manhwa', tagIds = [], status = '', offset = 0 } = {}) {
    const params = new URLSearchParams({
        limit: LIMIT,
        offset,
        'order[followedCount]': 'desc',
    })

    params.append('includes[]', 'cover_art')
    params.append('includes[]', 'author')
    params.append('contentRating[]', 'safe')
    params.append('contentRating[]', 'suggestive')

    if (query.trim()) params.set('title', query.trim())

    const langs = ORIGIN_LANG[origin] ?? []
    langs.forEach((l) => params.append('originalLanguage[]', l))
    tagIds.forEach((id) => params.append('includedTags[]', id))
    if (status) params.append('status[]', status)

    const res = await fetch(`${BASE}/manga?${params.toString()}`)
    if (!res.ok) throw new Error(`MangaDex error: ${res.status}`)
    const data = await res.json()

    return {
        results: (data.data ?? []).map(normalizeManga),
        total: data.total ?? 0,
        offset: data.offset ?? 0,
        limit: data.limit ?? LIMIT,
    }
}

export async function getMangaById(id) {
    const params = new URLSearchParams()
    params.append('includes[]', 'cover_art')
    params.append('includes[]', 'author')

    const res = await fetch(`${BASE}/manga/${id}?${params.toString()}`)
    if (!res.ok) throw new Error(`MangaDex error: ${res.status}`)
    const data = await res.json()
    return normalizeManga(data.data)
}

export const LIMIT_PER_PAGE = LIMIT 