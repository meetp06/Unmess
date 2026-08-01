import {
  EM_DASH,
  longDate,
  money,
  orDash,
  signedDays,
  signedMoney,
} from '../../lib/format.js'
import { amountDelta, dateDelta, fieldDiffs } from '../../lib/row.js'

/**
 * CSV on the left, extracted receipt on the right. Any field that differs is
 * highlighted on *both* sides, with the delta stated in words rather than left
 * for the reader to compute: "-$12.00", "+1 day".
 */
function FieldRow({ label, csv, receipt, differs, delta, review, mono = false }) {
  const valueBase = mono ? 'font-mono text-xs tabular' : 'text-xs'
  const tone = differs
    ? review
      ? 'bg-warn-soft text-warn'
      : 'bg-bad-soft text-bad'
    : 'text-ink'

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 border-b border-line/60 py-2 last:border-b-0">
      <div className="min-w-0">
        <div className="label-eyebrow mb-0.5">{label}</div>
        <div
          className={`min-w-0 break-words rounded-sm px-1.5 py-1 ${valueBase} ${tone}`}
          title={typeof csv === 'string' ? csv : undefined}
        >
          {csv}
        </div>
      </div>

      <div className="flex h-full min-w-[64px] flex-col items-center justify-center pt-4">
        {differs && delta ? (
          <span
            className={`whitespace-nowrap rounded-sm px-1.5 py-0.5 font-mono text-2xs tabular ${
              review ? 'bg-warn-soft text-warn' : 'bg-bad-soft text-bad'
            }`}
          >
            {delta}
          </span>
        ) : (
          <span className="font-mono text-2xs text-ink-faint" aria-hidden="true">
            =
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="label-eyebrow mb-0.5 text-right">&nbsp;</div>
        <div
          className={`min-w-0 break-words rounded-sm px-1.5 py-1 text-right ${valueBase} ${tone}`}
          title={typeof receipt === 'string' ? receipt : undefined}
        >
          {receipt}
        </div>
      </div>
    </div>
  )
}

export default function FieldComparison({ row, currency }) {
  const r = row.receipt
  const diffs = fieldDiffs(row)
  const aDelta = amountDelta(row)
  const dDelta = dateDelta(row)
  const review = row.status === 'needs_review'

  return (
    <section className="rounded-sm border border-line bg-surface">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-3 py-2">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-dim">
          Bank statement
        </span>
        <span className="min-w-[64px] text-center text-2xs text-ink-faint">Δ</span>
        <span className="text-right text-2xs font-medium uppercase tracking-[0.08em] text-ink-dim">
          Extracted receipt
        </span>
      </header>

      <div className="px-3">
        <FieldRow
          label="Vendor"
          csv={orDash(row.csv.vendor)}
          receipt={r ? orDash(r.vendor) : EM_DASH}
          differs={r ? diffs.vendor : false}
          delta={diffs.vendor ? 'differs' : null}
          review={review}
        />
        <FieldRow
          label="Amount"
          mono
          csv={money(row.csv.amount, currency)}
          receipt={r ? money(r.amount, currency) : EM_DASH}
          differs={diffs.amount}
          delta={aDelta !== null ? signedMoney(aDelta, currency) : null}
          review={review}
        />
        <FieldRow
          label="Date"
          csv={longDate(row.csv.date)}
          receipt={r ? longDate(r.date) : EM_DASH}
          differs={diffs.date}
          delta={dDelta !== null ? signedDays(dDelta) : null}
          review={review}
        />
        <FieldRow
          label="Reference"
          mono
          csv={orDash(row.csv.transaction_id)}
          receipt={r ? orDash(r.filename) : EM_DASH}
          differs={false}
          delta={null}
          review={review}
        />
      </div>
    </section>
  )
}
