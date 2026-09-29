// Scoring-only screens. The host route renders these only when session.scoringEnabled.
import { Badge } from '~/components/Badge'
import { Burst } from '~/components/Burst'
import { Label } from '~/components/Label'
import { LeaderboardRow, formatScore } from '~/components/LeaderboardRow'
import { cn } from '~/lib/cn'
import { delay, useAfter, useSpring } from '~/lib/motion'
import type { HostView } from './types'

type Ranked = NonNullable<HostView['leaderboard']>[number]

const ROW_H = 120
const ROW_GAP = 16
/** The leaderboard's beats (ms): scores count up, rows swap places, movement shows. */
const COUNT_AT = 1000
const MOVE_AT = 2400
const SETTLE_AT = 3500

/** One row, absolutely placed in its slot so a change of slot slides it there. */
function MovingRow({
  row,
  slot,
  enterSlot,
  counting,
  moved,
  settled,
}: {
  row: Ranked
  slot: number
  enterSlot: number
  counting: boolean
  moved: boolean
  settled: boolean
}) {
  const before = row.score - row.points
  const score = useSpring(counting ? row.score : before, { from: before })
  const climbing = moved && !settled && row.previousRank > row.rank
  return (
    <LeaderboardRow
      rank={moved ? row.rank : row.previousRank}
      previousRank={row.previousRank}
      name={row.name}
      score={Math.round(score)}
      showMovement={settled}
      extra={
        counting && !moved && row.points > 0 ? (
          <span className="rq-plus absolute top-1.5 right-full mr-5 text-[34px] font-semibold text-host-accent">
            +{formatScore(row.points)}
          </span>
        ) : null
      }
      className={cn(
        'rq-row-in absolute inset-x-0 transition-[top,background,border-color,box-shadow,scale] duration-[1100ms] ease-out-expo',
        climbing && 'z-10 scale-[1.015] shadow-pop',
      )}
      style={{
        top: slot * (ROW_H + ROW_GAP),
        animationDelay: `${(0.25 + enterSlot * 0.07).toFixed(2)}s`,
      }}
    />
  )
}

/**
 * Opens in the order before this question with the old scores, counts them up, then
 * slides every row to its new place; climbers lift over the others while they move.
 */
export function HostLeaderboard({ view }: { view: HostView }) {
  const q = view.question!
  const rows = view.leaderboard ?? []
  const counting = useAfter(COUNT_AT)
  const moved = useAfter(MOVE_AT)
  const settled = useAfter(SETTLE_AT)
  const slotBefore = new Map(
    rows
      .map((r, i) => ({ r, i }))
      .sort((a, b) => a.r.previousRank - b.r.previousRank || a.i - b.i)
      .map(({ i }, slot) => [i, slot]),
  )
  return (
    <div className="flex h-full flex-col gap-12 px-60 pt-20 pb-[120px]">
      <div className="flex items-end justify-between">
        <h1 className="rq-in m-0 font-display text-beamer-display leading-none font-bold tracking-hero text-host-text">
          Tussenstand
        </h1>
        <Label className="rq-in text-beamer-label text-host-muted [animation-delay:.1s]">
          Na vraag {q.index + 1} van {q.total}
        </Label>
      </div>
      <ol
        className="relative m-0 list-none p-0"
        style={{ height: rows.length * (ROW_H + ROW_GAP) - ROW_GAP }}
      >
        {rows.map((r, i) => {
          const before = slotBefore.get(i) ?? i
          return (
            <MovingRow
              key={r.playerId}
              row={r}
              slot={moved ? i : before}
              enterSlot={before}
              counting={counting}
              moved={moved}
              settled={settled}
            />
          )
        })}
      </ol>
    </div>
  )
}

const HEIGHTS: Record<number, number> = { 1: 440, 2: 320, 3: 230 }
/** Seconds at which each podium place rises: third first, the winner last. */
const RISE_AT: Record<number, number> = { 1: 2.3, 2: 1.3, 3: 0.5 }

function PodiumPlace({
  p,
  place,
}: {
  p: NonNullable<HostView['podium']>[number]
  /** 1–3: the position on the podium, which sets the timing. */
  place: number
}) {
  const at = RISE_AT[place]
  const first = p.rank === 1
  const winner = place === 1
  const score = useSpring(p.score, { delay: (at + 0.5) * 1000 })
  const height = HEIGHTS[Math.min(p.rank, 3)]
  return (
    <div className="flex w-[440px] flex-col items-center gap-6">
      <div
        className="rq-in flex flex-col items-center gap-2"
        style={delay(at + 0.5)}
      >
        <span
          className={cn(
            'font-display leading-none font-bold tracking-display text-host-text',
            first ? 'text-[64px]' : 'text-[52px]',
          )}
        >
          {p.name}
        </span>
        <span className="tabular font-display text-[32px] font-semibold text-host-muted">
          {formatScore(Math.round(score))}
        </span>
      </div>
      <div className="relative w-full" style={{ height }}>
        {winner && (
          <span
            aria-hidden="true"
            className="rq-grow-y absolute inset-0 rounded-t-[28px]"
            style={delay(at)}
          >
            <span
              className="rq-glow absolute inset-0 rounded-t-[28px] [--rq-glow-spread:60px]"
              style={delay(at + 0.9)}
            />
          </span>
        )}
        <div
          className={cn(
            'rq-grow-y relative flex h-full w-full justify-center overflow-hidden rounded-t-[28px] pt-8',
            first
              ? 'bg-blue text-white'
              : 'bg-host-pod-other text-host-pod-other-fg',
          )}
          style={delay(at)}
        >
          <span
            className="rq-in font-display text-[128px] leading-none font-bold tracking-hero"
            style={delay(at + 0.35)}
          >
            {p.rank}
          </span>
          {winner && (
            <span
              className="rq-sheen [--rq-sheen:rgba(255,255,255,.28)]"
              style={delay(at + 0.9)}
            />
          )}
        </div>
        {winner && (
          <Burst
            count={30}
            radius={520}
            size={34}
            gravity={260}
            delay={at + 0.9}
            seed={11}
            className="top-0"
          />
        )}
      </div>
    </div>
  )
}

/** Third, second and first rise in turn; the winner's block glows and the shapes burst over it. */
export function HostPodium({ view }: { view: HostView }) {
  const top = view.podium ?? []
  const order = [
    { p: top[1], place: 2 },
    { p: top[0], place: 1 },
    { p: top[2], place: 3 },
  ].filter((x) => x.p)
  return (
    <div className="flex h-full flex-col items-center gap-6 px-20 pt-20">
      <Badge
        tone="gradient"
        size="beamer"
        className="relative animate-pop overflow-hidden"
      >
        Eindstand
        <span className="rq-sheen [animation-delay:.4s]" />
      </Badge>
      <h1 className="rq-in m-0 font-display text-beamer-display leading-none font-bold tracking-hero text-host-text [animation-delay:.12s]">
        De top drie
      </h1>
      <div className="flex-1" />
      <div className="flex items-end gap-8">
        {order.map(({ p, place }) => (
          <PodiumPlace key={p.playerId} p={p} place={place} />
        ))}
      </div>
    </div>
  )
}
