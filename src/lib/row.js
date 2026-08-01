import { cents, dayDelta } from './format.js'

/**
 * Derived facts about a row. Every one of these tolerates `receipt: null`,
 * because the contract allows it and four different screens read these.
 */

/** receipt − csv, in dollars. null when there is no receipt to compare. */
export function amountDelta(row) {
  if (!row?.receipt) return null
  return cents(row.receipt.amount - row.csv.amount)
}

/** Whole days between the receipt date and the CSV date. Positive = receipt later. */
export function dateDelta(row) {
  if (!row?.receipt) return null
  return dayDelta(row.csv.date, row.receipt.date)
}

/** Magnitude used to rank rows by how much money is in question. */
export function varianceMagnitude(row) {
  const d = amountDelta(row)
  return d === null ? 0 : Math.abs(d)
}

/** True when the two sides disagree on a field the UI compares. */
export function hasAmountDiff(row) {
  const d = amountDelta(row)
  return d !== null && d !== 0
}

export function hasDateDiff(row) {
  const d = dateDelta(row)
  return d !== null && d !== 0
}

/**
 * Vendor strings are *expected* to differ — "SQ *BLUE BOTTLE COFFE" vs
 * "Blue Bottle Coffee" is a successful match, not a discrepancy. So this is a
 * loose comparison: it only flags vendors that do not plausibly refer to the
 * same business, which is what a reviewer actually cares about.
 */
export function vendorLooksDifferent(row) {
  if (!row?.receipt) return false
  const a = normaliseVendor(row.csv.vendor)
  const b = normaliseVendor(row.receipt.vendor)
  if (!a || !b) return true
  if (a.includes(b) || b.includes(a)) return false

  // Compare significant word stems; bank strings truncate mid-word, so a
  // prefix match on a 4+ character stem counts as agreement.
  const wordsA = a.split(' ').filter((w) => w.length >= 4)
  const wordsB = b.split(' ').filter((w) => w.length >= 4)
  if (wordsA.length === 0 || wordsB.length === 0) return true

  return !wordsA.some((wa) =>
    wordsB.some((wb) => wa.startsWith(wb.slice(0, 4)) || wb.startsWith(wa.slice(0, 4))),
  )
}

const PROCESSOR_PREFIXES =
  /^(sq|tst|py|in|dd|ups|pos debit|ach debit|ach|sp|paypal|google|lyft|wm|py)\b[\s*]*/i

function normaliseVendor(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[*#]/g, ' ')
    .replace(PROCESSOR_PREFIXES, '')
    .replace(/\b\d{4,}\b/g, ' ') // store and reference numbers
    .replace(/\b(inc|llc|ltd|co|corp|the|and)\b/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Fields the drawer should highlight on both sides. */
export function fieldDiffs(row) {
  return {
    vendor: vendorLooksDifferent(row),
    amount: hasAmountDiff(row),
    date: hasDateDiff(row),
  }
}

/** Free-text haystack for the search box. */
export function searchHaystack(row) {
  return [row.csv?.vendor, row.receipt?.vendor, row.csv?.transaction_id]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}
