import { cn } from '~/lib/cn'

const WARN_SECONDS = 5

/**
 * Gradient-signal fill counting down. Last 5 seconds: status-warning. Purely cosmetic.
 * The fill charges in from the left on mount and each new second drops in.
 */
export function CountdownBar({
  remainingMs,
  totalMs,
  size = 'phone',
  showSeconds = true,
}: {
  remainingMs: number
  totalMs: number
  size?: 'phone' | 'beamer'
  showSeconds?: boolean
}) {
  const pct =
    totalMs <= 0 ? 0 : Math.max(0, Math.min(100, (remainingMs / totalMs) * 100))
  const secs = Math.ceil(Math.max(0, remainingMs) / 1000)
  const warn = secs <= WARN_SECONDS && secs > 0
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label="Resterende tijd"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className={cn(
          'flex-1 overflow-hidden rounded-pill',
          size === 'phone' ? 'h-2.5 bg-ink-15' : 'h-5 bg-host-bar-track',
        )}
      >
        <div
          className={cn(
            'rq-grow-x h-full rounded-pill transition-[width] duration-200 ease-linear [animation-delay:.3s]',
            warn ? 'bg-warning' : 'bg-gradient-signal',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showSeconds && (
        <span
          className="tabular min-w-8 text-right font-display text-base font-semibold"
          aria-live="off"
        >
          <span key={secs} className={warn ? 'rq-hurry' : 'rq-tick'}>
            {secs} s
          </span>
        </span>
      )}
    </div>
  )
}
