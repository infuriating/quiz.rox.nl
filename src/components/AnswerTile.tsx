import { cn } from '~/lib/cn'
import { delay } from '~/lib/motion'
import { AnswerMarker } from './AnswerMarker'
import { DistributionBar } from './DistributionBar'
import { Icon } from './Icon'

export type AnswerTileState = 'idle' | 'correct' | 'dimmed'

/**
 * Beamer answer tile. No hints during the question; at reveal: correct = mint + 3px line,
 * rest dims. A change of `state` fades across, so a reveal can hold a beat on `idle` first.
 */
export function AnswerTile({
  index,
  text,
  state = 'idle',
  textSize = 'option',
  count,
  total,
  enterDelay,
  barDelay,
}: {
  index: number
  text: string
  state?: AnswerTileState
  textSize?: 'option' | 'long' | 'compact'
  count?: number
  total?: number
  /** Seconds: rise in on mount, the marker spinning in just after. */
  enterDelay?: number
  /** Seconds: when the distribution bar starts to grow and count. */
  barDelay?: number
}) {
  const sizes = {
    option: 'text-beamer-option',
    long: 'text-beamer-option-long',
    compact: 'text-[24px]',
  }
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 basis-0 items-center gap-7 rounded-lg py-6 pr-8 pl-6 transition-[background,border-color,opacity,scale] duration-500 ease-cut',
        enterDelay !== undefined && 'rq-rise',
        state === 'correct' && 'scale-[1.01]',
        state === 'dimmed' && 'scale-[.985]',
        state === 'correct'
          ? 'border-[3px] border-success bg-host-ok-bg'
          : 'border-2 border-host-line bg-host-raised',
      )}
      style={{
        ...(enterDelay !== undefined ? delay(enterDelay) : {}),
        ...(state === 'dimmed' ? { opacity: 'var(--host-dim)' } : {}),
      }}
    >
      <AnswerMarker
        index={index}
        size="beamer"
        tone="host"
        className={enterDelay !== undefined ? 'rq-spin-in' : undefined}
        style={enterDelay !== undefined ? delay(enterDelay + 0.15) : undefined}
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'font-medium leading-[1.28] text-host-text',
            sizes[textSize],
          )}
        >
          {text}
        </div>
        {count !== undefined && total !== undefined && (
          <DistributionBar
            count={count}
            total={total}
            correct={state === 'correct'}
            enterDelay={barDelay}
          />
        )}
      </div>
      {state === 'correct' && (
        <span className="rox-label inline-flex shrink-0 animate-pop items-center gap-2.5 rounded-pill bg-success py-2.5 pr-[18px] pl-3 text-[20px] tracking-[0.04em] text-white">
          <Icon name="check" size={22} strokeWidth={2.8} />
          Goed
        </span>
      )}
    </div>
  )
}
