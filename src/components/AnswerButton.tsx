import { cn } from '~/lib/cn'
import { AnswerMarker } from './AnswerMarker'
import { Icon } from './Icon'
import { Label } from './Label'

export type AnswerButtonState =
  | 'idle'
  | 'selected'
  | 'pressed'
  | 'correct'
  | 'incorrect'
  | 'dimmed'
  | 'disabled'

/**
 * Phone answer button. Min 56px high. Grows from its content height and never
 * shrinks below it, so a long option gets more room than a short one and no text is
 * ever clipped; when four long options do not fit, the parent list scrolls.
 * Single choice: tap submits ("pressed"). Multi: toggles ("selected") with a checkbox on the right.
 */
export function AnswerButton({
  index,
  text,
  state = 'idle',
  multi = false,
  onClick,
  className,
}: {
  index: number
  text: string
  state?: AnswerButtonState
  multi?: boolean
  onClick?: () => void
  /** Layout overrides from the parent, e.g. a taller minimum in the desktop grid. */
  className?: string
}) {
  const long = text.length > 60
  const surface = {
    idle: 'border-[1.5px] border-ink-25 bg-white text-ink',
    selected: 'border-2 border-blue bg-blue-100 text-ink',
    pressed: 'border-2 border-blue bg-blue text-white',
    correct: 'border-2 border-success bg-mint-100 text-ink',
    incorrect: 'border-[1.5px] border-dashed border-ink-40 bg-ink-10 text-ink',
    dimmed: 'border-[1.5px] border-ink-25 bg-white text-ink opacity-40',
    disabled: 'border-[1.5px] border-ink-25 bg-white text-ink opacity-40',
  }[state]
  const showCheckbox =
    multi && (state === 'idle' || state === 'selected' || state === 'disabled')
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : undefined}
      aria-checked={multi ? state === 'selected' : undefined}
      aria-pressed={!multi && state === 'pressed' ? true : undefined}
      disabled={
        state === 'disabled' ||
        state === 'dimmed' ||
        state === 'correct' ||
        state === 'incorrect'
      }
      onClick={onClick}
      className={cn(
        'flex min-h-14 w-full shrink-0 grow basis-auto cursor-pointer items-center gap-3 rounded-md py-3 pr-3.5 pl-3 text-left transition-[background,border-color] duration-150 ease-cut',
        'disabled:cursor-default',
        surface,
        className,
      )}
    >
      <AnswerMarker
        index={index}
        tone={state === 'pressed' ? 'inverse' : 'ink'}
      />
      <span
        className={cn(
          'flex-1 font-medium leading-[1.38]',
          long ? 'text-phone-option-long' : 'text-phone-option',
        )}
      >
        {text}
      </span>
      {state === 'correct' && (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-white">
          <Icon name="check" size={16} strokeWidth={2.6} />
        </span>
      )}
      {state === 'incorrect' && (
        <Label className="shrink-0 text-[10px] text-ink-55">Jouw keuze</Label>
      )}
      {showCheckbox && (
        <span
          aria-hidden="true"
          className={cn(
            'flex size-[22px] shrink-0 items-center justify-center rounded-[6px]',
            state === 'selected'
              ? 'bg-blue text-white'
              : 'border-[1.5px] border-ink-40 bg-white',
          )}
        >
          {state === 'selected' && (
            <Icon name="check" size={14} strokeWidth={3} />
          )}
        </span>
      )}
    </button>
  )
}
