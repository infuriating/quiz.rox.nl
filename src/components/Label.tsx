import type { ReactNode } from 'react'
import { cx } from '~/lib/cx'

/** Small uppercase label: Space Grotesk 500, tracked 0.08em. */
export function Label({ children, className, as: Tag = 'span' }: { children: ReactNode; className?: string; as?: 'span' | 'p' | 'h2' | 'legend' }) {
  return <Tag className={cx('rox-label', className ?? 'text-xs text-ink-55')}>{children}</Tag>
}
