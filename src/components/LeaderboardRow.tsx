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

/** Scoring only. Rank block, name, subtle movement (never red), score. #1 on light blue. */
export function LeaderboardRow({
  rank,
  previousRank,
  name,
  score,
}: {
  rank: number
  previousRank: number
  name: string
  score: number
}) {
  const first = rank === 1
  return (
    <li
      className={cn(
        'flex h-[120px] items-center gap-9 rounded-lg pr-12 pl-8',
        first ? 'bg-host-code-bg' : 'border-2 border-host-hair bg-host-raised',
      )}
    >
      <span
        className={cn(
          'flex size-[72px] shrink-0 items-center justify-center rounded-md font-display text-[36px] font-bold',
          first ? 'bg-blue text-white' : 'bg-host-rank-bg text-host-text',
        )}
      >
        {rank}
      </span>
      <span className="flex-1 font-display text-[48px] font-semibold tracking-heading text-host-text">
        {name}
      </span>
      <span className="flex w-24">
        <Movement rank={rank} previousRank={previousRank} />
      </span>
      <span className="tabular w-[220px] text-right font-display text-[48px] font-bold text-host-text">
        {formatScore(score)}
      </span>
    </li>
  )
}
