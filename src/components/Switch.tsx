import { useId } from 'react'
import { cn } from '~/lib/cn'

/** On/off for settings. Real checkbox with role=switch, 44x24, on in ROX blue. */
export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className="relative flex cursor-pointer items-start gap-3"
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer absolute m-0 h-6 w-11 opacity-0"
      />
      <span
        aria-hidden="true"
        className={cn(
          'relative mt-px h-6 w-11 shrink-0 rounded-pill transition-colors duration-200 peer-focus-visible:shadow-[var(--ring-focus)]',
          checked ? 'bg-blue' : 'bg-ink-25',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(13,18,32,.2)] transition-[left] duration-200 ease-cut',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-ink">{label}</span>
        {hint && (
          <span className="text-[13px] leading-[1.45] text-ink-55">{hint}</span>
        )}
      </span>
    </label>
  )
}
