import { useCallback, useState } from 'react'
import UploadZone from './UploadZone.jsx'
import RejectNotice from './RejectNotice.jsx'
import { useDropZone } from './useDropZone.js'
import { useRecon } from '../../state/useRecon.js'
import { countCsvRows, isCsvFile, readFileText } from '../../lib/csv.js'
import { formatBytes, count } from '../../lib/format.js'

export default function CsvDropZone() {
  const { csv, attachCsv, clearCsv } = useRecon()
  const [rejects, setRejects] = useState([])
  const [reading, setReading] = useState(false)

  const onFiles = useCallback(
    async ({ accepted, rejected }) => {
      setRejects(rejected)
      const file = accepted[0]
      if (!file) return

      setReading(true)
      try {
        const text = await readFileText(file)
        const { rows, columns, header } = countCsvRows(text)
        attachCsv({ file, name: file.name, size: file.size, rows, columns, header })
      } catch (err) {
        // Reading failed locally — say so here rather than at run time.
        setRejects([{ file, type: err.message }])
      } finally {
        setReading(false)
      }
    },
    [attachCsv],
  )

  const { dragging, dragProps, handleFiles } = useDropZone({
    accept: isCsvFile,
    onFiles,
    multiple: false,
  })

  return (
    <section className="flex min-w-0 flex-col">
      <h2 className="mb-2 text-xs font-medium text-ink">Bank statement</h2>

      <UploadZone
        title="Drop a CSV here"
        hint="or click to browse · .csv only · one file"
        accept=".csv,text/csv"
        dragging={dragging}
        dragProps={dragProps}
        onPick={handleFiles}
        disabled={reading}
      >
        {csv && (
          <div className="border-t border-line px-3 py-2.5">
            <div className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-ok/50 font-mono text-2xs text-ok"
              >
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-ink" title={csv.name}>
                  {csv.name}
                </p>
                <p className="mt-0.5 font-mono text-2xs tabular text-ink-faint">
                  {formatBytes(csv.size)} · {count(csv.rows)}{' '}
                  {csv.rows === 1 ? 'row' : 'rows'} · {count(csv.columns)} columns
                </p>
                {csv.header?.length > 0 && (
                  <p
                    className="mt-1 truncate font-mono text-2xs text-ink-faint"
                    title={csv.header.join(', ')}
                  >
                    {csv.header.join(', ')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearCsv}
                aria-label={`Remove ${csv.name}`}
                className="shrink-0 rounded-sm border border-line px-1.5 py-0.5 text-2xs text-ink-faint hover:border-bad/50 hover:text-bad"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {reading && (
          <div className="border-t border-line px-3 py-2 text-2xs text-ink-dim">
            Reading file…
          </div>
        )}
      </UploadZone>

      <RejectNotice
        rejects={rejects}
        expected="a .csv file"
        onDismiss={() => setRejects([])}
      />
    </section>
  )
}
