import { cx } from '~/lib/cx'
import { AnswerMarker } from './AnswerMarker'
import { DistributionBar } from './DistributionBar'
import { Icon } from './Icon'

export type AnswerTileState = 'idle' | 'correct' | 'dimmed'

/** Beamer answer tile. No hints during the question; at reveal: correct = mint + 3px line, rest dims. */
export function AnswerTile({
  index,
  text,
  state = 'idle',
  textSize = 'option',
  count,
  total,
}: {
  index: number
  text: string
  state?: AnswerTileState
  textSize?: 'option' | 'long' | 'compact'
  count?: number
  total?: number
}) {
  const sizes = { option: 'text-beamer-option', long: 'text-beamer-option-long', compact: 'text-[24px]' }
  return (
    <div
      className={cx(
        'flex min-h-0 flex-1 basis-0 items-center gap-7 rounded-lg py-6 pr-8 pl-6',
        state === 'correct' ? 'border-[3px] border-success bg-host-ok-bg' : 'border-2 border-host-line bg-host-raised',
      )}
      style={state === 'dimmed' ? { opacity: 'var(--host-dim)' } : undefined}
    >
      <AnswerMarker index={index} size="beamer" tone="host" />
      <div className="min-w-0 flex-1">
        <div className={cx('font-medium leading-[1.28] text-host-text', sizes[textSize])}>{text}</div>
        {count !== undefined && total !== undefined && <DistributionBar count={count} total={total} correct={state === 'correct'} />}
      </div>
      {state === 'correct' && (
        <span className="rox-label inline-flex shrink-0 items-center gap-2.5 rounded-pill bg-success py-2.5 pr-[18px] pl-3 text-[20px] tracking-[0.04em] text-white">
          <Icon name="check" size={22} strokeWidth={2.8} />
          Goed
        </span>
      )}
    </div>
  )
}
