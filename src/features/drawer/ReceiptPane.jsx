import { useEffect, useState } from 'react'
import { EM_DASH } from '../../lib/format.js'

/**
 * The receipt image, with click-to-zoom. Three states, all of them handled:
 * an image, a `receipt: null` row (an empty state, never a broken image), and
 * an image that fails to load (a labelled placeholder naming the file).
 */
export default function ReceiptPane({ receipt, status }) {
  const [zoomed, setZoomed] = useState(false)
  const [broken, setBroken] = useState(false)

  const src = receipt?.image_url ?? null

  useEffect(() => {
    setBroken(false)
    setZoomed(false)
  }, [src])

  useEffect(() => {
    if (!zoomed) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation() // close the zoom, not the whole drawer
        setZoomed(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [zoomed])

  /* --- no receipt at all: the contract allows null, so say so plainly ----- */
  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-line bg-surface px-6 py-12 text-center">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong font-mono text-sm text-ink-faint"
        >
          ∅
        </span>
        <p className="text-sm font-medium text-ink">No receipt was matched</p>
        <p className="max-w-xs text-xs leading-relaxed text-ink-dim">
          {status === 'missing_receipt'
            ? 'Nothing in the uploaded receipts corresponds to this transaction. Either it was never submitted, or it is filed under a different vendor.'
            : 'This transaction has no receipt attached, so there is nothing to compare against.'}
        </p>
      </div>
    )
  }

  /* --- image present but unloadable: name the file, do not show a broken icon */
  if (broken) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-sm border border-line bg-surface px-6 py-12 text-center">
        <p className="text-sm font-medium text-ink">Receipt image unavailable</p>
        <p className="font-mono text-2xs text-ink-dim">{receipt.filename ?? EM_DASH}</p>
        <p className="max-w-xs text-xs leading-relaxed text-ink-faint">
          The extracted values below are still valid — only the scan could not be
          loaded from {src}.
        </p>
      </div>
    )
  }

  return (
    <>
      <figure className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          title="Click to zoom"
          className="group relative block w-full overflow-hidden rounded-sm border border-line bg-white/[0.03]"
        >
          <img
            src={src}
            alt={`Receipt from ${receipt.vendor ?? 'unknown vendor'}`}
            onError={() => setBroken(true)}
            className="mx-auto max-h-[340px] w-auto max-w-full object-contain"
          />
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded-sm border border-line-strong bg-base/85 px-1.5 py-0.5 text-2xs text-ink-dim opacity-0 transition-opacity group-hover:opacity-100">
            Click to zoom
          </span>
        </button>
        <figcaption className="flex items-center justify-between gap-2 font-mono text-2xs text-ink-faint">
          <span className="truncate" title={receipt.filename}>
            {receipt.filename ?? EM_DASH}
          </span>
        </figcaption>
      </figure>

      {zoomed && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed receipt"
        >
          <img
            src={src}
            alt={`Receipt from ${receipt.vendor ?? 'unknown vendor'}, enlarged`}
            className="max-h-full max-w-full object-contain"
          />
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-sm border border-line-strong bg-base text-ink-dim hover:text-ink"
            aria-label="Close zoom"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
