import { cx } from '~/lib/cx'

export const LETTERS = ['A', 'B', 'C', 'D'] as const
const SHAPES = ['shape-triangle', 'shape-diamond', 'shape-circle', 'shape-square'] as const
export const SHAPE_NAMES = ['driehoek', 'ruit', 'cirkel', 'vierkant'] as const

const SIZES = {
  // box, shape, letter (px), radius class
  phone: { box: 44, shape: 12, letter: 15, radius: 'rounded-[10px]' },
  admin: { box: 40, shape: 11, letter: 14, radius: 'rounded-xs' },
  column: { box: 56, shape: 18, letter: 22, radius: 'rounded-[10px]' },
  beamer: { box: 96, shape: 30, letter: 36, radius: 'rounded-md' },
} as const

export type MarkerTone = 'ink' | 'inverse' | 'accent' | 'host'

/** Shape + letter, so an option is never identified by colour alone. A triangle, B diamond, C circle, D square. */
export function AnswerMarker({
  index,
  size = 'phone',
  tone = 'ink',
}: {
  index: number
  size?: keyof typeof SIZES
  tone?: MarkerTone
}) {
  const s = SIZES[size]
  const tones = {
    ink: 'bg-ink text-white',
    inverse: 'bg-white text-blue',
    accent: 'bg-blue text-white',
    host: 'bg-host-marker-bg text-host-marker-fg',
  } as const
  return (
    <span
      aria-hidden="true"
      className={cx('flex shrink-0 items-center justify-center', s.radius, tones[tone])}
      style={{ width: s.box, height: s.box, gap: Math.max(4, Math.floor(s.box / 11)) }}
    >
      <span className={cx('block bg-current', SHAPES[index])} style={{ width: s.shape, height: s.shape }} />
      <span className="font-display font-bold leading-none" style={{ fontSize: s.letter }}>
        {LETTERS[index]}
      </span>
    </span>
  )
}
