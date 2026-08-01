import { STATUSES, statusMeta } from '../../lib/status.js'
import { count } from '../../lib/format.js'

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" strokeLinecap="round" />
    </svg>
  )
}

export default function TableToolbar({
  query,
  onQuery,
  status,
  onStatus,
  shown,
  total,
  sortLabel,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-b-0 border-line bg-surface px-3 py-2">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search vendors or transaction ID"
          aria-label="Search vendors or transaction ID"
          className="h-8 w-full rounded-sm border border-line bg-raised pl-8 pr-2.5 text-xs text-ink placeholder:text-ink-faint focus:border-line-strong"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter by status">
        <button
          type="button"
          onClick={() => onStatus(null)}
          aria-pressed={!status}
          className={[
            'h-7 rounded-sm border px-2.5 text-2xs transition-colors',
            !status
              ? 'border-line-strong bg-hover text-ink'
              : 'border-line bg-transparent text-ink-dim hover:bg-raised hover:text-ink',
          ].join(' ')}
        >
          All
        </button>
        {STATUSES.map((key) => {
          const meta = statusMeta(key)
          const active = status === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onStatus(active ? null : key)}
              aria-pressed={active}
              title={meta.blurb}
              className={[
                'inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5 text-2xs transition-colors',
                active
                  ? `${meta.badge} border`
                  : 'border-line bg-transparent text-ink-dim hover:bg-raised hover:text-ink',
              ].join(' ')}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
                aria-hidden="true"
              />
              {meta.label}
            </button>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-3 whitespace-nowrap text-2xs text-ink-faint">
        <span className="hidden lg:inline">Sorted by {sortLabel}</span>
        <span className="tabular">
          {shown === total
            ? `${count(total)} rows`
            : `${count(shown)} of ${count(total)} rows`}
        </span>
      </div>
    </div>
  )
}
