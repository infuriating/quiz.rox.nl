import { Label } from '~/components/Label'
import type { HostView } from './types'

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex w-[320px] flex-col gap-3 border-t-2 border-blue pt-6">
      <span className="font-display text-beamer-question leading-none font-bold tracking-display text-host-text">
        {value}
      </span>
      <Label className="text-[20px] text-host-muted">{label}</Label>
    </div>
  )
}

export function HostThanks({ view }: { view: HostView }) {
  const s = view.session
  const date = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <>
      <div className="flex h-full flex-col gap-10 px-40 pt-[120px] pb-[140px]">
        <Label className="text-beamer-label text-host-muted">
          {s.quizTitle} · {date}
        </Label>
        <h1 className="m-0 font-display text-beamer-hero leading-[.98] font-bold tracking-hero text-host-text">
          Iedereen bedankt
        </h1>
        {s.outroMessage && (
          <p className="m-0 max-w-[1200px] text-[36px] leading-[1.4] text-host-soft">
            {s.outroMessage}
          </p>
        )}
        <div className="flex-1" />
        <div className="flex gap-16">
          <Fact value={String(s.playerCount)} label="Deelnemers" />
          <Fact value={String(s.totalQuestions)} label="Vragen" />
          {view.stats?.percentCorrect !== null &&
            view.stats?.percentCorrect !== undefined && (
              <Fact
                value={`${view.stats.percentCorrect}%`}
                label="Goed beantwoord"
              />
            )}
        </div>
      </div>
      <span className="absolute right-40 bottom-16 text-[20px] text-host-muted">
        Solid Digital Products
      </span>
    </>
  )
}
