import { addDays, amount, int, mulberry32, pick } from './rng.js'
import { VENDORS, lineItemsFor, receiptUrl } from './vendors.js'
import { cents, dayDelta } from '../lib/format.js'

/**
 * Fixture generator.
 *
 * Two rules this file follows without exception:
 *
 *  1. Deterministic. One fixed seed, no Math.random(), so a reload during a demo
 *     produces byte-identical data.
 *  2. The summary is *computed from the rows*, never hand-written. A fixture set
 *     whose header disagrees with its own table is worse than no fixture at all.
 *
 * The default 51-row set is tuned so the computed summary reproduces the numbers
 * in the API contract exactly: 38 / 6 / 4 / 3 and a total variance of -184.32.
 */

export const DEFAULT_ROW_COUNT = 51
const SEED = 0x5eed1234
const FIRST_DAY = '2026-07-01'

/* ------------------------------------------------------------------ helpers */

function receipt({
  file,
  vendor,
  amount: amt,
  date,
  items,
  ocr,
}) {
  return {
    filename: file,
    image_url: receiptUrl(file),
    vendor,
    amount: cents(amt),
    date,
    line_items: items,
    ocr_confidence: ocr,
  }
}

function item(description, amt) {
  return { description, amount: cents(amt) }
}

/**
 * Splits a total across n plausible line items, with the last item absorbing the
 * rounding so the items always add up to the receipt total.
 */
function splitItems(rng, cleanVendor, total, n) {
  const names = lineItemsFor(cleanVendor)
  const wanted = Math.max(1, Math.min(n, names.length))
  if (wanted === 1 || total <= 0) return [item(names[0], total)]

  const out = []
  let left = total
  for (let i = 0; i < wanted - 1; i += 1) {
    const share = cents(left * (0.2 + rng() * 0.4))
    out.push(item(names[i], share))
    left = cents(left - share)
  }
  out.push(item(names[wanted - 1], left))
  return out
}

/**
 * The reason string is derived from the row's own numbers, so no row can ever
 * claim "differs by $12.00" while its cells show $9.
 */
export function buildReason(row) {
  const { status, csv, receipt: r } = row

  if (status === 'missing_receipt') {
    return 'No receipt was uploaded for this transaction'
  }

  const amountDelta = r ? cents(r.amount - csv.amount) : 0
  const dateDelta = r ? dayDelta(r.date, csv.date) : 0

  if (status === 'matched') {
    return dateDelta === 0
      ? 'Vendor resolved and amount matched exactly'
      : `Vendor resolved and amount matched; receipt dated ${Math.abs(dateDelta)} day earlier`
  }

  if (status === 'discrepancy') {
    const parts = []
    if (amountDelta !== 0) {
      parts.push(`amount differs by $${Math.abs(amountDelta).toFixed(2)}`)
    }
    if (dateDelta !== 0) {
      const n = Math.abs(dateDelta)
      parts.push(
        `receipt dated ${n} day${n === 1 ? '' : 's'} ${dateDelta > 0 ? 'before' : 'after'} the transaction`,
      )
    }
    return `Vendor matched, ${parts.join(' and ')}`
  }

  return row.reason ?? 'Match could not be confirmed'
}

/* --------------------------------------------------------------- edge rows */

/**
 * Every ugly case the UI has to survive, written by hand rather than left to
 * the generator. These are the rows worth demoing.
 */
