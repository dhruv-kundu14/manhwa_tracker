/**
 * Vercel Serverless Function — proxies ComicK API requests.
 *
 * vercel.json rewrites:
 *   /comick/v1.0/search?page=1&...
 *   → /api/comick?path=/v1.0/search&page=1&...
 *
 * This function strips `path`, builds the target URL, and forwards everything else.
 */

export default async function handler(req, res) {
  const { path = '/v1.0/search', ...queryParams } = req.query

  const qs = new URLSearchParams(queryParams).toString()
  const targetUrl = `https://api.comick.app${path}${qs ? '?' + qs : ''}`

  console.log('[Comick Proxy] →', targetUrl)

  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://comick.io',
        'Referer': 'https://comick.io/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    console.log('[Comick Proxy] ←', upstream.status)

    if (!upstream.ok) {
      const text = await upstream.text()
      console.error('[Comick Proxy] upstream error:', text.slice(0, 200))
      return res.status(upstream.status).json({ error: `Upstream ${upstream.status}` })
    }

    const data = await upstream.json()

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(data)

  } catch (err) {
    console.error('[Comick Proxy] fetch error:', err.message)
    return res.status(500).json({ error: 'Proxy failed', message: err.message })
  }
}