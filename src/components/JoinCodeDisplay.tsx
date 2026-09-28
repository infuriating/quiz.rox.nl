import { cn } from '~/lib/cn'

/** Six separate characters on light blue. Codes never contain 0/O or 1/I. */
export function JoinCodeDisplay({
  code,
  size = 'lg',
}: {
  code: string
  size?: 'lg' | 'md'
}) {
  const cell =
    size === 'lg'
      ? 'h-[168px] w-[132px] text-[112px] rounded-[20px]'
      : 'h-[112px] w-[88px] text-[72px] rounded-md'
  return (
    <div
      role="text"
      aria-label={`Quizcode ${code.split('').join(' ')}`}
      className="flex gap-4"
    >
      {code.split('').map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center bg-host-code-bg font-display font-bold leading-none text-host-text',
            cell,
          )}
        >
          {c}
        </span>
      ))}
    </div>
  )
}
