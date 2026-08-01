import { statusMeta } from '../../lib/status.js'
import { count } from '../../lib/format.js'

/**
 * A count, a label, and a filter. `needs_review` is deliberately not styled as
 * a milder discrepancy: it gets amber and a dashed edge, the same "we do not
 * know" treatment it has in the badge, the row marker, and the drawer.
 */
export default function SummaryCard({ status, value, active, onClick }) {
  const meta = statusMeta(status)
  const review = status === 'needs_review'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={`${meta.blurb} Click to filter the table.`}
      className={[
        'group flex min-w-0 flex-col items-start gap-1 rounded-sm border bg-surface px-3 py-2.5 text-left transition-colors',
        review ? 'border-dashed' : 'border-solid',
        active
          ? `${meta.border} bg-hover`
          : `border-line hover:bg-raised ${meta.card}`,
      ].join(' ')}
    >
      <span className="flex w-full items-center gap-1.5">
        <span
          className={[
            'h-1.5 w-1.5 shrink-0 rounded-full',
            meta.dot,
            review ? 'ring-1 ring-warn/60 ring-offset-1 ring-offset-surface' : '',
          ].join(' ')}
          aria-hidden="true"
        />
        <span className="label-eyebrow truncate">{meta.label}</span>
      </span>

      <span className={`font-mono text-xl tabular leading-none ${meta.text}`}>
        {count(value ?? 0)}
      </span>
    </button>
  )
}
