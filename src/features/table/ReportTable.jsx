import { useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  COLUMNS,
  ROW_HEIGHT_DENSE,
  ROW_HEIGHT_STACKED,
  SINGLE_LINE_QUERY,
} from './columns.js'
import TableHeaderCell from './TableHeaderCell.jsx'
import ReportRow from './ReportRow.jsx'
import TableEmptyState from './TableEmptyState.jsx'
import { useMediaQuery } from '../../lib/useMediaQuery.js'

/**
 * Virtualized report table.
 *
 * A real <table> with `table-fixed`, so column widths come from the header and
 * never from the content — a 66-character vendor cannot move the amount
 * columns. Virtualization is done with two spacer rows rather than absolute
 * positioning, which keeps the table semantics (and the sticky header) intact
 * while rendering only what is on screen. 500 rows costs the same as 20.
 */
export default function ReportTable({
  rows,
  currency,
  sort,
  onSort,
  selectedId,
  onOpenRow,
  filtered,
  onClearFilters,
}) {
  const scrollRef = useRef(null)

  // Below xl, hidden columns fold into a second line and rows get taller.
  const singleLine = useMediaQuery(SINGLE_LINE_QUERY)
  const rowHeight = singleLine ? ROW_HEIGHT_DENSE : ROW_HEIGHT_STACKED

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
    getItemKey: (i) => rows[i]?.id ?? i,
  })

  // Row height changes at the breakpoint; the virtualizer has to be told.
  useEffect(() => {
    virtualizer.measure()
  }, [rowHeight, virtualizer])

  // Keep the selected row on screen when the drawer walks with arrow keys.
  useEffect(() => {
    if (!selectedId) return
    const index = rows.findIndex((r) => r.id === selectedId)
    if (index >= 0) virtualizer.scrollToIndex(index, { align: 'auto' })
  }, [selectedId, rows, virtualizer])

  const items = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const padTop = items.length > 0 ? items[0].start : 0
  const padBottom =
    items.length > 0 ? totalSize - items[items.length - 1].end : 0

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden border border-line bg-base"
    >
      <table
        className="w-full table-fixed border-collapse"
        aria-rowcount={rows.length + 1}
      >
        <thead className="sticky top-0 z-10">
          <tr aria-rowindex={1}>
            {COLUMNS.map((col) => (
              <TableHeaderCell
                key={col.key}
                col={col}
                sort={sort}
                onSort={onSort}
              />
            ))}
          </tr>
        </thead>

        <tbody>
          {padTop > 0 && (
            <tr aria-hidden="true" style={{ height: padTop }}>
              <td colSpan={COLUMNS.length} className="p-0" />
            </tr>
          )}

          {items.map((item) => {
            const row = rows[item.index]
            if (!row) return null
            return (
              <ReportRow
                key={row.id}
                row={row}
                index={item.index}
                currency={currency}
                height={rowHeight}
                selected={row.id === selectedId}
                onOpen={onOpenRow}
              />
            )
          })}

          {padBottom > 0 && (
            <tr aria-hidden="true" style={{ height: padBottom }}>
              <td colSpan={COLUMNS.length} className="p-0" />
            </tr>
          )}
        </tbody>
      </table>

      {rows.length === 0 && (
        <TableEmptyState filtered={filtered} onClear={onClearFilters} />
      )}
    </div>
  )
}
