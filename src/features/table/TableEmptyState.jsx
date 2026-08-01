import Button from '../../components/Button.jsx'

/**
 * "No results for this filter" and "nothing has run yet" are different problems
 * with different fixes, so they get different empty states.
 */
export default function TableEmptyState({ filtered, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-sm text-ink-dim">
        {filtered
          ? 'No transactions match the current filter.'
          : 'This report has no transactions.'}
      </p>
      {filtered && (
        <Button variant="secondary" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
