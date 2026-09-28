import { useId, useRef, useState } from 'react'
import { cx } from '~/lib/cx'

const LENGTH = 6

/** One real input rendered as six cells. Error: red cells, soft red ring, instruction below. */
export function CodeInput({
  value,
  onChange,
  error,
  hint = 'Staat groot op het scherm voorin de zaal.',
  label = 'Quizcode',
}: {
  value: string
  onChange: (v: string) => void
  error?: string | null
  hint?: string
  label?: string
}) {
  const id = useId()
  const msgId = `${id}-msg`
  const ref = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const chars = value.split('')
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="rox-label text-xs text-ink">
        {label}
      </label>
      <div
        className={cx('relative flex gap-2 rounded-sm', error && 'shadow-[0_0_0_4px_var(--status-error-ring)]')}
        onClick={() => ref.current?.focus()}
      >
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={LENGTH}
          value={value}
          aria-describedby={msgId}
          aria-invalid={error ? true : false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, LENGTH))}
          className="absolute inset-0 h-full w-full border-0 opacity-0"
        />
        {Array.from({ length: LENGTH }, (_, i) => {
          const active = focused && !error && i === Math.min(chars.length, LENGTH - 1)
          return (
            <span
              key={i}
              aria-hidden="true"
              className={cx(
                'flex h-[60px] flex-1 items-center justify-center rounded-[10px] bg-white font-display text-[26px] font-bold text-ink',
                error ? 'border-2 border-error' : active ? 'border-2 border-blue' : 'border-[1.5px] border-ink-25',
              )}
            >
              {chars[i] ?? ''}
            </span>
          )
        })}
      </div>
      {error ? (
        <p id={msgId} className="m-0 flex items-start gap-2 text-sm leading-[1.45] text-error">
          <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-error font-display text-xs font-bold text-white">!</span>
          {error}
        </p>
      ) : (
        <p id={msgId} className="m-0 text-sm leading-[1.45] text-ink-55">
          {hint}
        </p>
      )}
    </div>
  )
}
