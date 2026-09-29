import { cn } from '~/lib/cn'
import { delay, useSpring } from '~/lib/motion'

/**
 * How many players picked an option. Correct = status-success, otherwise the neutral fill.
 * With `enterDelay` (seconds) the bar grows in from zero and the count springs up with it.
 */
export function DistributionBar({
  count,
  total,
  correct,
  variant = 'row',
  size = 'beamer',
  enterDelay,
}: {
  count: number
  total: number
  correct: boolean
  variant?: 'row' | 'column'
  size?: 'beamer' | 'admin'
  enterDelay?: number
}) {
  const animate = enterDelay !== undefined
  const shown = useSpring(count, {
    from: animate ? 0 : count,
    delay: (enterDelay ?? 0) * 1000,
  })
  const grow = enterDelay !== undefined ? delay(enterDelay) : undefined
  const pct = total === 0 ? 0 : Math.round((count / total) * 100)
  const fill = cn(
    'transition-colors duration-500 ease-cut',
    correct
      ? 'bg-success'
      : size === 'admin'
        ? 'bg-ink-25'
        : 'bg-host-bar-fill',
  )
  if (variant === 'column') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-end gap-3">
        <span
          className={cn(
            'tabular font-display text-beamer-h2 font-bold leading-none text-host-text',
            animate && 'rq-fade',
          )}
          style={grow}
        >
          {Math.round(shown)}
        </span>
        <div
          className={cn(
            'w-full rounded-t-md rounded-b-[4px]',
            animate && 'rq-grow-y',
            fill,
          )}
          style={{ ...grow, height: `${pct}%` }}
        />
      </div>
    )
  }
  if (size === 'admin') {
    return (
      <span
        className="block h-2.5 overflow-hidden rounded-pill bg-ink-10"
        role="presentation"
      >
        <span
          className={cn('block h-full rounded-pill', fill)}
          style={{ width: `${pct}%` }}
        />
      </span>
    )
  }
  return (
    <div className="mt-4 flex items-center gap-5">
      <div className="h-4 flex-1 overflow-hidden rounded-pill bg-host-bar-track">
        <div
          className={cn('h-full rounded-pill', animate && 'rq-grow-x', fill)}
          style={{ ...grow, width: `${pct}%` }}
        />
      </div>
      <span className="tabular min-w-14 text-right font-display text-beamer-option font-bold text-host-text">
        {Math.round(shown)}
      </span>
    </div>
  )
}