function edgeRows() {
  const rng = mulberry32(SEED ^ 0x9e37)

  const rows = [
    /* --- the contract's own example, reproduced verbatim ------------------ */
    {
      id: 'txn_0001',
      status: 'discrepancy',
      confidence: 0.91,
      reason: 'Vendor matched, amount differs by $12.00',
      date: '2026-07-14',
      csv: {
        transaction_id: 'TXN-88213',
        vendor: 'AMZN MKTP US*2K4L9',
        amount: 142.0,
        date: '2026-07-14',
      },
      receipt: receipt({
        file: 'IMG_4471.svg',
        vendor: 'Amazon Marketplace',
        amount: 130.0,
        date: '2026-07-13', // receipt dated a day before its CSV row
        items: [item('USB-C cable', 18.0), item('Label maker tape', 112.0)],
        ocr: 0.88,
      }),
    },

    /* --- discrepancies, deltas chosen to land the variance on -184.32 ----- */
    {
      status: 'discrepancy',
      confidence: 0.87,
      date: '2026-07-09',
      csv: {
        vendor: 'POS DEBIT WHOLEFDS MKT #10259 SEATTLE WA',
        amount: 231.4,
        date: '2026-07-09',
      },
      receipt: receipt({
        file: 'IMG_4482.svg',
        vendor: 'Whole Foods Market',
        amount: 185.9, // -45.50
        date: '2026-07-09',
        items: [
          item('Cold brew 32oz', 41.9),
          item('Bananas', 12.0),
          item('Sourdough loaf', 44.0),
          item('Oat milk', 88.0),
        ],
        ocr: 0.79,
      }),
    },
    {
      status: 'discrepancy',
      confidence: 0.82,
      date: '2026-07-18',
      csv: {
        vendor: 'PAYPAL *UBER TRIP HELP.UB',
        amount: 43.2,
        date: '2026-07-18',
      },
      receipt: receipt({
        file: 'IMG_4503.svg',
        vendor: 'Uber',
        amount: 51.4, // +8.20 — receipt higher than the charge (partial refund posted)
        date: '2026-07-18',
        items: [item('Trip fare', 44.4), item('Booking fee', 3.0), item('Tip', 4.0)],
        ocr: 0.83,
      }),
    },
    {
      // 68-character vendor: proves truncation, the title tooltip, and that the
      // table layout does not shift when one cell is absurd.
      status: 'discrepancy',
      confidence: 0.74,
      date: '2026-07-22',
      csv: {
        vendor:
          'POS DEBIT SQ *THE VERY LONG COFFEE ROASTERS AND BAKERY COMPANY LLC',
        amount: 418.75,
        date: '2026-07-22',
      },
      receipt: receipt({
        file: 'IMG_4482.svg',
        vendor: 'The Very Long Coffee Roasters and Bakery Company LLC',
        amount: 316.0, // -102.75
        date: '2026-07-22',
        items: [
          item('House blend 5lb ×4', 216.0),
          item('Pastry catering tray', 84.0),
          item('Delivery', 16.0),
        ],
        ocr: 0.71,
      }),
    },
    {
      status: 'discrepancy',
      confidence: 0.94,
      date: '2026-07-03',
      csv: {
        vendor: 'ACH DEBIT ADOBE INC ADOBE  800-833-6687',
        amount: 89.98,
        date: '2026-07-03',
      },
      receipt: receipt({
        file: 'IMG_4519.svg',
        vendor: 'Adobe',
        amount: 85.99, // -3.99
        date: '2026-07-03',
        items: [item('Creative Cloud — 1 seat', 85.99)],
        ocr: 0.96,
      }),
    },
    {
      // Amounts agree exactly; only the date is off. The delta the drawer states
      // here is "+1 day", with no dollar delta at all.
      status: 'discrepancy',
      confidence: 0.9,
      date: '2026-07-26',
      csv: {
        vendor: "TST* MAMA'S KITCH",
        amount: 64.5,
        date: '2026-07-26',
      },
      receipt: receipt({
        file: 'IMG_4482.svg',
        vendor: "Mama's Kitchen",
        amount: 64.5, // 0.00
        date: '2026-07-25',
        items: [
          item('Chicken plate', 38.0),
          item('Side salad', 12.5),
          item('Iced tea', 8.0),
          item('Bread basket', 6.0),
        ],
        ocr: 0.85,
      }),
    },

    /* --- needs_review: the system does not know ---------------------------- */
    {
      // The mandated 0.41 OCR row. The amount on screen is not trustworthy.
      status: 'needs_review',
      confidence: 0.52,
      reason:
        'OCR confidence 0.41 — the printed total was too faint to read reliably',
      date: '2026-07-11',
      csv: {
        vendor: 'SQ *TARTINE BAKERY & CA',
        amount: 96.28,
        date: '2026-07-11',
      },
      receipt: receipt({
        file: 'IMG_4482.svg',
        vendor: 'Tartine Bakery & Cafe',
        amount: 78.0, // -18.28
        date: '2026-07-11',
        items: [item('Morning bun', 34.0), item('Cappuccino', 44.0)],
        ocr: 0.41,
      }),
    },
    {
      status: 'needs_review',
      confidence: 0.44,
      reason:
        'Vendor string matched two uploaded receipts with an equal score — could not choose between them',
      date: '2026-07-16',
      csv: {
        vendor: 'SQ *ROASTED & TOASTED L',
        amount: 27.5,
        date: '2026-07-16',
      },
      receipt: receipt({
        file: 'IMG_4482.svg',
        vendor: 'Roasted & Toasted',
        amount: 27.5, // 0.00
        date: '2026-07-16',
        items: [item('House blend', 19.5), item('Bagel', 8.0)],
        ocr: 0.68,
      }),
    },
    {
      status: 'needs_review',
      confidence: 0.38,
      reason:
        'Receipt total is short of the charge — possible split tender or a missing second page',
      date: '2026-07-29',
      csv: {
        vendor: 'COSTCO WHSE #0417 KIRKLAND',
        amount: 312.6,
        date: '2026-07-29',
      },
      receipt: receipt({
        file: 'IMG_4471.svg',
        vendor: 'Costco Wholesale',
        amount: 302.6, // -10.00
        date: '2026-07-28',
        items: [
          item('Coffee 3lb', 128.6),
          item('Paper plates', 74.0),
          item('Bottled water ×40', 100.0),
        ],
        ocr: 0.62,
      }),
    },

    /* --- missing_receipt: receipt is null, everywhere ---------------------- */
    {
      status: 'missing_receipt',
      confidence: 0,
      date: '2026-07-06',
      csv: { vendor: 'SHELL OIL 57443298104', amount: 71.03, date: '2026-07-06' },
      receipt: null,
    },
    {
      status: 'missing_receipt',
      confidence: 0,
      date: '2026-07-13',
      csv: { vendor: 'LYFT   *RIDE THU 4PM', amount: 22.85, date: '2026-07-13' },
      receipt: null,
    },
    {
      status: 'missing_receipt',
      confidence: 0,
      date: '2026-07-20',
      csv: {
        vendor: 'UPS*000000E4471X9',
        amount: 147.9,
        date: '2026-07-20',
      },
      receipt: null,
    },
    {
      status: 'missing_receipt',
      confidence: 0,
      date: '2026-07-27',
      csv: {
        vendor: 'ACH DEBIT SLACK TECHNOLOG SLACK',
        amount: 640.0,
        date: '2026-07-27',
      },
      receipt: null,
    },

    /* --- matched, but numerically awkward --------------------------------- */
    {
      // Negative amount: a refund. Must not be styled as an error.
      status: 'matched',
      confidence: 0.97,
      date: '2026-07-08',
      csv: {
        vendor: 'AMZN MKTP US*2K4L9',
        amount: -89.99,
        date: '2026-07-08',
      },
      receipt: receipt({
        file: 'IMG_4471.svg',
        vendor: 'Amazon Marketplace',
        amount: -89.99,
        date: '2026-07-08',
        items: [item('Returned: mechanical keyboard', -89.99)],
        ocr: 0.93,
      }),
    },
    {
      // $0.00. A comped meal still posts as an authorisation.
      status: 'matched',
      confidence: 0.95,
      date: '2026-07-17',
      csv: {
        vendor: 'TST* THE PURPLE ONION S',
        amount: 0.0,
        date: '2026-07-17',
      },
      receipt: receipt({
        file: 'IMG_4482.svg',
        vendor: 'The Purple Onion',
        amount: 0.0,
        date: '2026-07-17',
        items: [item('Lunch special — comped by manager', 0.0)],
        ocr: 0.9,
      }),
    },
    {
      // Five figures. Sets the widest the amount column will ever need to be.
      status: 'matched',
      confidence: 0.99,
      date: '2026-07-31',
      csv: {
        vendor: 'SP DEEL* PAYROLL SVC',
        amount: 12480.0,
        date: '2026-07-31',
      },
      receipt: receipt({
        file: 'IMG_4519.svg',
        vendor: 'Deel',
        amount: 12480.0,
        date: '2026-07-31',
        items: [item('Contractor payout', 12000.0), item('Platform fee', 480.0)],
        ocr: 0.94,
      }),
    },
  ]

  // Give every hand-written row a reason if it did not state one itself.
  return rows.map((row) => ({ ...row, reason: row.reason ?? buildReason(row) }))
}

