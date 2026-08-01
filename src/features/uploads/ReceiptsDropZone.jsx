import { useCallback, useState } from 'react'
import UploadZone from './UploadZone.jsx'
import RejectNotice from './RejectNotice.jsx'
import ReceiptThumbGrid from './ReceiptThumbGrid.jsx'
import { useDropZone } from './useDropZone.js'
import { useRecon } from '../../state/useRecon.js'
import { isReceiptImage } from '../../lib/files.js'
import { count, formatBytes } from '../../lib/format.js'

export default function ReceiptsDropZone() {
  const { receipts, addReceipts, removeReceipt, clearReceipts } = useRecon()
  const [rejects, setRejects] = useState([])

  const onFiles = useCallback(
    ({ accepted, rejected }) => {
      setRejects(rejected)
      if (accepted.length) addReceipts(accepted)
    },
    [addReceipts],
  )

  const { dragging, dragProps, handleFiles } = useDropZone({
    accept: isReceiptImage,
    onFiles,
    multiple: true,
  })

  const totalBytes = receipts.reduce((a, r) => a + (r.size ?? 0), 0)

  return (
    <section className="flex min-w-0 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium text-ink">Receipt images</h2>
        {receipts.length > 0 && (
          <button
            type="button"
            onClick={clearReceipts}
            className="text-2xs text-ink-faint hover:text-bad"
          >
            Remove all
          </button>
        )}
      </div>

      <UploadZone
        title="Drop receipt images here"
        hint="or click to browse · .jpg and .png · multiple files"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        multiple
        dragging={dragging}
        dragProps={dragProps}
        onPick={handleFiles}
      >
        {receipts.length > 0 && (
          <div className="border-t border-line px-3 py-2.5">
            <p className="mb-2 font-mono text-2xs tabular text-ink-faint">
              {count(receipts.length)}{' '}
              {receipts.length === 1 ? 'receipt' : 'receipts'} ·{' '}
              {formatBytes(totalBytes)}
            </p>
            <ReceiptThumbGrid receipts={receipts} onRemove={removeReceipt} />
          </div>
        )}
      </UploadZone>

      <RejectNotice
        rejects={rejects}
        expected="a .jpg or .png image"
        onDismiss={() => setRejects([])}
      />
    </section>
  )
}
