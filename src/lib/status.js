/**
 * The only place in the app where a status maps to a color, a label, or an order.
 *
 * The contract defines exactly four statuses. Nothing else, ever:
 *   "matched" | "discrepancy" | "missing_receipt" | "needs_review"
 *
 * The central design rule encoded here: `discrepancy` is a confident finding and
 * `needs_review` is an admission that the system does not know. They get different
 * hues AND different border styles — solid means we know, dashed means we don't.
 * needs_review must never read as a lesser discrepancy.
 */

export const STATUSES = [
  'matched',
  'discrepancy',
  'missing_receipt',
  'needs_review',
]

const META = {
  matched: {
    key: 'matched',
    label: 'Matched',
    short: 'Matched',
    // Confident, resolved, boring. The least interesting thing on the page.
    text: 'text-ok',
    bg: 'bg-ok-soft',
    border: 'border-ok',
    dot: 'bg-ok',
    marker: 'border-l-ok border-solid',
    badge: 'bg-ok-soft text-ok border border-ok/35 border-solid',
    card: 'hover:border-ok/50',
    accentVar: 'var(--color-ok)',
    glyph: '✓',
    // triage: matched is last — a human has no work to do here
    triage: 3,
    blurb: 'Vendor and amount agree within tolerance.',
  },
  discrepancy: {
    key: 'discrepancy',
    label: 'Discrepancy',
    short: 'Discrepancy',
    // A confident finding: we know exactly what is wrong.
    text: 'text-bad',
    bg: 'bg-bad-soft',
    border: 'border-bad',
    dot: 'bg-bad',
    marker: 'border-l-bad border-solid',
    badge: 'bg-bad-soft text-bad border border-bad/40 border-solid',
    card: 'hover:border-bad/50',
    accentVar: 'var(--color-bad)',
    glyph: '!',
    triage: 1,
    blurb: 'Matched to a receipt, but one or more fields disagree.',
  },
  missing_receipt: {
    key: 'missing_receipt',
    label: 'Missing receipt',
    short: 'Missing',
    // An absence, not an alarm. Grey keeps red meaningful.
    text: 'text-idle',
    bg: 'bg-idle-soft',
    border: 'border-idle',
    dot: 'bg-idle',
    marker: 'border-l-idle border-solid',
    badge: 'bg-idle-soft text-idle border border-idle/35 border-solid',
    card: 'hover:border-idle/50',
    accentVar: 'var(--color-idle)',
    glyph: '∅',
    triage: 2,
    blurb: 'No receipt was submitted for this transaction.',
  },
  needs_review: {
    key: 'needs_review',
    label: 'Needs review',
    short: 'Review',
    // An admission of uncertainty. Dashed everything.
    text: 'text-warn',
    bg: 'bg-warn-soft',
    border: 'border-warn',
    dot: 'bg-warn',
    marker: 'border-l-warn border-dashed',
    badge: 'bg-warn-soft text-warn border border-warn/55 border-dashed',
    card: 'hover:border-warn/60',
    accentVar: 'var(--color-warn)',
    glyph: '?',
    // triage: first. This is the row a human must actually resolve.
    triage: 0,
    blurb: 'The system could not decide. A person has to look at this.',
  },
}

/**
 * Anything not in the contract renders as neutral rather than crashing.
 * Defensive against a backend typo — not an invented fifth state.
 */
const UNKNOWN = {
  key: 'unknown',
  label: 'Unknown',
  short: 'Unknown',
  text: 'text-ink-dim',
  bg: 'bg-raised',
  border: 'border-line-strong',
  dot: 'bg-ink-faint',
  marker: 'border-l-line-strong border-solid',
  badge: 'bg-raised text-ink-dim border border-line-strong border-solid',
  card: 'hover:border-line-strong',
  accentVar: 'var(--color-ink-faint)',
  glyph: '·',
  triage: 4,
  blurb: 'Status not recognised by this build of the UI.',
}

export function statusMeta(status) {
  return META[status] ?? { ...UNKNOWN, label: String(status ?? 'Unknown') }
}

export function isKnownStatus(status) {
  return Object.hasOwn(META, status)
}

/** Sort weight for the default "triage" ordering. Lower sorts first. */
export function triageWeight(status) {
  return statusMeta(status).triage
}

/** Summary cards, in reading order. Deliberately not triage order. */
export const SUMMARY_ORDER = [
  { key: 'matched', summaryKey: 'matched' },
  { key: 'discrepancy', summaryKey: 'discrepancy' },
  { key: 'missing_receipt', summaryKey: 'missing_receipt' },
  { key: 'needs_review', summaryKey: 'needs_review' },
]
