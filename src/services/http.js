import { API_URL } from './env.js'

/**
 * A failure the UI can actually show a person. `message` is always the most
 * specific text available — the server's own error string when there is one —
 * because "Something went wrong" is useless at 2am during a demo.
 */
export class ApiError extends Error {
  constructor(message, { status = null, url = null, cause = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
    if (cause) this.cause = cause
  }
}

/**
 * Digs the most useful message out of a failed response body. Backends disagree
 * about the shape of an error, so try the common ones before falling back.
 */
async function messageFromResponse(res) {
  const raw = await res.text().catch(() => '')
  if (raw) {
    try {
      const body = JSON.parse(raw)
      const found =
        body?.error ??
        body?.message ??
        body?.detail ??
        (Array.isArray(body?.errors) ? body.errors.join('; ') : null)
      if (typeof found === 'string' && found.trim()) return found.trim()
      if (found && typeof found === 'object') return JSON.stringify(found)
    } catch {
      // Not JSON. Plain text from a proxy or a stack trace is still better
      // than nothing, but do not paste a whole HTML error page on screen.
      const text = raw.trim()
      if (text && !text.startsWith('<')) return text.slice(0, 500)
    }
  }
  return `${res.status} ${res.statusText || 'Request failed'}`
}

export async function http(path, options = {}) {
  const url = `${API_URL}${path}`
  let res
  try {
    res = await fetch(url, options)
  } catch (err) {
    // Network-level failure: no response at all. Name the URL so the teammate
    // building the backend can see immediately what the UI tried to reach.
    throw new ApiError(
      `Could not reach ${url || path}. ${err?.message ?? 'Network request failed.'}`,
      { url, cause: err },
    )
  }

  if (!res.ok) {
    throw new ApiError(await messageFromResponse(res), { status: res.status, url })
  }

  if (res.status === 204) return null

  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new ApiError(
      `Response from ${url} was not valid JSON: ${err.message}`,
      { status: res.status, url, cause: err },
    )
  }
}
