import { signedMoney } from '../../lib/format.js'

/**
 * Total variance, rendered large and signed. Colour states direction, not
 * severity: money missing against the statement is red, money over is green,
 * dead-on is neutral. A signed zero would be misleading, so zero is plain.
 */
export default function VarianceStat({ value, currency, rowsCounted }) {
  const v = typeof value === 'number' ? value : 0
  const tone = v < 0 ? 'text-bad' : v > 0 ? 'text-ok' : 'text-ink'

  return (
    <div className="flex min-w-0 flex-col justify-center gap-1 rounded-sm border border-line bg-surface px-4 py-2.5">
      <span className="label-eyebrow">Total variance</span>
      <span className={`font-mono text-2xl tabular leading-none ${tone}`}>
        {signedMoney(v, currency)}
      </span>
      <span className="text-2xs text-ink-faint">
        {v === 0
          ? 'Receipts agree with the statement'
          : v < 0
            ? 'Receipts total less than the statement'
            : 'Receipts total more than the statement'}
        {typeof rowsCounted === 'number' && ` · ${rowsCounted} matched pairs`}
      </span>
    </div>
  )
}
