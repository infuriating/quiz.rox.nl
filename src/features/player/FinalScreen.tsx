import { Badge } from '~/components/Badge'
import { Label } from '~/components/Label'
import { formatScore } from '~/components/LeaderboardRow'
import { delay, useSpring } from '~/lib/motion'
import type { PlayerView } from './types'
import { PhoneFrame } from './PhoneFrame'

function Stat({
  value,
  label,
  at,
}: {
  value: string
  label: string
  at: number
}) {
  return (
    <div
      className="rq-rise flex flex-1 basis-0 flex-col gap-1.5 rounded-[14px] bg-ink-10 p-4 text-left"
      style={delay(at)}
    >
      <Label className="text-[11px] text-ink-55">{label}</Label>
      <span className="font-display text-[26px] leading-none font-bold">
        {value}
      </span>
    </div>
  )
}

export function FinalScreen({
  view,
  banner,
}: {
  view: PlayerView
  banner: React.ReactNode
}) {
  const f = view.final!
  const s = view.session
  const scored = s.scoringEnabled && f.score
  // The rank counts down from the back of the field, the total counts up.
  const rank = useSpring(f.score?.rank ?? 0, {
    from: Math.max(s.playerCount ?? 0, f.score?.rank ?? 0),
    delay: 800,
  })
  const totalScore = useSpring(f.score?.total ?? 0, { delay: 900 })
  return (
    <PhoneFrame banner={banner} right={<Badge tone="neutral">Afgerond</Badge>}>
      <div className="flex flex-1 flex-col gap-7 px-5 pt-9 pb-6">
        <div className="flex flex-col items-start gap-3">
          <Badge
            tone="gradient"
            className="relative animate-pop overflow-hidden"
          >
            {scored ? 'Eindstand' : 'Afgerond'}
            <span className="rq-sheen [animation-delay:.5s]" />
          </Badge>
          <h1 className="rq-in m-0 font-display text-phone-title leading-[1.08] font-bold tracking-display [animation-delay:.12s]">
            Bedankt voor het meedoen
          </h1>
          <p className="rq-in m-0 text-[17px] [animation-delay:.24s] leading-[1.5] text-ink-70">
            {s.endReason === 'expired'
              ? 'Deze sessie is verlopen. Je antwoorden tot nu toe zijn geregistreerd.'
              : 'Je deelname is geregistreerd.'}
          </p>
        </div>
        {scored && f.score ? (
          <>
            <div className="rq-card-up rounded-lg [animation-delay:.55s]">
              <div className="rq-glow relative flex flex-col gap-5 overflow-hidden rounded-lg bg-blue p-7 px-6 text-white [animation-delay:1.8s]">
                <div className="flex items-start justify-between">
                  <Label className="text-xs text-veil">Jouw positie</Label>
                  <Label className="text-xs text-veil">
                    {view.player.name}
                  </Label>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="tabular font-display text-[96px] leading-[.9] font-bold tracking-hero">
                    {Math.round(rank)}e
                  </span>
                  <span className="font-display text-[22px] font-semibold text-veil">
                    van {s.playerCount ?? 0}
                  </span>
                </div>
                <div className="h-px bg-line-on-dark-strong" />
                <div className="flex items-baseline justify-between">
                  <span className="text-base text-veil">Totaalscore</span>
                  <span className="tabular font-display text-[32px] font-bold">
                    {formatScore(Math.round(totalScore))}
                  </span>
                </div>
                <span className="rq-sheen [--rq-sheen:rgba(255,255,255,.35)] [animation-delay:2s]" />
              </div>
            </div>
            <div className="flex gap-2.5">
              <Stat
                value={`${f.score.correctCount} / ${s.totalQuestions}`}
                label="Goed"
                at={1.3}
              />
              <Stat
                value={`${f.questionsAnswered} / ${s.totalQuestions}`}
                label="Beantwoord"
                at={1.38}
              />
            </div>
          </>
        ) : (
          <>
            {s.outroMessage && (
              <div className="rq-card-up flex flex-col gap-4 rounded-lg bg-blue p-7 px-6 text-white [animation-delay:.55s]">
                <Label className="text-xs text-veil">Om te onthouden</Label>
                <p className="m-0 font-display text-[26px] leading-[1.22] font-semibold tracking-heading">
                  {s.outroMessage}
                </p>
              </div>
            )}
            <div className="flex gap-2.5">
              <Stat
                value={`${f.questionsAnswered} / ${s.totalQuestions}`}
                label="Vragen beantwoord"
                at={1.3}
              />
              <Stat
                value={String(s.playerCount ?? 0)}
                label="Deelnemers"
                at={1.38}
              />
            </div>
          </>
        )}
        <div className="flex-1" />
        <p className="rq-fade m-0 text-center text-[13px] text-ink-55 [animation-delay:2s]">
          Solid Digital Products
        </p>
      </div>
    </PhoneFrame>
  )
}