/* -------------------------------------------------------------- generation */

/** Filler rows. Mostly matched, because most transactions really do match. */
function generatedRow(rng, index, status, dayRange) {
  const v = pick(rng, VENDORS)
  const date = addDays(FIRST_DAY, int(rng, 0, dayRange))
  const csvAmount = amount(rng, v.lo, v.hi)

  const csv = { vendor: v.raw, amount: csvAmount, date }

  if (status === 'missing_receipt') {
    const row = { status, confidence: 0, date, csv, receipt: null }
    // Still needs a reason: `reason` is required by the contract, and an
    // early return here is how it ended up undefined the first time.
    return { ...row, reason: buildReason(row) }
  }

  let receiptAmount = csvAmount
  let receiptDate = date
  let ocr = Math.round((0.72 + rng() * 0.26) * 100) / 100
  let confidence = Math.round((0.93 + rng() * 0.06) * 100) / 100
  let reason = null

  if (status === 'discrepancy') {
    const drift = amount(rng, 1.5, Math.max(6, csvAmount * 0.22))
    receiptAmount = cents(csvAmount - drift)
    confidence = Math.round((0.72 + rng() * 0.22) * 100) / 100
    if (rng() < 0.25) receiptDate = addDays(date, -1)
  } else if (status === 'needs_review') {
    // Low OCR *or* low match score — the two are independent measurements and
    // either one on its own is enough to stop the system from deciding.
    const ocrDriven = rng() < 0.5
    ocr = ocrDriven ? Math.round((0.35 + rng() * 0.2) * 100) / 100 : ocr
    confidence = Math.round((0.36 + rng() * 0.24) * 100) / 100
    receiptAmount = cents(csvAmount - amount(rng, 0, 9))
    reason = ocrDriven
      ? `OCR confidence ${ocr.toFixed(2)} — extracted values may be wrong`
      : 'Vendor could not be resolved with confidence from the statement text'
  }

  const row = {
    status,
    confidence,
    reason,
    date,
    csv,
    receipt: receipt({
      file: v.receipt,
      vendor: v.clean,
      amount: receiptAmount,
      date: receiptDate,
      items: splitItems(rng, v.clean, receiptAmount, int(rng, 1, 4)),
      ocr,
    }),
  }

  return { ...row, reason: row.reason ?? buildReason(row) }
}

