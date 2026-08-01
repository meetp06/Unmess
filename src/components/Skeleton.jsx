/** Loading placeholder shaped like the table it replaces. */
export default function SkeletonTable({ rows = 12 }) {
  return (
    <div className="border border-line">
      <div className="h-8 border-b border-line bg-surface" />
      <div className="divide-y divide-line/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex h-8 items-center gap-4 px-3">
            <div
              className="h-2 animate-pulse rounded-sm bg-raised"
              style={{ width: `${18 + ((i * 7) % 22)}%`, animationDelay: `${i * 40}ms` }}
            />
            <div
              className="h-2 flex-1 animate-pulse rounded-sm bg-raised/70"
              style={{ animationDelay: `${i * 40 + 80}ms` }}
            />
            <div
              className="h-2 w-16 animate-pulse rounded-sm bg-raised"
              style={{ animationDelay: `${i * 40 + 120}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
