import type { ReactNode } from 'react'
import { Label } from '~/components/Label'

/** Phone layout: fixed top bar, body fills the rest of the viewport without scrolling. */
export function PhoneFrame({ right, banner, children }: { right?: ReactNode; banner?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-white">
      {banner}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink-15 px-5">
        <Label className="text-xs text-ink">ROX Live Quiz</Label>
        {right}
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

export function WaitingDots({ label }: { label: string }) {
  return (
    <p className="m-0 flex items-center gap-1.5 text-sm text-ink-55">
      {label}
      {[0, 0.2, 0.4].map((d) => (
        <span key={d} className="size-[5px] animate-dot rounded-full bg-ink-55" style={{ animationDelay: `${d}s` }} />
      ))}
    </p>
  )
}

export function CenterMessage({ icon, title, sub, children }: { icon: ReactNode; title: string; sub: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 px-6 pt-10 pb-8 text-center">
      {icon}
      <div className="flex flex-col items-center gap-3">
        <h1 className="m-0 font-display text-phone-title leading-[1.08] font-bold tracking-display">{title}</h1>
        <p className="m-0 max-w-[300px] text-[17px] leading-[1.5] text-ink-70">{sub}</p>
      </div>
      {children}
    </div>
  )
}
