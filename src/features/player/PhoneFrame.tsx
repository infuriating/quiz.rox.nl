import type { ReactNode } from 'react'
import { Label } from '~/components/Label'
import { cn } from '~/lib/cn'

/**
 * Player layout. Phone: full viewport, fixed top bar, body fills the rest without
 * scrolling. Desktop (md+): the same screen as a card on a light-blue plane;
 * `wide` for the question screens, which lay the answers out in a 2x2 grid.
 */
export function PhoneFrame({
  right,
  banner,
  wide = false,
  children,
}: {
  right?: ReactNode
  banner?: ReactNode
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh md:items-center md:justify-center md:bg-blue-50 md:p-10">
      <div
        className={cn(
          'relative mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-white',
          'md:h-[780px] md:max-h-[calc(100dvh-80px)] md:rounded-lg md:border md:border-ink-15 md:shadow-float',
          wide ? 'md:max-w-[1040px]' : 'md:max-w-[560px]',
        )}
      >
        {banner}
        <header
          className={cn(
            'flex h-14 shrink-0 items-center justify-between border-b border-ink-15 px-5',
            wide && 'md:px-7',
          )}
        >
          <Label className="text-xs text-ink">ROX Live Quiz</Label>
          {right}
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}

export function WaitingDots({ label }: { label: string }) {
  return (
    <p className="m-0 flex items-center gap-1.5 text-sm text-ink-55">
      {label}
      {[0, 0.2, 0.4].map((d) => (
        <span
          key={d}
          className="size-[5px] animate-dot rounded-full bg-ink-55"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </p>
  )
}

export function CenterMessage({
  icon,
  title,
  sub,
  children,
}: {
  icon: ReactNode
  title: string
  sub: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 px-6 pt-10 pb-8 text-center">
      {icon}
      <div className="flex flex-col items-center gap-3">
        <h1 className="rq-in m-0 font-display text-phone-title leading-[1.08] font-bold tracking-display [animation-delay:.15s]">
          {title}
        </h1>
        <p className="rq-in m-0 max-w-[300px] text-[17px] leading-[1.5] text-ink-70 [animation-delay:.27s]">
          {sub}
        </p>
      </div>
      {children}
    </div>
  )
}
