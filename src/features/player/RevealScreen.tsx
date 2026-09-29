import { AnswerButton } from '~/components/AnswerButton'
import { Burst } from '~/components/Burst'
import { Icon } from '~/components/Icon'
import { Label } from '~/components/Label'
import { StatusDisc } from '~/components/StatusDisc'
import { cn } from '~/lib/cn'
import { delay, useAfter, useSpring, vars } from '~/lib/motion'
import type { PlayerView } from './types'
import { PhoneFrame } from './PhoneFrame'

type Score = NonNullable<NonNullable<PlayerView['reveal']>['score']>

/** Rises in at `at` seconds, shows the previous position, then ticks to the new one. */
function RankCard({ score, of, at }: { score: Score; of: number; at: number }) {
  const delta = score.previousRank - score.rank
  const up = delta > 0
  const moved = useAfter((at + 0.55) * 1000)
  const shown = moved ? score.rank : score.previousRank
  return (
    <div
      className="rq-rise flex w-full items-center justify-between rounded-md border border-ink-15 bg-white p-5 shadow-card"
      style={delay(at)}
    >
      <span className="flex flex-col gap-1.5 text-left">
        <Label className="text-[11px] text-ink-55">Positie</Label>
        <span className="font-display text-[32px] leading-none font-bold">
          <span key={shown} className="rq-tick">
            {shown}e
          </span>
          <span className="text-lg font-semibold text-ink-55"> van {of}</span>
        </span>
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-semibold',
          up ? 'bg-mint-100 text-mint-600' : 'bg-ink-10 text-ink-70',
          moved ? 'animate-pop' : 'invisible',
        )}
      >
        <Icon
          name={up ? 'arrow-up' : delta < 0 ? 'arrow-down' : 'minus'}
          size={14}
          strokeWidth={2.6}
        />
        {delta === 0
          ? 'Zelfde plek'
          : `${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'plek' : 'plekken'}`}
      </span>
    </div>
  )
}

function Peers({ children, at }: { children: React.ReactNode; at: number }) {
  return (
    <div
      className="rq-rise flex w-full items-center gap-3.5 rounded-md bg-ink-10 px-5 py-[18px] text-left"
      style={delay(at)}
    >
      <Icon name="users" size={22} className="text-ink-70" />
      <span className="text-base leading-[1.45] text-ink">{children}</span>
    </div>
  )
}

/** The check draws itself in once the disc has popped. */
function DrawnCheck({
  size,
  strokeWidth,
}: {
  size: number
  strokeWidth: number
}) {
  return (
    <span className="rq-draw flex" style={vars({ '--rq-delay': '.28s' })}>
      <Icon name="check" size={size} strokeWidth={strokeWidth} />
    </span>
  )
}

function deelnemers(n: number) {
  return n === 1 ? 'deelnemer' : 'deelnemers'
}

