import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import StatusBadge from '../table/StatusBadge.jsx'
import ReceiptPane from './ReceiptPane.jsx'
import NeedsReviewNote from './NeedsReviewNote.jsx'
import FieldComparison from './FieldComparison.jsx'
import ConfidenceBar from './ConfidenceBar.jsx'
import LineItems from './LineItems.jsx'
import { statusMeta } from '../../lib/status.js'
import { longDate, orDash } from '../../lib/format.js'

/**
 * Right-side details drawer.
 *
 * Closes on Escape, on a backdrop click, and on the X button. Arrow Up/Down
 * move to the previous/next row *without* closing, walking the same filtered
 * and sorted list the table is showing — so paging through everything that
 * needs attention never means going back to the table between rows.
 */
export default function DetailsDrawer({
  rows,
  selectedId,
  currency,
  onSelect,
  onClose,
}) {
  const panelRef = useRef(null)
  const restoreFocusRef = useRef(null)

  const index = useMemo(
    () => rows.findIndex((r) => r.id === selectedId),
    [rows, selectedId],
  )
  const row = index >= 0 ? rows[index] : null
  const open = Boolean(row)

  const step = useCallback(
    (delta) => {
      if (index < 0) return
      const next = index + delta
      if (next < 0 || next >= rows.length) return
      onSelect(rows[next].id)
    },
    [index, rows, onSelect],
  )

  // Remember what was focused so Escape can hand focus back to the row.
  useEffect(() => {
    if (open && !restoreFocusRef.current) {
      restoreFocusRef.current = document.activeElement
    }
    if (!open && restoreFocusRef.current) {
      const el = restoreFocusRef.current
      restoreFocusRef.current = null
      if (el instanceof HTMLElement && document.contains(el)) el.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        step(1)
        return
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        step(-1)
        return
      }
      // Keep Tab inside the panel while it is open.
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, step])

  // Move focus into the panel when it opens, but not on every arrow-key step.
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!open) return null

  const meta = statusMeta(row.status)
  const r = row.receipt
  const review = row.status === 'needs_review'

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/55"
      />

      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Transaction ${row.csv.transaction_id ?? row.id}`}
        className="relative flex h-full w-full max-w-[560px] flex-col border-l border-line bg-base shadow-2xl outline-none"
      >
        {/* header */}
        <header
          className={`flex shrink-0 items-start gap-3 border-b border-line bg-surface px-4 py-3 ${meta.marker} border-l-4`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={row.status} />
              <span className="font-mono text-2xs text-ink-faint">
                {orDash(row.csv.transaction_id)}
              </span>
            </div>
            <h2
              className="mt-1.5 break-words text-sm font-medium text-ink"
              title={row.csv.vendor}
            >
              {orDash(row.csv.vendor)}
            </h2>
            <p className="mt-0.5 text-2xs text-ink-dim">{longDate(row.csv.date)}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={index <= 0}
              aria-label="Previous transaction"
              title="Previous (↑)"
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-line text-ink-dim hover:bg-raised hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={index >= rows.length - 1}
              aria-label="Next transaction"
              title="Next (↓)"
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-line text-ink-dim hover:bg-raised hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              title="Close (Esc)"
              className="ml-1 flex h-7 w-7 items-center justify-center rounded-sm border border-line text-ink-dim hover:bg-raised hover:text-ink"
            >
              ✕
            </button>
          </div>
        </header>

        {/* body */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {/* For an uncertain row, the caveat comes before any numbers. */}
          <NeedsReviewNote row={row} />

          <ReceiptPane receipt={r} status={row.status} />

          <FieldComparison row={row} currency={currency} />

          {/* Two confidences, side by side and clearly separate. */}
          <section className="grid grid-cols-1 gap-3 rounded-sm border border-line bg-surface p-3 sm:grid-cols-2">
            <ConfidenceBar
              label="Match confidence"
              value={row.confidence}
              hint="How sure the matcher is that this receipt belongs to this transaction."
            />
            <ConfidenceBar
              label="OCR confidence"
              value={r ? r.ocr_confidence : null}
              hint={
                r
                  ? 'How cleanly the text was read off the scan. Separate from the match — a perfect read can still be the wrong receipt.'
                  : 'No receipt was scanned for this transaction.'
              }
            />
          </section>

          {/* The plain-text reason, verbatim from the backend. */}
          <section
            className={[
              'rounded-sm border p-3',
              review ? 'border-dashed border-warn/45 bg-warn-soft' : 'border-line bg-surface',
            ].join(' ')}
          >
            <h3 className="label-eyebrow mb-1">Reason given</h3>
            <p className={`text-xs leading-relaxed ${review ? 'text-warn' : 'text-ink-dim'}`}>
              {orDash(row.reason)}
            </p>
          </section>

          {r && (
            <LineItems
              items={r.line_items}
              receiptTotal={r.amount}
              currency={currency}
            />
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line bg-surface px-4 py-2 text-2xs text-ink-faint">
          <span className="tabular">
            Row {index + 1} of {rows.length}
          </span>
          <span className="hidden sm:inline">↑ ↓ to move · Esc to close</span>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
