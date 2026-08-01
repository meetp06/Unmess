import Button from './Button.jsx'

/**
 * Shows the actual failure text. No "Something went wrong" — if the backend
 * said the amount column was missing, that is what belongs on screen, because
 * that is the sentence that tells someone what to fix.
 */
export default function ErrorPanel({ error, onRetry, onDismiss, busy }) {
  if (!error) return null

  const message =
    typeof error === 'string'
      ? error
      : (error.message ?? 'The request failed with no message.')

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-sm border border-bad/45 bg-bad-soft p-4"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          aria-hidden="true"
          className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-bad/60 font-mono text-2xs text-bad"
        >
          !
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Reconciliation failed</p>
          <p className="mt-1 break-words font-mono text-xs leading-relaxed text-ink-dim">
            {message}
          </p>
          {error?.status != null && (
            <p className="mt-1.5 font-mono text-2xs text-ink-faint">
              HTTP {error.status}
              {error.url ? ` · ${error.url}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} disabled={busy}>
            {busy ? 'Retrying…' : 'Retry'}
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  )
}
