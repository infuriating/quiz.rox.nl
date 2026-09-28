import { AnswerMarker } from '~/components/AnswerMarker'
import { Icon } from '~/components/Icon'
import { Label } from '~/components/Label'
import { StatusDisc } from '~/components/StatusDisc'
import type { PlayerView } from './types'
import { CenterMessage, PhoneFrame } from './PhoneFrame'

export function ReceivedScreen({
  view,
  banner,
}: {
  view: PlayerView
  banner: React.ReactNode
}) {
  const q = view.question!
  const picked = q.options
    .map((o, i) => ({ ...o, i }))
    .filter((o) => view.myAnswer?.optionIds.includes(o.id))
  const pct = view.session.playerCount
    ? (view.answeredCount / view.session.playerCount) * 100
    : 0
  return (
    <PhoneFrame banner={banner}>
      <CenterMessage
        icon={
          <StatusDisc tone="blue">
            <Icon name="check" size={48} strokeWidth={2.6} />
          </StatusDisc>
        }
        title="Antwoord ontvangen"
        sub="Zodra iedereen heeft geantwoord zie je hier of je het goed had."
      >
        <div className="mt-3 flex w-full flex-col gap-6">
          <div className="flex w-full flex-col gap-2 rounded-md bg-blue-100 py-3 pr-4 pl-3 text-left">
            <Label className="text-[11px] text-blue-600">
              {picked.length > 1 ? 'Jouw antwoorden' : 'Jouw antwoord'}
            </Label>
            {picked.map((o) => (
              <div key={o.id} className="flex items-center gap-3">
                <AnswerMarker index={o.i} tone="accent" />
                <span className="text-base font-medium">{o.text}</span>
              </div>
            ))}
          </div>
          <div role="status" className="flex w-full flex-col gap-2.5">
            <div className="flex justify-between text-sm text-ink-55">
              <span>Wachten op de anderen</span>
              <span className="font-display font-semibold text-ink">
                {view.answeredCount} / {view.session.playerCount}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-pill bg-ink-15">
              <div
                className="h-full rounded-pill bg-ink transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </CenterMessage>
    </PhoneFrame>
  )
}

export function LateScreen({
  view,
  banner,
}: {
  view: PlayerView
  banner: React.ReactNode
}) {
  const score = view.reveal?.score
  return (
    <PhoneFrame banner={banner}>
      <CenterMessage
        icon={
          <StatusDisc tone="neutral">
            <Icon name="clock" size={48} strokeWidth={2.2} />
          </StatusDisc>
        }
        title="Te laat"
        sub="De tijd was op voordat je koos. Bij de volgende vraag ben je er gewoon weer bij."
      >
        {view.session.scoringEnabled && score ? (
          <div className="mt-2 flex flex-col items-center gap-1.5">
            <Label className="text-xs text-ink-55">Deze vraag</Label>
            <span className="font-display text-[28px] font-bold">0 punten</span>
            <span className="text-[15px] text-ink-55">
              Je staat {score.rank}e van {view.session.playerCount}
            </span>
          </div>
        ) : (
          <p className="m-0 mt-2 text-[15px] text-ink-55">
            Kijk mee op het scherm voor het antwoord.
          </p>
        )}
      </CenterMessage>
    </PhoneFrame>
  )
}
