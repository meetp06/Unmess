import { statusMeta } from '../../lib/status.js'

/**
 * The one badge. `needs_review` is dashed and carries a `?`; `discrepancy` is
 * solid and carries a `!`. That difference is the whole point — one is a
 * finding, the other is an admission — so it is encoded in the shape of the
 * badge, not only in its colour.
 */
export default function StatusBadge({ status, size = 'md', className = '' }) {
  const meta = statusMeta(status)

  return (
    <span
      className={[
        'inline-flex max-w-full items-center gap-1.5 rounded-sm font-medium',
        size === 'sm' ? 'px-1.5 py-px text-2xs' : 'px-2 py-0.5 text-2xs',
        meta.badge,
        className,
      ].join(' ')}
      title={meta.blurb}
    >
      <span aria-hidden="true" className="font-mono leading-none opacity-80">
        {meta.glyph}
      </span>
      {/* Below sm the label would truncate to nonsense, so the badge goes
          glyph-only and the text stays available to screen readers. */}
      <span className={size === 'sm' ? 'truncate' : 'hidden truncate sm:inline'}>
        {meta.label}
      </span>
      {size !== 'sm' && <span className="sr-only sm:hidden">{meta.label}</span>}
    </span>
  )
}
