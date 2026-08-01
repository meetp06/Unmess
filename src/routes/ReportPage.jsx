import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRecon } from '../state/useRecon.js'
import { PHASE } from '../state/ReconContext.jsx'
import SummaryCards from '../features/summary/SummaryCards.jsx'
import TableToolbar from '../features/table/TableToolbar.jsx'
import ReportTable from '../features/table/ReportTable.jsx'
import DetailsDrawer from '../features/drawer/DetailsDrawer.jsx'
import { useTableModel } from '../features/table/useTableModel.js'
import { COLUMN_BY_KEY, DEFAULT_SORT } from '../features/table/columns.js'
import ErrorPanel from '../components/ErrorPanel.jsx'
import EmptyState from '../components/EmptyState.jsx'
import SkeletonTable from '../components/Skeleton.jsx'
import { USE_MOCKS } from '../services/env.js'

export default function ReportPage() {
  const { report, phase, error, busy, retry, dismissError } = useRecon()
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState(DEFAULT_SORT)
  const [selectedId, setSelectedId] = useState(null)

  // Filter and search live in the URL, so a filtered view can be pasted to a
  // colleague and lands exactly as it looked.
  const status = params.get('status')
  const query = params.get('q') ?? ''

  const setParam = useCallback(
    (key, value) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set(key, value)
          else next.delete(key)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const model = useTableModel(report?.rows, { status, query, sort })

  const onSort = useCallback((key) => {
    setSort((prev) => {
      if (prev.key !== key) {
        // Numeric columns are most useful largest-first on the first click.
        return { key, dir: COLUMN_BY_KEY[key]?.numeric ? 'desc' : 'asc' }
      }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      // Third click returns to triage order rather than leaving no sort at all.
      return DEFAULT_SORT
    })
  }, [])

  const sortLabel = useMemo(() => {
    if (sort.key === 'triage') return 'review priority'
    const col = COLUMN_BY_KEY[sort.key]
    return col ? `${col.label.toLowerCase()} (${sort.dir})` : 'review priority'
  }, [sort])

  const matchedPairs = useMemo(
    () => (report?.rows ?? []).filter((r) => r.receipt).length,
    [report],
  )

  const clearFilters = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('status')
        next.delete('q')
        return next
      },
      { replace: true },
    )
  }, [setParams])

  /* ---------------------------------------------------------- states ----- */

  if (phase === PHASE.error && !report) {
    return (
      <div className="p-4 sm:p-5">
        <ErrorPanel error={error} onRetry={retry} busy={busy} />
      </div>
    )
  }

  if (busy && !report) {
    return (
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[62px] animate-pulse rounded-sm border border-line bg-surface" />
          ))}
          <div className="col-span-2 h-[62px] animate-pulse rounded-sm border border-line bg-surface sm:col-span-4 xl:col-span-2" />
        </div>
        <SkeletonTable />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="p-4 sm:p-5">
        <EmptyState
          title="No reconciliation has been run yet"
          body={
            USE_MOCKS
              ? 'Add a bank statement and at least one receipt on the Uploads page, then press “Run reconciliation”. Mock mode can load a sample set for you.'
              : 'Add a bank statement and at least one receipt on the Uploads page, then press “Run reconciliation”.'
          }
          actionLabel="Go to uploads"
          actionTo="/uploads"
        />
      </div>
    )
  }

  return (
    // Fills the viewport below the header on a normal screen. The min-height
    // stops a short window from crushing the table to nothing — the page
    // scrolls vertically instead, which is fine; only sideways scroll is not.
    <div className="flex h-[calc(100vh-3rem)] min-h-[560px] flex-col gap-3 p-4 sm:p-5">
      {error && (
        <ErrorPanel error={error} onRetry={retry} onDismiss={dismissError} busy={busy} />
      )}

      <SummaryCards
        summary={report.summary}
        activeStatus={model.activeStatus}
        onSelectStatus={(next) => setParam('status', next)}
        rowsCounted={matchedPairs}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <TableToolbar
          query={query}
          onQuery={(v) => setParam('q', v)}
          status={model.activeStatus}
          onStatus={(v) => setParam('status', v)}
          shown={model.shown}
          total={model.total}
          sortLabel={sortLabel}
        />
        <ReportTable
          rows={model.rows}
          currency={report.summary?.currency}
          sort={sort}
          onSort={onSort}
          selectedId={selectedId}
          onOpenRow={setSelectedId}
          filtered={model.filtered}
          onClearFilters={clearFilters}
        />
      </div>

      <DetailsDrawer
        rows={model.rows}
        selectedId={selectedId}
        currency={report.summary?.currency}
        onSelect={setSelectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
