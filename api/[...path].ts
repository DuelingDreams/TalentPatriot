import type { IncomingMessage, ServerResponse } from 'http'

// Vercel function config: disable body parser so we can stream raw bytes (including file uploads)
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}

function collectBody(req: IncomingMessage): Promise<Buffer | null> {
  if (!req.method || req.method === 'GET' || req.method === 'HEAD') {
    return Promise.resolve(null)
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : null))
    req.on('error', reject)
  })
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      error: 'BACKEND_URL is not set. Add it in the Vercel dashboard → Settings → Environment Variables.',
    }))
    return
  }

  const targetUrl = `${backendUrl.replace(/\/$/, '')}${req.url ?? '/'}`

  const forwardHeaders: Record<string, string> = {}
  for (const [key, val] of Object.entries(req.headers)) {
    const lower = key.toLowerCase()
    // Strip hop-by-hop headers that must not be forwarded
    if (['host', 'connection', 'transfer-encoding', 'keep-alive'].includes(lower)) continue
    if (val != null) forwardHeaders[key] = Array.isArray(val) ? val.join(', ') : val
  }

  try {
    const body = await collectBody(req)

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: body ?? undefined,
    })

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((val, key) => {
      if (!['transfer-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
        responseHeaders[key] = val
      }
    })

    res.writeHead(response.status, responseHeaders)
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (err) {
    console.error('[vercel-proxy] error forwarding to backend:', err)
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Backend unavailable' }))
  }
}
