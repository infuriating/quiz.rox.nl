import { useMemo } from 'react'
import { seededRandom, useReducedMotion, vars } from '~/lib/motion'
import { cn } from '~/lib/cn'

const SHAPES = [
  'shape-triangle',
  'shape-diamond',
  'shape-circle',
  'shape-square',
] as const
const COLORS = [
  'var(--rox-blue)',
  'var(--rox-cyan)',
  'var(--rox-blue-2)',
  'var(--status-success)',
  'var(--rox-blue-300)',
]

/**
 * One burst of the four answer shapes out of a point: the celebration on "Goed" and on
 * the podium. Place it inside a `relative` parent; it fires once from the parent's centre
 * (or from `className` placement). Renders nothing under reduced motion.
 */
export function Burst({
  count = 18,
  radius = 150,
  size = 14,
  delay = 0.2,
  gravity = 70,
  seed = 7,
  className,
}: {
  count?: number
  radius?: number
  size?: number
  /** Seconds before the pieces launch. */
  delay?: number
  /** How far (px) the pieces drop after the burst. */
  gravity?: number
  seed?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const pieces = useMemo(() => {
    const rnd = seededRandom(seed)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + (rnd() - 0.5) * 0.5
      const dist = radius * (0.6 + rnd() * 0.4)
      const dx = Math.cos(angle) * dist
      const dy = Math.sin(angle) * dist * 0.9
      const rot = (rnd() < 0.5 ? -1 : 1) * (140 + rnd() * 280)
      const s = Math.round(size * (0.6 + rnd() * 0.65))
      return {
        shape: SHAPES[i % 4],
        style: {
          width: s,
          height: s,
          background: COLORS[i % COLORS.length],
          ...vars({
            '--dx': `${dx.toFixed(0)}px`,
            '--dy': `${dy.toFixed(0)}px`,
            '--dx2': `${(dx * 1.08).toFixed(0)}px`,
            '--dy2': `${(dy + gravity).toFixed(0)}px`,
            '--rot': `${rot.toFixed(0)}deg`,
            '--dur': `${(1.1 + rnd() * 0.5).toFixed(2)}s`,
            '--delay': `${(delay + rnd() * 0.12).toFixed(2)}s`,
          }),
        },
      }
    })
  }, [count, radius, size, delay, gravity, seed])
  if (reduced) return null
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute top-1/2 left-1/2 size-0',
        className,
      )}
    >
      {pieces.map((p, i) => (
        <span key={i} className={cn('rq-piece', p.shape)} style={p.style} />
      ))}
    </span>
  )
}
