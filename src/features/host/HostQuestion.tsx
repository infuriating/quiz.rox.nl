import { AnswerTile } from '~/components/AnswerTile'
import { CountdownBar } from '~/components/CountdownBar'
import { Label } from '~/components/Label'
import type { HostView } from './types'
import { AnsweredCounter, HostHeader } from './HostHeader'

/** No correct-answer hints: the payload has none before reveal. */
export function HostQuestion({
  view,
  remainingMs,
}: {
  view: HostView
  remainingMs: number
}) {
  const q = view.question!
  const long = q.options.some((o) => o.text.length > 80)
  const secs = Math.ceil(remainingMs / 1000)
  return (
    <div className="flex h-full flex-col gap-9 px-20 pt-16 pb-28">
      <HostHeader
        question={q}
        right={
          <AnsweredCounter
            answered={view.answeredCount}
            of={view.session.playerCount}
          />
        }
      />
      <div className="flex items-end gap-16">
        <h1 className="m-0 max-w-[1440px] flex-1 font-display text-beamer-question leading-[1.08] font-bold tracking-display text-host-text">
          {q.text}
        </h1>
        <div
          aria-label={`Nog ${secs} seconden`}
          className="flex w-[220px] shrink-0 flex-col items-end gap-1"
        >
          <span className="tabular font-display text-[168px] leading-[.86] font-bold tracking-hero text-host-text">
            {secs}
          </span>
          <Label className="text-[20px] text-host-muted">seconden</Label>
        </div>
      </div>
      <CountdownBar
        remainingMs={remainingMs}
        totalMs={q.timeLimitSec * 1000}
        size="beamer"
        showSeconds={false}
      />
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-6">
        {q.options.map((o, i) => (
          <AnswerTile
            key={o.id}
            index={i}
            text={o.text}
            textSize={long ? 'long' : 'option'}
          />
        ))}
      </div>
    </div>
  )
}
