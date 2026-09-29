import { AnswerMarker } from '~/components/AnswerMarker'
import { Icon } from '~/components/Icon'
import { Label } from '~/components/Label'
import { StatusDisc } from '~/components/StatusDisc'
import { vars } from '~/lib/motion'
import type { PlayerView } from './types'
import { CenterMessage, PhoneFrame, WaitingDots } from './PhoneFrame'

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
  return (
    <PhoneFrame banner={banner}>
      <CenterMessage
        icon={
          <StatusDisc tone="blue" pop rings="pulse" size={112}>
            <span
              className="rq-draw flex"
              style={vars({ '--rq-delay': '.25s' })}
            >
              <Icon name="check" size={48} strokeWidth={2.6} />
            </span>
          </StatusDisc>
        }
        title="Antwoord ontvangen"
        sub="Zodra iedereen heeft geantwoord zie je hier of je het goed had."
      >
        <div className="mt-3 flex w-full flex-col gap-6">
          <div className="rq-rise flex w-full flex-col gap-2 rounded-md bg-blue-100 py-3 pr-4 pl-3 text-left [animation-delay:.4s]">
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
          <div
            role="status"
            className="rq-rise flex justify-center [animation-delay:.5s]"
          >
            <WaitingDots label="Wachten op de anderen" />
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
          <StatusDisc tone="neutral" className="rq-settle">
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
              Je staat {score.rank}e van {view.session.playerCount ?? 0}
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
