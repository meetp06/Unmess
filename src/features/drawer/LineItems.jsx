import { cents, money } from '../../lib/format.js'

/** Line items as printed on the receipt, with their own total for cross-checking. */
export default function LineItems({ items, receiptTotal, currency }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <section className="rounded-sm border border-line bg-surface p-3">
        <h3 className="label-eyebrow mb-1">Line items</h3>
        <p className="text-xs text-ink-faint">
          No line items were extracted from this receipt.
        </p>
      </section>
    )
  }

  const sum = cents(items.reduce((acc, i) => acc + (i.amount ?? 0), 0))
  const mismatch =
    typeof receiptTotal === 'number' && Math.abs(sum - receiptTotal) > 0.005

  return (
    <section className="rounded-sm border border-line bg-surface">
      <h3 className="label-eyebrow border-b border-line px-3 py-2">
        Line items · {items.length}
      </h3>
      <ul className="px-3 py-1">
        {items.map((li, i) => (
          <li
            key={i}
            className="flex items-baseline justify-between gap-3 border-b border-line/50 py-1.5 last:border-b-0"
          >
            <span className="min-w-0 truncate text-xs text-ink-dim" title={li.description}>
              {li.description ?? '—'}
            </span>
            <span className="shrink-0 font-mono text-xs tabular text-ink">
              {money(li.amount, currency)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between gap-3 border-t border-line px-3 py-2">
        <span className="text-2xs uppercase tracking-[0.08em] text-ink-dim">
          Items total
        </span>
        <span
          className={`font-mono text-xs tabular ${mismatch ? 'text-warn' : 'text-ink'}`}
          title={
            mismatch
              ? 'Line items do not add up to the receipt total — the scan may have missed a line'
              : undefined
          }
        >
          {money(sum, currency)}
        </span>
      </div>
    </section>
  )
}
