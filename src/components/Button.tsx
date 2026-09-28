import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '~/lib/cx'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'outline' | 'ghost' | 'ink'
type Size = 'sm' | 'md' | 'lg' | 'beamer'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue text-white hover:bg-blue-hover hover:shadow-[0_12px_28px_-8px_var(--wash-blue-strong)]',
  outline: 'bg-white text-ink border border-ink-25 hover:border-ink-40',
  ghost: 'bg-transparent text-ink-70 hover:bg-ink-10',
  ink: 'bg-ink text-white hover:bg-ink-85',
}
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-2',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-14 px-8 text-[17px] gap-2.5',
  beamer: 'h-[72px] px-10 text-[24px] gap-3',
}

/** ROX pill button. Always pill-shaped; one primary per block. */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconRight?: IconName
  full?: boolean
  children?: ReactNode
}) {
  const iconSize = size === 'beamer' ? 22 : size === 'lg' ? 16 : 15
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-pill font-semibold transition-[background,box-shadow,transform] duration-200 ease-cut active:scale-[.97]',
        'disabled:cursor-not-allowed disabled:border-0 disabled:bg-ink-15 disabled:text-ink-40 disabled:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className,
      )}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  )
}
