import { useCallback, useState } from 'react'
import CsvDropZone from '../features/uploads/CsvDropZone.jsx'
import ReceiptsDropZone from '../features/uploads/ReceiptsDropZone.jsx'
import Button from '../components/Button.jsx'
import ErrorPanel from '../components/ErrorPanel.jsx'
import { useRecon } from '../state/useRecon.js'
import { USE_MOCKS, dataSourceLabel } from '../services/env.js'
import { countCsvRows } from '../lib/csv.js'

export default function UploadsPage() {
  const { csv, receipts, blockers, error, busy, retry, dismissError, attachCsv, addReceipts } =
    useRecon()
  const [loadingSample, setLoadingSample] = useState(false)

  /**
   * Mock-mode convenience: stage the fixture statement and receipts as real
   * File objects so the demo runs through the same upload → run path as live.
   */
  const loadSample = useCallback(async () => {
    setLoadingSample(true)
    try {
      const { buildSampleCsv, buildSampleReceipts } = await import(
        '../mocks/sampleFiles.js'
      )
      const { file, text } = buildSampleCsv()
      const { rows, columns, header } = countCsvRows(text)
      attachCsv({ file, name: file.name, size: file.size, rows, columns, header })
      addReceipts(await buildSampleReceipts())
    } finally {
      setLoadingSample(false)
    }
  }, [attachCsv, addReceipts])

  return (
    <div className="space-y-4 p-4 sm:p-5">
      {error && (
        <ErrorPanel error={error} onRetry={retry} onDismiss={dismissError} busy={busy} />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-ink">Source files</h2>
          <p className="mt-0.5 text-xs text-ink-dim">
            {blockers.length === 0
              ? 'Both inputs are staged. Run the reconciliation from the header.'
              : `Still needed: ${blockers.join(' and ')}.`}
          </p>
        </div>

        {USE_MOCKS && (
          <Button variant="secondary" size="sm" onClick={loadSample} disabled={loadingSample}>
            {loadingSample ? 'Loading…' : 'Load sample files'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CsvDropZone />
        <ReceiptsDropZone />
      </div>

      <p className="text-2xs text-ink-faint">
        Data source: {dataSourceLabel()}
        {USE_MOCKS &&
          ' · files are staged locally and the fixture report is returned regardless of what you upload'}
        {csv && receipts.length > 0 && ' · ready to run'}
      </p>
    </div>
  )
}
