/**
 * Display formatting. Every function here tolerates null/undefined and returns
 * the em dash rather than "undefined" or "NaN" — the contract allows a null
 * receipt, so half the fields on the page can legitimately be absent.
 */

export const EM_DASH = '—'

const nf = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

/** 142 -> "$142.00", -89.99 -> "-$89.99", null -> "—" */
export function money(value, currency = 'USD') {
  if (!isNum(value)) return EM_DASH
  const symbol = currencySymbol(currency)
  const sign = value < 0 ? '-' : ''
  return `${sign}${symbol}${nf.format(Math.abs(value))}`
}

/** Always shows a sign, including for positive values. 0 renders as "$0.00". */
export function signedMoney(value, currency = 'USD') {
  if (!isNum(value)) return EM_DASH
  const symbol = currencySymbol(currency)
  if (value === 0) return `${symbol}0.00`
  const sign = value < 0 ? '-' : '+'
  return `${sign}${symbol}${nf.format(Math.abs(value))}`
}

export function currencySymbol(currency) {
  switch (currency) {
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'
    default:
      return currency ? `${currency} ` : '$'
  }
}

/** "2026-07-14" -> "Jul 14, 2026". Parsed as a plain date, never shifted by TZ. */
export function longDate(iso) {
  const d = parseIsoDate(iso)
  if (!d) return EM_DASH
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** "2026-07-14" -> "2026-07-14". Kept ISO in the table so dates sort visually. */
export function tableDate(iso) {
  return typeof iso === 'string' && iso.length >= 10 ? iso.slice(0, 10) : EM_DASH
}

/**
 * Dates in the contract are plain calendar dates. Constructing them with the
 * UTC constructor avoids the classic "off by one day in a western timezone" bug.
 */
export function parseIsoDate(iso) {
  if (typeof iso !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return null
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

const DAY_MS = 86_400_000

/** Whole days from `a` to `b`. Positive means b is later. null if unparseable. */
export function dayDelta(a, b) {
  const da = parseIsoDate(a)
  const db = parseIsoDate(b)
  if (!da || !db) return null
  return Math.round((db.getTime() - da.getTime()) / DAY_MS)
}

/** 1 -> "+1 day", -1 -> "-1 day", -2 -> "-2 days" */
export function signedDays(delta) {
  if (!isNum(delta)) return EM_DASH
  if (delta === 0) return 'same day'
  const sign = delta > 0 ? '+' : '-'
  const n = Math.abs(delta)
  return `${sign}${n} ${n === 1 ? 'day' : 'days'}`
}

/** 0.91 -> "91%" */
export function pct(value, digits = 0) {
  if (!isNum(value)) return EM_DASH
  return `${(value * 100).toFixed(digits)}%`
}

/** 0.91 -> "0.91" — the raw number, because the drawer shows it as a number. */
export function ratio(value) {
  return isNum(value) ? value.toFixed(2) : EM_DASH
}

/** Any nullish/empty value renders as the em dash, never as "undefined". */
export function orDash(value) {
  if (value === null || value === undefined) return EM_DASH
  const s = String(value)
  return s.trim() === '' ? EM_DASH : s
}

/** 20480 -> "20.0 KB" */
export function formatBytes(bytes) {
  if (!isNum(bytes) || bytes < 0) return EM_DASH
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(1)} ${units[i]}`
}

/** 1234 -> "1,234" */
export function count(n) {
  return isNum(n) ? n.toLocaleString('en-US') : EM_DASH
}

/** Round to cents. Guards against float drift when summing variance. */
export function cents(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
