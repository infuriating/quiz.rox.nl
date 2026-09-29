import { Fragment, useState } from 'react'
import { AnswerTile } from '~/components/AnswerTile'
import { CountdownBar } from '~/components/CountdownBar'
import { Label } from '~/components/Label'
import { delay } from '~/lib/motion'
import type { HostView } from './types'
import { AnsweredCounter, HostHeader } from './HostHeader'

/** The intro only plays when the question has just started, not on a reload mid-question. */
const INTRO_WINDOW_MS = 1500
/** Seconds the screen content waits for the intro number to make way. */
const INTRO_OFFSET = 0.75
/** The question's words come in one after another, in at most this many seconds. */
const WORDS_SPAN = 0.8

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
  const [intro] = useState(
    () => q.timeLimitSec * 1000 - remainingMs < INTRO_WINDOW_MS,
  )
  const t0 = intro ? INTRO_OFFSET : 0
  const words = q.text.split(' ')
  const step = Math.min(0.055, WORDS_SPAN / words.length)
  return (
    <>
      {intro && (
        <div
          aria-hidden="true"
          className="rq-intro pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 bg-host-bg"
        >
          <Label className="text-[28px] text-host-muted">Vraag</Label>
          <span className="font-display text-[320px] leading-[.8] font-bold tracking-[-0.05em] text-host-text">
            {q.index + 1}
            <span className="text-[120px] tracking-display text-host-muted">
              {' '}
              / {q.total}
            </span>
          </span>
          <span className="rq-grow-x block h-3 w-[480px] rounded-pill bg-gradient-signal [animation-delay:.3s]" />
        </div>
      )}
      <div className="flex h-full flex-col gap-9 px-20 pt-16 pb-28">
        <div className="rq-rise" style={delay(t0)}>
          <HostHeader
            question={q}
            right={
              <AnsweredCounter
                answered={view.answeredCount}
                of={view.session.playerCount}
              />
            }
          />
        </div>
        <div className="flex items-end gap-16">
          <h1 className="m-0 max-w-[1440px] flex-1 font-display text-beamer-question leading-[1.08] font-bold tracking-display text-host-text">
            {/* Real spaces between the word boxes keep the line breaks where they were. */}
            {words.map((w, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span
                  className="rq-in inline-block"
                  style={delay(t0 + 0.1 + i * step)}
                >
                  {w}
                </span>
              </Fragment>
            ))}
          </h1>
          <div
            aria-label={`Nog ${secs} seconden`}
            className="rq-rise flex w-[220px] shrink-0 flex-col items-end gap-1"
            style={delay(t0 + 0.3)}
          >
            <span className="tabular font-display text-[168px] leading-[.86] font-bold tracking-hero text-host-text">
              <span key={secs} className={secs <= 5 ? 'rq-hurry' : 'rq-tick'}>
                {secs}
              </span>
            </span>
            <Label className="text-[20px] text-host-muted">
              {secs === 0 ? 'Tijd is om' : 'seconden'}
            </Label>
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
              enterDelay={t0 + 0.45 + i * 0.08}
            />
          ))}
        </div>
      </div>
    </>
  )
}
