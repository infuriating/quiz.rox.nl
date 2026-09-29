import { AnswerMarker } from '~/components/AnswerMarker'
import { AnswerTile } from '~/components/AnswerTile'
import { Badge } from '~/components/Badge'
import { DistributionBar } from '~/components/DistributionBar'
import { Icon } from '~/components/Icon'
import { Label } from '~/components/Label'
import { cn } from '~/lib/cn'
import { delay, useAfter, useSpring } from '~/lib/motion'
import type { HostView } from './types'
import { HostHeader } from './HostHeader'

/**
 * The distribution grows in neutral first; after this beat the correct answers turn green
 * and the rest dims. A poll has nothing to reveal and skips it.
 */
const REVEAL_BEAT_MS = 1600

/** Reveal with the explanation prominent on the right. Variant for questions that have one. */
function WithExplanation({ view }: { view: HostView }) {
  const q = view.question!
  const r = view.reveal!
  const total = view.session.playerCount
  const poll = q.type === 'poll'
  const shown = useAfter(poll ? 0 : REVEAL_BEAT_MS)
  const correctCount = useSpring(shown ? (r.correctCount ?? 0) : 0)
  return (
    <>
      <div className="absolute top-0 bottom-0 left-0 flex w-[1200px] flex-col gap-8 pt-16 pr-16 pb-28 pl-20">
        <div className="rq-rise">
          <HostHeader question={q} />
        </div>
        <h1 className="rq-in m-0 font-display text-[52px] [animation-delay:.08s] leading-[1.1] font-bold tracking-display text-host-text">
          {q.text}
        </h1>
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {q.options.map((o, i) => {
            const correct = r.correctOptionIds.includes(o.id)
            return (
              <AnswerTile
                key={o.id}
                index={i}
                text={o.text}
                textSize="long"
                state={poll || !shown ? 'idle' : correct ? 'correct' : 'dimmed'}
                count={r.distribution[i].count}
                total={total}
                enterDelay={0.3 + i * 0.06}
                barDelay={0.5 + i * 0.1}
              />
            )
          })}
        </div>
      </div>
      <aside className="absolute top-0 right-0 bottom-0 flex w-[720px] flex-col gap-9 bg-host-panel pt-24 pr-20 pb-[120px] pl-[72px]">
        <Label className="rq-fade text-[24px] text-host-accent [animation-delay:.2s]">
          Toelichting
        </Label>
        <p
          className="rq-in m-0 font-display text-beamer-h2 leading-[1.16] font-semibold tracking-heading text-host-text"
          style={delay(poll ? 0.3 : REVEAL_BEAT_MS / 1000 + 0.2)}
        >
          {r.explanation}
        </p>
        <div className="flex-1" />
        {r.correctCount !== null && (
          <div className="flex items-baseline gap-4 border-t border-host-panel-line pt-7">
            <span className="tabular font-display text-beamer-question leading-none font-bold tracking-display text-host-text">
              {Math.round(correctCount)} / {total}
            </span>
            <span className="text-beamer-body text-host-soft">
              deelnemers hadden het goed
            </span>
          </div>
        )}
      </aside>
    </>
  )
}

/** Reveal without an explanation: column chart of the distribution, compact tiles below. */
function Columns({ view }: { view: HostView }) {
  const q = view.question!
  const r = view.reveal!
  const total = Math.max(view.session.playerCount, 1)
  const poll = q.type === 'poll'
  const multiCorrect = r.correctOptionIds.length > 1
  const shown = useAfter(poll ? 0 : REVEAL_BEAT_MS)
  const label = r.distribution
    .map((d, i) => `${String.fromCharCode(65 + i)} ${d.count}`)
    .join(', ')
  return (
    <div className="flex h-full flex-col gap-7 px-20 pt-16 pb-28">
      <div className="rq-rise">
        <HostHeader
          question={{ ...q, type: 'single' }}
          right={
            poll ? (
              <Badge tone="host" size="beamer">
                Poll
              </Badge>
            ) : multiCorrect && shown ? (
              <span className="rox-label animate-pop rounded-pill bg-host-ok-bg px-5 py-2.5 text-[18px] text-host-ok-text">
                Meerdere antwoorden goed
              </span>
            ) : null
          }
        />
      </div>
      <h1 className="rq-in m-0 font-display text-beamer-h2 [animation-delay:.08s] leading-[1.08] font-bold tracking-display text-host-text">
        {q.text}
      </h1>
      <div
        role="img"
        aria-label={`Verdeling: ${label}`}
        className="flex h-[330px] gap-[72px] border-b-2 border-host-line px-[120px] pb-5"
      >
        {q.options.map((o, i) => {
          const correct = r.correctOptionIds.includes(o.id)
          return (
            <div
              key={o.id}
              className={cn(
                'flex h-full flex-1 basis-0 flex-col items-center gap-3.5 transition-opacity duration-500 ease-cut',
                shown && !poll && !correct && 'opacity-55',
              )}
            >
              <DistributionBar
                variant="column"
                count={r.distribution[i].count}
                total={total}
                correct={shown && correct}
                enterDelay={0.5 + i * 0.12}
              />
              <div className="flex items-center gap-4">
                <AnswerMarker index={i} size="column" tone="host" />
                {correct && shown ? (
                  <span className="rq-rise rox-label inline-flex items-center gap-2 text-[20px] text-host-ok-text">
                    <Icon name="check" size={20} strokeWidth={2.8} />
                    Goed
                  </span>
                ) : (
                  <span className="h-6" />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-4">
        {q.options.map((o, i) => (
          <AnswerTile
            key={o.id}
            index={i}
            text={o.text}
            textSize="compact"
            enterDelay={0.3 + i * 0.06}
            state={
              poll || !shown
                ? 'idle'
                : r.correctOptionIds.includes(o.id)
                  ? 'correct'
                  : 'dimmed'
            }
          />
        ))}
      </div>
    </div>
  )
}

export function HostReveal({ view }: { view: HostView }) {
  return view.reveal?.explanation ? (
    <WithExplanation view={view} />
  ) : (
    <Columns view={view} />
  )
}
