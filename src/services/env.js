/**
 * Runtime configuration. Read once, at module load, so the mode cannot change
 * halfway through a session and produce a half-mock, half-live report.
 */

const params =
  typeof window === 'undefined'
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search)

export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

/**
 * Mocks are on when the env var says so, when ?mock=1 is in the URL, or when
 * no API URL is configured at all. That last case matters: without it, a fresh
 * clone with no .env would silently POST to the page's own origin and 404.
 */
export const USE_MOCKS =
  import.meta.env.VITE_USE_MOCKS === 'true' ||
  params.get('mock') === '1' ||
  API_URL === ''

/** Demo switches. Mock mode only — they do nothing against a live backend. */
export const MOCK_OPTIONS = {
  /** ?rows=500 — stress the table with a large result set. */
  rowCount: clampRows(params.get('rows')),
  /** ?fail=reconcile|upload|receipts — force an ApiError to demo the retry path. */
  fail: params.get('fail') ?? null,
  /** ?slow=1 — stretch latency so loading states are visible. */
  slow: params.get('slow') === '1',
}

function clampRows(raw) {
  const n = Number.parseInt(raw ?? '', 10)
  if (!Number.isFinite(n)) return null
  return Math.min(Math.max(n, 1), 5000)
}

/** Human-readable description of the current data source, shown in the header. */
export function dataSourceLabel() {
  if (USE_MOCKS) return 'Mock fixtures'
  return API_URL || 'same origin'
}
