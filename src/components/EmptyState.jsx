import { Link } from 'react-router-dom'
import Button from './Button.jsx'

/** Used when nothing has been reconciled yet — points at the next action. */
export default function EmptyState({ title, body, actionLabel, actionTo, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-line px-6 py-16 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {body && <p className="max-w-md text-xs leading-relaxed text-ink-dim">{body}</p>}
      {actionTo && (
        <Link to={actionTo}>
          <Button variant="secondary" size="sm">
            {actionLabel}
          </Button>
        </Link>
      )}
      {children}
    </div>
  )
}
