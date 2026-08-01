import { visibilityClass } from './columns.js'

function SortArrow({ dir, active }) {
  return (
    <svg
      viewBox="0 0 10 12"
      className={[
        'h-2.5 w-2.5 shrink-0 transition-opacity',
        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
      ].join(' ')}
      fill="currentColor"
      aria-hidden="true"
    >
      {dir === 'desc' ? <path d="M5 12 1 6h8z" /> : <path d="M5 0 9 6H1z" />}
    </svg>
  )
}

export default function TableHeaderCell({ col, sort, onSort }) {
  const active = sort.key === col.key
  const dir = active ? sort.dir : col.numeric ? 'desc' : 'asc'

  return (
    <th
      scope="col"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={[
        visibilityClass(col),
        col.widthClass ?? '',
        'border-b border-line bg-surface p-0 font-normal',
        col.align === 'right' ? 'text-right' : 'text-left',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => onSort(col.key)}
        title={`Sort by ${col.label}`}
        className={[
          'group flex h-8 w-full items-center gap-1 px-3 text-2xs uppercase tracking-[0.08em] transition-colors',
          col.align === 'right' ? 'justify-end' : 'justify-start',
          active ? 'text-ink' : 'text-ink-dim hover:text-ink',
        ].join(' ')}
      >
        {col.align === 'right' && <SortArrow dir={dir} active={active} />}
        <span className="truncate">{col.label}</span>
        {col.align !== 'right' && <SortArrow dir={dir} active={active} />}
      </button>
    </th>
  )
}
