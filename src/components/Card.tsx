import type { HTMLAttributes } from 'react'
import { cx } from '~/lib/cx'

export function Card({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section {...rest} className={cx('rounded-md border border-ink-15 bg-white shadow-card', className)} />
}