/**
 * Fill statuses for the generated remainder.
 *
 * At the default row count the fill is entirely `matched`, which makes the
 * computed summary land exactly on the contract's 38 / 6 / 4 / 3. Above that,
 * the fill is proportional so a 500-row stress set still has enough
 * discrepancies and review rows to sort and filter against.
 */
function fillStatuses(rng, n, exactContractMix) {
  if (exactContractMix) return Array.from({ length: n }, () => 'matched')

  const out = []
  for (let i = 0; i < n; i += 1) {
    const r = rng()
    if (r < 0.76) out.push('matched')
    else if (r < 0.86) out.push('discrepancy')
    else if (r < 0.94) out.push('missing_receipt')
    else out.push('needs_review')
  }
  return out
}

/**
 * Rows in statement order (by date), with the contract's own example pinned
 * first as txn_0001 so a backend teammate can diff row[0] against the spec.
 */
export function makeRows(count = DEFAULT_ROW_COUNT) {
  const rng = mulberry32(SEED)
  const edges = edgeRows()
  const [contractRow, ...restEdges] = edges

  const fillCount = Math.max(0, count - edges.length)
  const exact = count === DEFAULT_ROW_COUNT
  const dayRange = count > 120 ? 120 : 30

  const statuses = fillStatuses(rng, fillCount, exact)
  const generated = statuses.map((status, i) =>
    generatedRow(rng, i, status, dayRange),
  )

  const rest = [...restEdges, ...generated].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  )

  let seq = 1
  const numbered = rest.map((row) => {
    seq += 1
    return {
      ...row,
      id: `txn_${String(seq).padStart(4, '0')}`,
      csv: {
        ...row.csv,
        transaction_id:
          row.csv.transaction_id ?? `TXN-${String(10000 + seq * 137).slice(0, 5)}`,
      },
    }
  })

  // If the caller asked for fewer rows than there are edge cases, keep the
  // interesting ones rather than silently returning a shorter matched-only set.
  const all = [contractRow, ...numbered]
  return count < all.length ? all.slice(0, count) : all
}

/**
 * Counts by status plus the signed variance. Variance sums only rows that have
 * a receipt — a missing receipt is unknown, not zero, and folding it in as zero
 * would understate the real exposure.
 */
export function computeSummary(rows, currency = 'USD') {
  const summary = {
    matched: 0,
    discrepancy: 0,
    missing_receipt: 0,
    needs_review: 0,
    total_variance: 0,
    currency,
  }

  let variance = 0
  for (const row of rows) {
    if (Object.hasOwn(summary, row.status)) summary[row.status] += 1
    if (row.receipt) variance += row.receipt.amount - row.csv.amount
  }

  summary.total_variance = cents(variance)
  return summary
}

let cache = new Map()

/** Memoised so repeated runs in one session return identical object identity. */
export function getMockReport({ rows = DEFAULT_ROW_COUNT } = {}) {
  if (cache.has(rows)) return cache.get(rows)

  const list = makeRows(rows)
  const report = { summary: computeSummary(list), rows: list }
  cache.set(rows, report)
  return report
}

export function __clearFixtureCache() {
  cache = new Map()
}
