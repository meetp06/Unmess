import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRecon } from '../state/useRecon.js'
import { PHASE } from '../state/ReconContext.jsx'
import SummaryCards from '../features/summary/SummaryCards.jsx'
import StatusBadge from '../features/table/StatusBadge.jsx'
import ErrorPanel from '../components/ErrorPanel.jsx'
import EmptyState from '../components/EmptyState.jsx'
import SkeletonTable from '../components/Skeleton.jsx'
import { money, signedMoney, orDash, count } from '../lib/format.js'
import { amountDelta } from '../lib/row.js'
import { triageWeight } from '../lib/status.js'

/**
 * Triage overview. Deliberately shows only the rows a person has to act on —
 * needs_review first, then discrepancies. Matched rows are not listed here at
 * all; they are the least interesting thing in the report and they belong in
 * the table, not on the page whose job is "what needs me".
 */
export default function DashboardPage() {
  const { report, phase, error, busy, retry, dismissError, csv, receipts } = useRecon()
  const navigate = useNavigate()

  const attention = useMemo(() => {
    if (!report?.rows) return []
    return report.rows
      .filter((r) => r.status === 'needs_review' || r.status === 'discrepancy')
      .sort((a, b) => {
        const t = triageWeight(a.status) - triageWeight(b.status)
        if (t !== 0) return t
        return Math.abs(amountDelta(b) ?? 0) - Math.abs(amountDelta(a) ?? 0)
      })
  }, [report])

  if (phase === PHASE.error && !report) {
    return (
      <div className="p-4 sm:p-5">
        <ErrorPanel error={error} onRetry={retry} busy={busy} />
      </div>
    )
  }

  if (busy && !report) {
    return (
      <div className="space-y-3 p-4 sm:p-5">
        <SkeletonTable rows={6} />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="p-4 sm:p-5">
        <EmptyState
          title="Nothing reconciled yet"
          body={
            csv || receipts.length
              ? 'Files are staged. Press “Run reconciliation” in the header when you are ready.'
              : 'Upload a bank statement CSV and the matching receipt images, then run the reconciliation.'
          }
          actionLabel="Go to uploads"
          actionTo="/uploads"
        />
      </div>
    )
  }

  // A live backend could return a report with no rows array at all; the page
  // should show an empty report, not crash.
  const rows = Array.isArray(report.rows) ? report.rows : []
  const currency = report.summary?.currency
  const matchedPairs = rows.filter((r) => r.receipt).length

  return (
    <div className="space-y-4 p-4 sm:p-5">
      {error && (
        <ErrorPanel error={error} onRetry={retry} onDismiss={dismissError} busy={busy} />
      )}

      <SummaryCards
        summary={report.summary}
        activeStatus={null}
        onSelectStatus={(status) =>
          navigate(status ? `/report?status=${status}` : '/report')
        }
        rowsCounted={matchedPairs}
      />

      <section className="rounded-sm border border-line bg-surface">
        <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
          <div className="min-w-0">
            <h2 className="text-xs font-medium text-ink">Needs a person</h2>
            <p className="mt-0.5 text-2xs text-ink-faint">
              Uncertain rows first, then confident findings. Matched rows are not
              listed.
            </p>
          </div>
          <Link
            to="/report"
            className="shrink-0 whitespace-nowrap text-2xs text-focus hover:underline"
          >
            Full report →
          </Link>
        </header>

        {attention.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-ink-dim">
            Nothing needs review. Every transaction either matched or is waiting
            on a receipt.
          </p>
        ) : (
          <ul className="divide-y divide-line/60">
            {attention.slice(0, 12).map((row) => {
              const delta = amountDelta(row)
              const review = row.status === 'needs_review'
              return (
                <li key={row.id}>
                  <Link
                    to={`/report?status=${row.status}`}
                    className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-raised"
                  >
                    <StatusBadge status={row.status} />
                    <span
                      className="min-w-0 flex-1 truncate text-xs text-ink"
                      title={row.csv.vendor}
                    >
                      {orDash(row.csv.vendor)}
                    </span>
                    <span className="hidden shrink-0 font-mono text-2xs text-ink-faint sm:inline">
                      {orDash(row.csv.date)}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular text-ink-dim">
                      {money(row.csv.amount, currency)}
                    </span>
                    <span
                      className={[
                        'w-20 shrink-0 text-right font-mono text-xs tabular',
                        delta === null || delta === 0
                          ? 'text-ink-faint'
                          : review
                            ? 'text-warn'
                            : 'text-bad',
                      ].join(' ')}
                    >
                      {delta === null ? '—' : signedMoney(delta, currency)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {attention.length > 12 && (
          <div className="border-t border-line px-3 py-2 text-2xs text-ink-faint">
            Showing 12 of {count(attention.length)} rows that need attention.{' '}
            <Link to="/report" className="text-focus hover:underline">
              See all
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
