import type { ReactNode } from 'react'
import { cx } from '~/lib/cx'

type Tone = 'blue' | 'neutral' | 'success' | 'gradient' | 'host'

const TONES: Record<Tone, string> = {
  blue: 'bg-blue-100 text-blue-600',
  neutral: 'bg-ink-10 text-ink-70',
  success: 'bg-mint-100 text-mint-600',
  gradient: 'bg-gradient-signal text-white',
  host: 'bg-host-code-bg text-host-badge-fg',
}

export function Badge({ children, tone = 'blue', size = 'sm', className }: { children: ReactNode; tone?: Tone; size?: 'xs' | 'sm' | 'beamer'; className?: string }) {
  const sizes = { xs: 'px-2 py-1 text-[10px]', sm: 'px-3 py-1.5 text-xs', beamer: 'px-5 py-2.5 text-[20px]' }
  return <span className={cx('rox-label inline-flex items-center rounded-pill', TONES[tone], sizes[size], className)}>{children}</span>
}
