import { DEFAULT_ROW_COUNT, makeRows } from './fixtures.js'
import { RECEIPT_IMAGES, receiptUrl } from './vendors.js'
import { MOCK_OPTIONS } from '../services/env.js'

/**
 * Real File objects built from the fixtures, so mock mode can be demoed through
 * the actual upload → run flow instead of skipping it.
 *
 * This is an explicit button the user presses, not a hidden auto-populate:
 * turning mocks on must change the data source and nothing else about how the
 * app behaves.
 */

function csvText(rows) {
  const header = 'transaction_id,date,description,amount,currency'
  const lines = rows.map((r) => {
    // Quote the vendor: real statement descriptors contain commas and quotes,
    // and this file is also what exercises the quote-aware row counter.
    const vendor = `"${String(r.csv.vendor).replace(/"/g, '""')}"`
    return `${r.csv.transaction_id},${r.csv.date},${vendor},${r.csv.amount.toFixed(2)},USD`
  })
  return [header, ...lines].join('\r\n') + '\r\n'
}

export function buildSampleCsv() {
  const rows = makeRows(MOCK_OPTIONS.rowCount ?? DEFAULT_ROW_COUNT)
  const text = csvText(rows)
  const file = new File([text], 'july-2026-statement.csv', { type: 'text/csv' })
  return { file, text }
}

/** Pulls the fixture receipt images back out of /public as File objects. */
export async function buildSampleReceipts() {
  const files = []
  for (const name of RECEIPT_IMAGES) {
    try {
      const res = await fetch(receiptUrl(name))
      if (!res.ok) continue
      const blob = await res.blob()
      files.push(new File([blob], name, { type: blob.type || 'image/svg+xml' }))
    } catch {
      // A missing sample image should not stop the rest from loading.
    }
  }
  return files
}
