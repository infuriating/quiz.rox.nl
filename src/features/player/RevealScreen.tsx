import { AnswerButton } from '~/components/AnswerButton'
import { Icon } from '~/components/Icon'
import { Label } from '~/components/Label'
import { StatusDisc } from '~/components/StatusDisc'
import { cn } from '~/lib/cn'
import type { PlayerView } from './types'
import { PhoneFrame } from './PhoneFrame'

type Score = NonNullable<NonNullable<PlayerView['reveal']>['score']>

function RankCard({ score, of }: { score: Score; of: number }) {
  const delta = score.previousRank - score.rank
  const up = delta > 0
  return (
    <div className="flex w-full items-center justify-between rounded-md border border-ink-15 bg-white p-5 shadow-card">
      <span className="flex flex-col gap-1.5 text-left">
        <Label className="text-[11px] text-ink-55">Positie</Label>
        <span className="font-display text-[32px] leading-none font-bold">
          {score.rank}e
          <span className="text-lg font-semibold text-ink-55"> van {of}</span>
        </span>
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-semibold',
          up ? 'bg-mint-100 text-mint-600' : 'bg-ink-10 text-ink-70',
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

function Peers({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full items-center gap-3.5 rounded-md bg-ink-10 px-5 py-[18px] text-left">
      <Icon name="users" size={22} className="text-ink-70" />
      <span className="text-base leading-[1.45] text-ink">{children}</span>
    </div>
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
  const total = view.session.playerCount
  const mine = view.myAnswer!.optionIds
  const indexed = q.options.map((o, i) => ({ ...o, i }))
  const correctOpts = indexed.filter((o) => r.correctOptionIds.includes(o.id))
  const myOpts = indexed.filter((o) => mine.includes(o.id))

  if (q.type === 'poll') {
    return (
      <PhoneFrame banner={banner}>
        <div className="flex flex-1 flex-col items-center gap-7 px-5 pt-8 pb-6 text-center">
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-7">
            <StatusDisc tone="blue" size={120}>
              <Icon name="check" size={56} strokeWidth={2.8} />
            </StatusDisc>
            <h1 className="m-0 font-display text-[44px] leading-none font-bold tracking-display">
              Bedankt voor je stem
            </h1>
            <div className="flex h-20 w-full">
              {myOpts[0] && (
                <AnswerButton
                  index={myOpts[0].i}
                  text={myOpts[0].text}
                  state="selected"
                />
              )}
            </div>
          </div>
          <Peers>
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
            <StatusDisc tone="success" size={120} pop>
              <Icon name="check" size={56} strokeWidth={2.8} />
            </StatusDisc>
            <h1 className="m-0 font-display text-phone-hero leading-none font-bold tracking-display">
              Goed!
            </h1>
            {view.session.scoringEnabled && r.score ? (
              <div className="flex flex-col items-center gap-1.5">
                <Label className="text-xs text-mint-600">Deze vraag</Label>
                <span className="tabular font-display text-[64px] leading-none font-bold tracking-display">
                  +{r.score.points}
                </span>
                <span className="text-[15px] text-ink-55">punten</span>
              </div>
            ) : (
              <div
                className="flex w-full flex-col gap-2.5"
                style={{ height: myOpts.length > 1 ? 170 : 80 }}
              >
                {myOpts.map((o) => (
                  <AnswerButton
                    key={o.id}
                    index={o.i}
                    text={o.text}
                    state="correct"
                  />
                ))}
              </div>
            )}
          </div>
          {view.session.scoringEnabled && r.score ? (
            <RankCard score={r.score} of={total} />
          ) : (
            <Peers>
              <b>
                {r.pickedSameCount} van {total}
              </b>{' '}
              {deelnemers(total)} kozen dit ook.
            </Peers>
          )}
          <p className="m-0 text-sm text-ink-55">Kijk mee op het scherm.</p>
        </div>
      </PhoneFrame>
    )
  }

  // Incorrect: encouraging, never mocking. Show the correct option(s) and your own pick.
  const wrongPicks = myOpts.filter((o) => !r.correctOptionIds.includes(o.id))
  const rows = correctOpts.length + wrongPicks.length
  return (
    <PhoneFrame banner={banner}>
      <div className="flex flex-1 flex-col gap-6 px-5 pt-8 pb-6 text-center">
        <div className="flex flex-col items-center gap-4 pt-3">
          <StatusDisc tone="neutral" size={96}>
            <Icon name="rotate" size={44} strokeWidth={2.2} />
          </StatusDisc>
          <h1 className="m-0 font-display text-[48px] leading-none font-bold tracking-display">
            Helaas
          </h1>
          <p className="m-0 text-[17px] leading-[1.5] text-ink-70">
            Deze keer niet. Op het scherm bespreken we waarom.
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 text-left">
          <Label className="text-xs text-mint-600">
            {correctOpts.length > 1
              ? 'De goede antwoorden'
              : 'Het goede antwoord'}
          </Label>
          <div
            className="flex min-h-0 flex-col gap-2.5"
            style={{ height: Math.min(rows, 4) * 88 }}
          >
            {correctOpts.map((o) => (
              <AnswerButton
                key={o.id}
                index={o.i}
                text={o.text}
                state="correct"
              />
            ))}
            {wrongPicks.map((o) => (
              <AnswerButton
                key={o.id}
                index={o.i}
                text={o.text}
                state="incorrect"
              />
            ))}
          </div>
        </div>
        {view.session.scoringEnabled && r.score ? (
          <RankCard score={r.score} of={total} />
        ) : (
          <Peers>
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
