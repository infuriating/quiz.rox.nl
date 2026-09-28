import type { ReactNode } from 'react'
import { cn } from '~/lib/cn'

/** Small uppercase label: Space Grotesk 500, tracked 0.08em. `className` overrides size and colour. */
export function Label({
  children,
  className,
  as: Tag = 'span',
}: {
  children: ReactNode
  className?: string
  as?: 'span' | 'p' | 'h2' | 'legend'
}) {
  return (
    <Tag className={cn('rox-label text-xs text-ink-55', className)}>
      {children}
    </Tag>
  )
}
