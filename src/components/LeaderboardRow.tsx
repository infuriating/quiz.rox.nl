import { cn } from '~/lib/cn'
import { Icon } from './Icon'

export function formatScore(n: number): string {
  return n.toLocaleString('nl-NL')
}

function Movement({
  rank,
  previousRank,
}: {
  rank: number
  previousRank: number
}) {
  const delta = previousRank - rank
  if (delta > 0)
    return (
      <span
        aria-label={`${delta} omhoog`}
        className="inline-flex items-center gap-1.5 font-display text-[28px] font-semibold text-host-ok-text"
      >
        <Icon name="arrow-up" size={28} strokeWidth={2.6} />
        {delta}
      </span>
    )
  if (delta < 0)
    return (
      <span
        aria-label={`${-delta} omlaag`}
        className="inline-flex items-center gap-1.5 font-display text-[28px] font-semibold text-host-muted"
      >
        <Icon name="arrow-down" size={28} strokeWidth={2.6} />
        {-delta}
      </span>
    )
  return (
    <span aria-label="Zelfde plek" className="inline-flex text-host-muted">
      <Icon name="minus" size={28} strokeWidth={2.6} />
    </span>
  )
}

/**
 * Scoring only. Rank block, name, subtle movement (never red), score. #1 on light blue.
 * `showMovement` false keeps the movement slot empty until the row has moved; the rank
 * ticks in whenever it changes. `extra` sits over the score (the "+points" float).
 */
export function LeaderboardRow({
  rank,
  previousRank,
  name,
  score,
  showMovement = true,
  extra,
  className,
  style,
}: {
  rank: number
  previousRank: number
  name: string
  score: number
  showMovement?: boolean
  extra?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const first = rank === 1
  return (
    <li
      className={cn(
        'flex h-[120px] items-center gap-9 rounded-lg pr-12 pl-8 transition-[background,border-color] duration-500 ease-cut',
        first
          ? 'border-2 border-transparent bg-host-code-bg'
          : 'border-2 border-host-hair bg-host-raised',
        className,
      )}
      style={style}
    >
      <span
        className={cn(
          'flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-md font-display text-[36px] font-bold transition-colors duration-500 ease-cut',
          first ? 'bg-blue text-white' : 'bg-host-rank-bg text-host-text',
        )}
      >
        <span key={rank} className="rq-tick">
          {rank}
        </span>
      </span>
      <span className="flex-1 font-display text-[48px] font-semibold tracking-heading text-host-text">
        {name}
      </span>
      <span className="flex w-24">
        {showMovement && (
          <span className="flex animate-pop">
            <Movement rank={rank} previousRank={previousRank} />
          </span>
        )}
      </span>
      <span className="tabular relative w-[220px] text-right font-display text-[48px] font-bold text-host-text">
        {formatScore(score)}
        {extra}
      </span>
    </li>
  )
}
