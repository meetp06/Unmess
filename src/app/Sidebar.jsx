import { NavLink } from 'react-router-dom'

const NAV = [
  {
    to: '/',
    label: 'Dashboard',
    end: true,
    icon: (
      <>
        <rect x="2.5" y="2.5" width="5" height="5" rx="1" />
        <rect x="10.5" y="2.5" width="5" height="5" rx="1" />
        <rect x="2.5" y="10.5" width="5" height="5" rx="1" />
        <rect x="10.5" y="10.5" width="5" height="5" rx="1" />
      </>
    ),
  },
  {
    to: '/uploads',
    label: 'Uploads',
    icon: (
      <>
        <path d="M9 13V4.5" />
        <path d="M5.5 8 9 4.5 12.5 8" />
        <path d="M3 12.5v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" />
      </>
    ),
  },
  {
    to: '/report',
    label: 'Reconciliation Report',
    icon: (
      <>
        <rect x="2.5" y="2.5" width="13" height="13" rx="1" />
        <path d="M2.5 6.5h13M7 6.5v9" />
      </>
    ),
  },
]

function NavIcon({ children }) {
  return (
    <svg
      viewBox="0 0 18 18"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/**
 * `expanded` forces labels on regardless of viewport — used by the mobile
 * drawer, which has the room for them even though the viewport is narrow.
 */
export default function Sidebar({ expanded = false, onNavigate }) {
  const labelClass = expanded ? 'block truncate' : 'hidden truncate lg:block'

  return (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex h-12 shrink-0 items-center border-b border-line px-4 lg:px-5">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-line-strong font-mono text-2xs font-semibold text-ink"
          aria-hidden="true"
        >
          MO
        </span>
        <span className={`ml-2.5 text-sm font-semibold tracking-tight text-ink ${labelClass}`}>
          Messy Ops Reconciler
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-label="Primary">
        <ul className="space-y-0.5 px-2">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                title={item.label}
                className={({ isActive }) =>
                  [
                    'group relative flex items-center gap-2.5 rounded-sm py-2 text-sm transition-colors',
                    expanded ? 'px-3' : 'justify-center px-0 lg:justify-start lg:px-3',
                    isActive
                      ? 'bg-hover text-ink'
                      : 'text-ink-dim hover:bg-raised hover:text-ink',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active marker stays readable on the icon-only rail. */}
                    <span
                      aria-hidden="true"
                      className={[
                        'absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r',
                        isActive ? 'bg-focus' : 'bg-transparent',
                      ].join(' ')}
                    />
                    <NavIcon>{item.icon}</NavIcon>
                    <span className={labelClass}>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`shrink-0 border-t border-line px-5 py-3 ${expanded ? '' : 'hidden lg:block'}`}>
        <p className="text-2xs leading-relaxed text-ink-faint">
          Reconciles a bank statement against OCR&apos;d receipts.
        </p>
      </div>
    </div>
  )
}
