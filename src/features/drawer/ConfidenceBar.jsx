import { ratio, pct } from '../../lib/format.js'

/**
 * Match confidence and OCR confidence are different measurements and are shown
 * separately, never merged into one "confidence" number. Match confidence says
 * "this receipt belongs to this transaction". OCR confidence says "these are
 * the characters printed on the paper". A high score on one tells you nothing
 * about the other, and conflating them is how a wrong number gets trusted.
 */
export default function ConfidenceBar({ label, value, hint, lowBelow = 0.65 }) {
  const has = typeof value === 'number' && Number.isFinite(value)
  const v = has ? Math.max(0, Math.min(1, value)) : 0
  const low = has && value < lowBelow

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="label-eyebrow">{label}</span>
        <span
          className={`font-mono text-xs tabular ${low ? 'text-warn' : 'text-ink'}`}
        >
          {has ? `${ratio(value)} · ${pct(value)}` : '—'}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-raised">
        <div
          className={`h-full rounded-full ${low ? 'bg-warn' : 'bg-ok'}`}
          style={{ width: `${v * 100}%` }}
        />
      </div>

      {(hint || low) && (
        <p className={`text-2xs leading-relaxed ${low ? 'text-warn' : 'text-ink-faint'}`}>
          {low ? `Below the threshold this UI treats as reliable (${lowBelow.toFixed(2)}). ` : ''}
          {hint}
        </p>
      )}
    </div>
  )
}
