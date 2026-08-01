import { useState } from 'react'

function Thumb({ receipt, onRemove }) {
  const [broken, setBroken] = useState(false)

  return (
    <li className="group relative">
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-sm border border-line bg-raised">
        {broken ? (
          <span className="px-1 text-center font-mono text-2xs text-ink-faint">
            no preview
          </span>
        ) : (
          <img
            src={receipt.url}
            alt={receipt.name}
            loading="lazy"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <p
        className="mt-1 truncate font-mono text-2xs text-ink-faint"
        title={receipt.name}
      >
        {receipt.name}
      </p>

      <button
        type="button"
        onClick={() => onRemove(receipt.id)}
        aria-label={`Remove ${receipt.name}`}
        title={`Remove ${receipt.name}`}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-sm border border-line-strong bg-base/90 text-2xs text-ink-dim opacity-0 transition-opacity hover:border-bad/60 hover:text-bad focus-visible:opacity-100 group-hover:opacity-100"
      >
        ✕
      </button>
    </li>
  )
}

export default function ReceiptThumbGrid({ receipts, onRemove }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      {receipts.map((r) => (
        <Thumb key={r.id} receipt={r} onRemove={onRemove} />
      ))}
    </ul>
  )
}
