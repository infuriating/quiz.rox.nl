// Scoring-only screens. The host route renders these only when session.scoringEnabled.
import { Badge } from '~/components/Badge'
import { Label } from '~/components/Label'
import { LeaderboardRow, formatScore } from '~/components/LeaderboardRow'
import { cn } from '~/lib/cn'
import type { HostView } from './types'

export function HostLeaderboard({ view }: { view: HostView }) {
  const q = view.question!
  return (
    <div className="flex h-full flex-col gap-12 px-60 pt-20 pb-[120px]">
      <div className="flex items-end justify-between">
        <h1 className="m-0 font-display text-beamer-display leading-none font-bold tracking-hero text-host-text">
          Tussenstand
        </h1>
        <Label className="text-beamer-label text-host-muted">
          Na vraag {q.index + 1} van {q.total}
        </Label>
      </div>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {(view.leaderboard ?? []).map((r) => (
          <LeaderboardRow
            key={r.playerId}
            rank={r.rank}
            previousRank={r.previousRank}
            name={r.name}
            score={r.score}
          />
        ))}
      </ol>
    </div>
  )
}

const HEIGHTS: Record<number, number> = { 1: 440, 2: 320, 3: 230 }

export function HostPodium({ view }: { view: HostView }) {
  const top = view.podium ?? []
  const order = [top[1], top[0], top[2]].filter(Boolean)
  return (
    <div className="flex h-full flex-col items-center gap-6 px-20 pt-20">
      <Badge tone="gradient" size="beamer">
        Eindstand
      </Badge>
      <h1 className="m-0 font-display text-beamer-display leading-none font-bold tracking-hero text-host-text">
        De top drie
      </h1>
      <div className="flex-1" />
      <div className="flex items-end gap-8">
        {order.map((p) => {
          const first = p.rank === 1
          return (
            <div
              key={p.playerId}
              className="flex w-[440px] flex-col items-center gap-6"
            >
              <div className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    'font-display leading-none font-bold tracking-display text-host-text',
                    first ? 'text-[64px]' : 'text-[52px]',
                  )}
                >
                  {p.name}
                </span>
                <span className="tabular font-display text-[32px] font-semibold text-host-muted">
                  {formatScore(p.score)}
                </span>
              </div>
              <div
                className={cn(
                  'flex w-full justify-center rounded-t-[28px] pt-8',
                  first
                    ? 'bg-blue text-white'
                    : 'bg-host-pod-other text-host-pod-other-fg',
                )}
                style={{ height: HEIGHTS[Math.min(p.rank, 3)] }}
              >
                <span className="font-display text-[128px] leading-none font-bold tracking-hero">
                  {p.rank}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
