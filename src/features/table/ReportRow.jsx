import { memo } from 'react'
import StatusBadge from './StatusBadge.jsx'
import { statusMeta } from '../../lib/status.js'
import { EM_DASH, money, signedMoney, orDash } from '../../lib/format.js'
import { amountDelta } from '../../lib/row.js'

/**
 * One transaction.
 *
 * Every cell tolerates `receipt: null` and prints an em dash rather than
 * "undefined". The status marker is a 2px left border on whichever cell is
 * first at the current breakpoint — solid for a confident finding, dashed for
 * a row the system could not decide.
 *
 * Columns hidden at narrow widths are not lost: their values reappear as a
 * muted second line under the columns that survive.
 */
function ReportRow({ row, index, currency, height, selected, onOpen }) {
  const meta = statusMeta(row.status)
  const r = row.receipt
  const delta = amountDelta(row)
  const review = row.status === 'needs_review'

  const cell = 'px-3 py-0 align-middle overflow-hidden'

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(row.id)
    }
  }

  return (
    <tr
      tabIndex={0}
      role="row"
      aria-rowindex={index + 2}
      style={{ height }}
      onClick={() => onOpen(row.id)}
      onKeyDown={onKeyDown}
      className={[
        'group cursor-pointer border-b border-line/60 outline-offset-[-2px] transition-colors',
        selected ? 'bg-hover' : 'bg-transparent hover:bg-raised focus:bg-raised',
      ].join(' ')}
    >
      {/* Transaction ID — the first cell at xl */}
      <td
        className={`${cell} hidden xl:table-cell ${meta.marker} border-l-0 xl:border-l-2`}
      >
        <span className="block truncate font-mono text-xs text-ink-dim">
          {orDash(row.csv.transaction_id)}
        </span>
      </td>

      {/* Date — the first cell between lg and xl */}
      <td
        className={`${cell} hidden lg:table-cell ${meta.marker} border-l-0 lg:border-l-2 xl:border-l-0`}
      >
        <span className="block truncate font-mono text-xs text-ink-dim">
          {orDash(row.csv.date)}
        </span>
      </td>

      {/* CSV vendor — the first cell below lg, and always the widest thing here */}
      <td className={`${cell} ${meta.marker} border-l-2 lg:border-l-0`}>
        <div className="flex min-w-0 flex-col justify-center leading-tight">
          <span className="truncate text-xs text-ink" title={row.csv.vendor}>
            {orDash(row.csv.vendor)}
          </span>
          {/* Stand-in for whichever columns are hidden at this width. */}
          <span className="truncate font-mono text-2xs text-ink-faint xl:hidden">
            <span className="lg:hidden">{orDash(row.csv.date)} · </span>
            {orDash(row.csv.transaction_id)}
          </span>
        </div>
      </td>

      {/* Receipt vendor */}
      <td className={`${cell} hidden md:table-cell`}>
        {r ? (
          <span className="block truncate text-xs text-ink-dim" title={r.vendor}>
            {orDash(r.vendor)}
          </span>
        ) : (
          <span className="text-xs text-ink-faint">{EM_DASH}</span>
        )}
      </td>

      {/* CSV amount */}
      <td className={`${cell} text-right`}>
        <div className="flex flex-col items-end justify-center leading-tight">
          <span className="font-mono text-xs tabular text-ink">
            {money(row.csv.amount, currency)}
          </span>
          {/* Receipt amount, folded in below md where its column is gone. */}
          <span className="font-mono text-2xs tabular text-ink-faint md:hidden">
            {r ? money(r.amount, currency) : EM_DASH}
          </span>
        </div>
      </td>

      {/* Receipt amount, plus the delta people are actually scanning for */}
      <td className={`${cell} hidden text-right md:table-cell`}>
        {r ? (
          <div className="flex flex-col items-end justify-center leading-tight">
            <span
              className={[
                'font-mono text-xs tabular',
                review ? 'text-ink-dim' : 'text-ink',
              ].join(' ')}
            >
              {/* A value the system does not trust is marked as approximate. */}
              {review && (
                <span className="mr-0.5 text-warn" title="Extracted value is not trusted">
                  ≈
                </span>
              )}
              {money(r.amount, currency)}
            </span>
            {delta !== 0 && (
              <span
                className={[
                  'font-mono text-2xs tabular',
                  review ? 'text-warn' : 'text-bad',
                ].join(' ')}
              >
                {signedMoney(delta, currency)}
              </span>
            )}
          </div>
        ) : (
          <span className="font-mono text-xs text-ink-faint">{EM_DASH}</span>
        )}
      </td>

      <td className={`${cell} py-1`}>
        <StatusBadge status={row.status} />
      </td>
    </tr>
  )
}

export default memo(ReportRow)
