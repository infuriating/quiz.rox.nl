import { useMemo } from 'react'
import { cn } from '~/lib/cn'
import { seededRandom } from '~/lib/motion'

/** More players than this and one dot stands for a share of the room. */
const MAX_DOTS = 24
/** Arcs over the disc (radius px, from/to angle in degrees, dot size px); the bottom stays clear for the title. */
const ARCS = [
  { r: 96, from: -200, to: 20, size: 12 },
  { r: 144, from: -205, to: 25, size: 10 },
] as const
const YOU_SIZE = 16

type Dot = {
  left: number
  top: number
  size: number
  you: boolean
  rank: number
}

function layout(n: number): Array<Dot> {
  const inner = Math.ceil(n * 0.45)
  const counts = [inner, n - inner]
  const dots: Array<Dot> = []
  ARCS.forEach((arc, a) => {
    const count = counts[a]
    for (let k = 0; k < count; k++) {
      const t = count === 1 ? 0.5 : k / (count - 1)
      const deg = arc.from + (arc.to - arc.from) * t
      const rad = (deg * Math.PI) / 180
      dots.push({
        left: Math.cos(rad) * arc.r,
        top: Math.sin(rad) * arc.r,
        size: arc.size,
        you: false,
        rank: 0,
      })
    }
  })
  // You are the inner dot closest to the top; the rest light up in a fixed shuffled order.
  let you = 0
  dots.forEach((d, i) => {
    if (i < inner && d.top < dots[you].top) you = i
  })
  dots[you] = { ...dots[you], size: YOU_SIZE, you: true }
  const rnd = seededRandom(n)
  const others = dots
    .map((_, i) => i)
    .filter((i) => i !== you)
    .map((i) => ({ i, key: rnd() }))
    .sort((a, b) => a.key - b.key)
  others.forEach(({ i }, k) => (dots[i].rank = k + 1))
  return dots
}

/**
 * The room around the "Antwoord ontvangen" disc: one dot per player on two arcs over
 * it, lighting up as answers come in, yours in ROX blue. It shows that someone answered,
 * never what they picked. Place it at the disc's centre inside a `relative` parent.
 */
export function AnswerOrbit({
  answered,
  players,
}: {
  answered: number
  players: number
}) {
  const n = Math.max(1, Math.min(players, MAX_DOTS))
  const dots = useMemo(() => layout(n), [n])
  const lit = Math.round((answered / Math.max(players, 1)) * n)
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 size-0"
    >
      {dots.map((d, i) => (
        <span
          key={i}
          className="rq-fade absolute"
          style={{
            left: d.left - d.size / 2,
            top: d.top - d.size / 2,
            width: d.size,
            height: d.size,
            animationDelay: `${(0.2 + i * 0.035).toFixed(3)}s`,
          }}
        >
          {d.you ? (
            <>
              <span className="absolute inset-0 animate-ring rounded-full bg-blue-300" />
              <span className="absolute inset-0 rounded-full bg-blue" />
            </>
          ) : (
            <span
              className={cn(
                'block size-full rounded-full transition-colors duration-500 ease-cut',
                d.rank < lit ? 'rq-arrive bg-blue-300' : 'bg-blue-100',
              )}
            />
          )}
        </span>
      ))}
    </span>
  )
}
