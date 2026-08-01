import { useMemo } from 'react'
import { comparatorFor, DEFAULT_SORT } from './columns.js'
import { searchHaystack } from '../../lib/row.js'
import { isKnownStatus } from '../../lib/status.js'

/**
 * filter → search → sort, memoised. Pure derivation, no state of its own:
 * status and query come from the URL so a filtered view is shareable, and the
 * drawer's arrow-key navigation walks exactly this list.
 */
export function useTableModel(rows, { status, query, sort = DEFAULT_SORT }) {
  const activeStatus = isKnownStatus(status) ? status : null
  const needle = (query ?? '').trim().toLowerCase()

  return useMemo(() => {
    const source = Array.isArray(rows) ? rows : []

    let out = activeStatus
      ? source.filter((r) => r.status === activeStatus)
      : source

    if (needle) {
      out = out.filter((r) => searchHaystack(r).includes(needle))
    }

    // Copy before sorting: the report object belongs to the caller.
    out = out.slice().sort(comparatorFor(sort.key, sort.dir))

    return {
      rows: out,
      total: source.length,
      shown: out.length,
      filtered: Boolean(activeStatus) || Boolean(needle),
      activeStatus,
    }
  }, [rows, activeStatus, needle, sort.key, sort.dir])
}