export function RevealScreen({
  view,
  banner,
}: {
  view: PlayerView
  banner: React.ReactNode
}) {
  const q = view.question!
  const r = view.reveal!
  const total = view.session.playerCount ?? 0
  const mine = view.myAnswer!.optionIds
  const indexed = q.options.map((o, i) => ({ ...o, i }))
  const correctOpts = indexed.filter((o) => r.correctOptionIds.includes(o.id))
  const myOpts = indexed.filter((o) => mine.includes(o.id))
  const points = useSpring(r.score?.points ?? 0, { delay: 550 })

  if (q.type === 'poll') {
    return (
      <PhoneFrame banner={banner}>
        <div className="flex flex-1 flex-col items-center gap-7 px-5 pt-8 pb-6 text-center">
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-7">
            <StatusDisc tone="blue" size={120} pop rings="once">
              <DrawnCheck size={56} strokeWidth={2.8} />
            </StatusDisc>
            <h1 className="rq-in m-0 font-display text-[44px] leading-none font-bold tracking-display [animation-delay:.3s]">
              Bedankt voor je stem
            </h1>
            <div className="flex h-20 w-full">
              {myOpts[0] && (
                <AnswerButton
                  index={myOpts[0].i}
                  text={myOpts[0].text}
                  state="selected"
                  enterDelay={0.5}
                />
              )}
            </div>
          </div>
          <Peers at={0.8}>
            <b>
              {r.pickedSameCount} van {total}
            </b>{' '}
            {deelnemers(total)} kozen dit ook.
          </Peers>
        </div>
      </PhoneFrame>
    )
  }

  if (r.correct) {
    return (
      <PhoneFrame banner={banner}>
        <div className="flex flex-1 flex-col items-center gap-7 px-5 pt-8 pb-6 text-center">
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-7">
            <StatusDisc
              tone="success"
              size={120}
              pop
              rings="once"
              burst={<Burst />}
            >
              <DrawnCheck size={56} strokeWidth={2.8} />
            </StatusDisc>
            <h1 className="rq-in m-0 font-display text-phone-hero leading-none font-bold tracking-display [animation-delay:.35s]">
              Goed!
            </h1>
            {view.session.scoringEnabled && r.score ? (
              <div className="flex flex-col items-center gap-1.5">
                <Label className="rq-rise text-xs text-mint-600 [animation-delay:.5s]">
                  Deze vraag
                </Label>
                <span className="rq-rise tabular font-display text-[64px] leading-none font-bold tracking-display [animation-delay:.55s]">
                  +{Math.round(points)}
                </span>
                <span className="rq-fade text-[15px] text-ink-55 [animation-delay:.8s]">
                  punten
                </span>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-2.5">
                {myOpts.map((o, k) => (
                  <AnswerButton
                    key={o.id}
                    index={o.i}
                    text={o.text}
                    state="correct"
                    enterDelay={0.55 + k * 0.08}
                  />
                ))}
              </div>
            )}
          </div>
          {view.session.scoringEnabled && r.score ? (
            <RankCard score={r.score} of={total} at={0.95} />
          ) : (
            <Peers at={0.95}>
              <b>
                {r.pickedSameCount} van {total}
              </b>{' '}
              {deelnemers(total)} kozen dit ook.
            </Peers>
          )}
          <p className="rq-fade m-0 text-sm text-ink-55 [animation-delay:1.3s]">
            Kijk mee op het scherm.
          </p>
        </div>
      </PhoneFrame>
    )
  }

  // Incorrect: encouraging, never mocking. Show the correct option(s) and your own pick.
  const wrongPicks = myOpts.filter((o) => !r.correctOptionIds.includes(o.id))
  return (
    <PhoneFrame banner={banner}>
      <div className="flex flex-1 flex-col gap-6 px-5 pt-8 pb-6 text-center">
        <div className="flex flex-col items-center gap-4 pt-3">
          <StatusDisc tone="neutral" size={96} className="rq-settle">
            <span className="rq-circle-back flex">
              <Icon name="rotate" size={44} strokeWidth={2.2} />
            </span>
          </StatusDisc>
          <h1 className="rq-in m-0 font-display text-[48px] leading-none font-bold tracking-display [animation-delay:.3s]">
            Helaas
          </h1>
          <p className="rq-in m-0 text-[17px] leading-[1.5] text-ink-70 [animation-delay:.42s]">
            Deze keer niet. Op het scherm bespreken we waarom.
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 text-left">
          <Label className="rq-rise text-xs text-mint-600 [animation-delay:.7s]">
            {correctOpts.length > 1
              ? 'De goede antwoorden'
              : 'Het goede antwoord'}
          </Label>
          <div className="flex min-h-0 flex-col gap-2.5">
            {/* The right answer rises in as idle, then settles to mint. */}
            {correctOpts.map((o, k) => (
              <div
                key={o.id}
                className="rq-rise flex"
                style={delay(0.8 + k * 0.08)}
              >
                <AnswerButton
                  index={o.i}
                  text={o.text}
                  state="correct"
                  className="rq-ok-in [animation-delay:1.35s]"
                />
              </div>
            ))}
            {wrongPicks.map((o, k) => (
              <AnswerButton
                key={o.id}
                index={o.i}
                text={o.text}
                state="incorrect"
                enterDelay={0.9 + (correctOpts.length + k) * 0.08}
              />
            ))}
          </div>
        </div>
        {view.session.scoringEnabled && r.score ? (
          <RankCard score={r.score} of={total} at={1.9} />
        ) : (
          <Peers at={1.9}>
            <b>
              {r.correctCount ?? 0} van {total}
            </b>{' '}
            {deelnemers(total)} hadden het goed.
          </Peers>
        )}
      </div>
    </PhoneFrame>
  )
}
