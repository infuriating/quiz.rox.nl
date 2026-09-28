import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '~/lib/cn'

const control =
  'box-border w-full rounded-sm border bg-white font-body text-base text-ink placeholder:text-ink-40 focus:border-blue focus:shadow-[0_0_0_4px_var(--focus-ring-soft)] focus:outline-none'

type FieldProps = {
  label: string
  hint?: string
  error?: string | null
  hideLabel?: boolean
  size?: 'md' | 'lg'
}

function Wrap({
  id,
  label,
  hint,
  error,
  hideLabel,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className={cn('rox-label text-xs text-ink', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-msg`}
          className="m-0 flex items-start gap-2 text-sm text-error"
        >
          <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-error font-display text-xs font-bold text-white">
            !
          </span>
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-msg`} className="m-0 text-[13px] text-ink-55">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

function stateClass(error?: string | null) {
  return error
    ? 'border-2 border-error focus:border-error focus:shadow-[0_0_0_4px_var(--status-error-ring)]'
    : 'border-ink-25'
}

export function Input({
  label,
  hint,
  error,
  hideLabel,
  size = 'md',
  className,
  ...rest
}: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>) {
  const id = useId()
  return (
    <Wrap id={id} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-msg` : undefined}
        {...rest}
        className={cn(
          control,
          stateClass(error),
          size === 'lg' ? 'h-14 px-4 text-[17px]' : 'h-12 px-3.5',
          className,
        )}
      />
    </Wrap>
  )
}

export function Textarea({
  label,
  hint,
  error,
  hideLabel,
  className,
  ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Wrap id={id} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-msg` : undefined}
        {...rest}
        className={cn(
          control,
          stateClass(error),
          'resize-y px-3.5 py-3 leading-[1.5]',
          className,
        )}
      />
    </Wrap>
  )
}

export function Select({
  label,
  hint,
  error,
  hideLabel,
  className,
  children,
  ...rest
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Wrap id={id} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <select
        id={id}
        {...rest}
        className={cn(control, stateClass(error), 'h-12 px-3.5', className)}
      >
        {children}
      </select>
    </Wrap>
  )
}
