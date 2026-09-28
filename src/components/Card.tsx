import type { HTMLAttributes } from 'react'
import { cn } from '~/lib/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section {...rest} className={cn('rounded-md border border-ink-15 bg-white shadow-card', className)} />
}
