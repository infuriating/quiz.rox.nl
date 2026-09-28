import type { ReactNode } from 'react'
import { cx } from '~/lib/cx'

/** Round status illustration on the phone result screens. */
export function StatusDisc({ children, tone, size = 104, pop }: { children: ReactNode; tone: 'success' | 'neutral' | 'blue'; size?: number; pop?: boolean }) {
  const tones = { success: 'bg-success text-white', neutral: 'bg-ink-10 text-ink-70', blue: 'bg-blue-100 text-blue' }
  return (
    <span aria-hidden="true" className={cx('flex items-center justify-center rounded-full', tones[tone], pop && 'animate-pop')} style={{ width: size, height: size }}>
      {children}
    </span>
  )
}
