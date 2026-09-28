import { Badge } from '~/components/Badge'
import { Label } from '~/components/Label'
import { formatScore } from '~/components/LeaderboardRow'
import type { PlayerView } from './types'
import { PhoneFrame } from './PhoneFrame'

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 basis-0 flex-col gap-1.5 rounded-[14px] bg-ink-10 p-4 text-left">
      <Label className="text-[11px] text-ink-55">{label}</Label>
      <span className="font-display text-[26px] leading-none font-bold">{value}</span>
    </div>
  )
}

export function FinalScreen({ view, banner }: { view: PlayerView; banner: React.ReactNode }) {
  const f = view.final!
  const s = view.session
  const scored = s.scoringEnabled && f.score
  return (
    <PhoneFrame banner={banner} right={<Badge tone="neutral">Afgerond</Badge>}>
      <div className="flex flex-1 flex-col gap-7 px-5 pt-9 pb-6">
        <div className="flex flex-col items-start gap-3">
          <Badge tone="gradient">{scored ? 'Eindstand' : 'Afgerond'}</Badge>
          <h1 className="m-0 font-display text-phone-title leading-[1.08] font-bold tracking-display">Bedankt voor het meedoen</h1>
          <p className="m-0 text-[17px] leading-[1.5] text-ink-70">Je deelname is geregistreerd.</p>
        </div>
        {scored && f.score ? (
          <>
            <div className="flex flex-col gap-5 rounded-lg bg-blue p-7 px-6 text-white">
              <div className="flex items-start justify-between">
                <Label className="text-xs text-veil">Jouw positie</Label>
                <Label className="text-xs text-veil">{view.player.name}</Label>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-display text-[96px] leading-[.9] font-bold tracking-hero">{f.score.rank}e</span>
                <span className="font-display text-[22px] font-semibold text-veil">van {s.playerCount}</span>
              </div>
              <div className="h-px bg-line-on-dark-strong" />
              <div className="flex items-baseline justify-between">
                <span className="text-base text-veil">Totaalscore</span>
                <span className="tabular font-display text-[32px] font-bold">{formatScore(f.score.total)}</span>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Stat value={`${f.score.correctCount} / ${s.totalQuestions}`} label="Goed" />
              <Stat value={`${f.questionsAnswered} / ${s.totalQuestions}`} label="Beantwoord" />
            </div>
          </>
        ) : (
          <>
            {s.outroMessage && (
              <div className="flex flex-col gap-4 rounded-lg bg-blue p-7 px-6 text-white">
                <Label className="text-xs text-veil">Om te onthouden</Label>
                <p className="m-0 font-display text-[26px] leading-[1.22] font-semibold tracking-heading">{s.outroMessage}</p>
              </div>
            )}
            <div className="flex gap-2.5">
              <Stat value={`${f.questionsAnswered} / ${s.totalQuestions}`} label="Vragen beantwoord" />
              <Stat value={String(s.playerCount)} label="Deelnemers" />
            </div>
          </>
        )}
        <div className="flex-1" />
        <p className="m-0 text-center text-[13px] text-ink-55">Solid Digital Products</p>
      </div>
    </PhoneFrame>
  )
}
