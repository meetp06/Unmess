import SummaryCard from './SummaryCard.jsx'
import VarianceStat from './VarianceStat.jsx'
import { STATUSES } from '../../lib/status.js'

/**
 * The four counts plus the variance. Clicking a card toggles the table filter,
 * so the summary is a control surface rather than decoration.
 */
export default function SummaryCards({
  summary,
  activeStatus,
  onSelectStatus,
  rowsCounted,
}) {
  if (!summary) return null

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6">
      {STATUSES.map((status) => (
        <SummaryCard
          key={status}
          status={status}
          value={summary[status]}
          active={activeStatus === status}
          onClick={() => onSelectStatus(activeStatus === status ? null : status)}
        />
      ))}

      <div className="col-span-2 sm:col-span-4 xl:col-span-2">
        <VarianceStat
          value={summary.total_variance}
          currency={summary.currency}
          rowsCounted={rowsCounted}
        />
      </div>
    </div>
  )
}
