import type { ReactNode } from 'react'
import { cn } from '~/lib/cn'

const RING = {
  success: 'bg-mint-200',
  neutral: 'bg-ink-15',
  blue: 'bg-blue-200',
}

/**
 * Round status illustration on the phone result screens. `rings`: `pulse` keeps three
 * rings breathing out (waiting), `once` sends two out a single time (a result landing).
 * `burst` is drawn between the rings and the disc, e.g. a `Burst`.
 */
export function StatusDisc({
  children,
  tone,
  size = 104,
  pop,
  rings,
  burst,
  className,
}: {
  children: ReactNode
  tone: 'success' | 'neutral' | 'blue'
  size?: number
  pop?: boolean
  rings?: 'pulse' | 'once'
  burst?: ReactNode
  className?: string
}) {
  const tones = {
    success: 'bg-success text-white',
    neutral: 'bg-ink-10 text-ink-70',
    blue: 'bg-blue-100 text-blue',
  }
  const ringDelays = rings === 'pulse' ? [0, 0.8, 1.6] : [0.2, 0.45]
  return (
    <span
      aria-hidden="true"
      className={cn('relative flex shrink-0', className)}
      style={{ width: size, height: size }}
    >
      {rings &&
        ringDelays.map((d) => (
          <span
            key={d}
            className={cn(
              'absolute inset-0 rounded-full',
              RING[tone],
              rings === 'pulse' ? 'animate-ring' : 'rq-ring-once',
            )}
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      {burst}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center rounded-full',
          tones[tone],
          pop && 'animate-pop',
        )}
      >
        {children}
      </span>
    </span>
  )
}
