import { triageWeight } from '../../lib/status.js'
import { varianceMagnitude } from '../../lib/row.js'

/**
 * Column definitions.
 *
 * `widthClass` feeds `table-fixed`, so a column's width never depends on its
 * content. That is what stops a 66-character vendor string from shoving the
 * amount columns off the edge. Columns with no width share what is left over.
 *
 * `hideBelow` drops a column at narrow widths, tightest-first: the transaction
 * ID goes at xl, the date at lg, the receipt columns at md. Nothing is lost —
 * ReportRow reprints every hidden value as a muted second line under the
 * columns that survive, so the page never scrolls sideways at any width.
 */
export const COLUMNS = [
  {
    key: 'transaction_id',
    label: 'Transaction ID',
    widthClass: 'w-[124px]',
    align: 'left',
    hideBelow: 'xl',
    value: (r) => r.csv.transaction_id ?? '',
  },
  {
    key: 'date',
    label: 'Date',
    widthClass: 'w-[94px]',
    align: 'left',
    hideBelow: 'lg',
    value: (r) => r.csv.date ?? '',
  },
  {
    key: 'csv_vendor',
    label: 'CSV Vendor',
    align: 'left',
    value: (r) => (r.csv.vendor ?? '').toLowerCase(),
  },
  {
    key: 'receipt_vendor',
    label: 'Receipt Vendor',
    align: 'left',
    hideBelow: 'md',
    value: (r) => (r.receipt?.vendor ?? '').toLowerCase(),
  },
  {
    key: 'csv_amount',
    label: 'CSV Amount',
    widthClass: 'w-[100px] sm:w-[112px] xl:w-[124px]',
    align: 'right',
    numeric: true,
    value: (r) => r.csv.amount,
  },
  {
    key: 'receipt_amount',
    label: 'Receipt Amount',
    widthClass: 'w-[126px]',
    align: 'right',
    numeric: true,
    hideBelow: 'md',
    value: (r) => r.receipt?.amount ?? null,
  },
  {
    key: 'status',
    label: 'Status',
    widthClass: 'w-[46px] sm:w-[118px] xl:w-[132px]',
    align: 'left',
    value: (r) => triageWeight(r.status),
  },
]

export const COLUMN_BY_KEY = Object.fromEntries(COLUMNS.map((c) => [c.key, c]))

/** Tailwind classes implementing `hideBelow`. Written out so the scanner sees them. */
export function visibilityClass(col) {
  switch (col.hideBelow) {
    case 'xl':
      return 'hidden xl:table-cell'
    case 'lg':
      return 'hidden lg:table-cell'
    case 'md':
      return 'hidden md:table-cell'
    default:
      return 'table-cell'
  }
}

/**
 * Above this width every column has its own cell, so rows are a single dense
 * line. Below it, folded-in values add a second line and rows get taller — the
 * virtualizer needs to know which is in play.
 */
export const SINGLE_LINE_QUERY = '(min-width: 1280px)'
export const ROW_HEIGHT_DENSE = 32
export const ROW_HEIGHT_STACKED = 40

export const DEFAULT_SORT = { key: 'triage', dir: 'asc' }

/**
 * The default ordering, and the reason the table is useful at a glance:
 * needs_review first (the system does not know — a person must decide), then
 * discrepancy (a confident finding), then missing receipts, then matched.
 * Matched rows are the least interesting thing on the page and sort last.
 * Within a group, the largest dollar variance leads.
 */
function triageCompare(a, b) {
  const t = triageWeight(a.status) - triageWeight(b.status)
  if (t !== 0) return t

  const v = varianceMagnitude(b) - varianceMagnitude(a)
  if (v !== 0) return v

  return a.csv.date < b.csv.date ? 1 : a.csv.date > b.csv.date ? -1 : 0
}

/**
 * Comparator for a given sort key. Rows with no value always sink to the
 * bottom regardless of direction — a missing receipt is not "the smallest
 * amount", and sorting it as though it were would misrepresent the data.
 */
export function comparatorFor(key, dir) {
  if (key === 'triage') return triageCompare

  const col = COLUMN_BY_KEY[key]
  if (!col) return triageCompare

  const sign = dir === 'desc' ? -1 : 1

  return (a, b) => {
    const va = col.value(a)
    const vb = col.value(b)

    const aNull = va === null || va === undefined || va === ''
    const bNull = vb === null || vb === undefined || vb === ''
    if (aNull && bNull) return 0
    if (aNull) return 1
    if (bNull) return -1

    if (typeof va === 'number' && typeof vb === 'number') {
      const d = va - vb
      if (d !== 0) return d * sign
      return 0
    }
    return String(va).localeCompare(String(vb)) * sign
  }
}
