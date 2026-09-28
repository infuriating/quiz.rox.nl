import { cn } from '~/lib/cn'

/** How many players picked an option. Correct = status-success, otherwise the neutral fill. */
export function DistributionBar({
  count,
  total,
  correct,
  variant = 'row',
  size = 'beamer',
}: {
  count: number
  total: number
  correct: boolean
  variant?: 'row' | 'column'
  size?: 'beamer' | 'admin'
}) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100)
  const fill = correct ? 'bg-success' : size === 'admin' ? 'bg-ink-25' : 'bg-host-bar-fill'
  if (variant === 'column') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-end gap-3">
        <span className="tabular font-display text-beamer-h2 font-bold leading-none text-host-text">{count}</span>
        <div className={cn('w-full rounded-t-md rounded-b-[4px]', fill)} style={{ height: `${pct}%` }} />
      </div>
    )
  }
  if (size === 'admin') {
    return (
      <span className="block h-2.5 overflow-hidden rounded-pill bg-ink-10" role="presentation">
        <span className={cn('block h-full rounded-pill', fill)} style={{ width: `${pct}%` }} />
      </span>
    )
  }
  return (
    <div className="mt-4 flex items-center gap-5">
      <div className="h-4 flex-1 overflow-hidden rounded-pill bg-host-bar-track">
        <div className={cn('h-full rounded-pill', fill)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular min-w-14 text-right font-display text-beamer-option font-bold text-host-text">{count}</span>
    </div>
  )
}
