import { useNavigate } from 'react-router-dom'
import { useRecon } from '../state/useRecon.js'
import { USE_MOCKS, dataSourceLabel } from '../services/env.js'
import Button from '../components/Button.jsx'
import Tooltip from '../components/Tooltip.jsx'

function Spinner() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3 w-3 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" className="opacity-25" />
      <path d="M14 8a6 6 0 0 0-6-6" strokeLinecap="round" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 5h12M3 9h12M3 13h12" />
    </svg>
  )
}

export default function Header({ onOpenNav }) {
  const { canRun, busy, blockers, run, step } = useRecon()
  const navigate = useNavigate()

  // Spelled out in the user's words, not "requirements not met".
  const disabledReason =
    blockers.length > 0
      ? `Add ${blockers.join(' and ')} before running.`
      : busy
        ? 'Reconciliation already in progress.'
        : null

  async function handleRun() {
    await run()
    navigate('/report')
  }

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-5">
      <button
        type="button"
        onClick={onOpenNav}
        className="-ml-1 flex h-8 w-8 items-center justify-center rounded-sm text-ink-dim hover:bg-raised hover:text-ink md:hidden"
        aria-label="Open navigation"
      >
        <MenuIcon />
      </button>

      <h1 className="truncate text-sm font-semibold tracking-tight text-ink">
        Reconciliation workspace
      </h1>

      {USE_MOCKS && (
        <span
          title={`Data source: ${dataSourceLabel()}`}
          className="hidden shrink-0 items-center gap-1.5 rounded-sm border border-warn/45 bg-warn-soft px-2 py-0.5 font-mono text-2xs uppercase tracking-wide text-warn sm:inline-flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden="true" />
          Mock data
        </span>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-3">
        {busy && step && (
          <span className="hidden items-center gap-2 text-2xs text-ink-dim lg:flex">
            <Spinner />
            {step}…
          </span>
        )}

        <Tooltip content={disabledReason}>
          <Button variant="primary" onClick={handleRun} disabled={!canRun}>
            {busy ? (
              <>
                <Spinner />
                Running…
              </>
            ) : (
              'Run reconciliation'
            )}
          </Button>
        </Tooltip>
      </div>
    </header>
  )
}
