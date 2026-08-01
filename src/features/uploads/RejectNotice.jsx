/**
 * Inline rejection message. Names the offending file and says what was wrong
 * with it. Never an alert(), and never a silent no-op — a drop that appears to
 * do nothing is the worst possible outcome.
 */
export default function RejectNotice({ rejects, expected, onDismiss }) {
  if (!rejects || rejects.length === 0) return null

  return (
    <div
      role="alert"
      className="mt-2 rounded-sm border border-bad/40 bg-bad-soft px-3 py-2"
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-bad/60 font-mono text-2xs text-bad"
        >
          !
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-bad">
            {rejects.length === 1
              ? '1 file was not added'
              : `${rejects.length} files were not added`}
          </p>
          <ul className="mt-1 space-y-0.5">
            {rejects.slice(0, 5).map((r, i) => (
              <li key={i} className="break-all font-mono text-2xs text-ink-dim">
                {r.file?.name ?? 'unnamed file'}
                <span className="text-ink-faint">
                  {' — '}
                  {r.extra
                    ? 'only one statement can be attached'
                    : `${r.type} file, expected ${expected}`}
                </span>
              </li>
            ))}
          </ul>
          {rejects.length > 5 && (
            <p className="mt-1 text-2xs text-ink-faint">
              …and {rejects.length - 5} more.
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-sm px-1 text-2xs text-ink-faint hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
