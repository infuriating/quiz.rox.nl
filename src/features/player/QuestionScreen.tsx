import { useConvexMutation } from '@convex-dev/react-query'
import { useState } from 'react'
import { api } from '../../../convex/_generated/api'
import { AnswerButton } from '~/components/AnswerButton'
import { Badge } from '~/components/Badge'
import { Button } from '~/components/Button'
import { CountdownBar } from '~/components/CountdownBar'
import { Icon } from '~/components/Icon'
import { Label } from '~/components/Label'
import { errorCode } from '~/lib/errors'
import type { PlayerView } from './types'
import { PhoneFrame } from './PhoneFrame'

export function QuestionScreen({
  view,
  remainingMs,
  banner,
  offline,
  onLate,
}: {
  view: PlayerView
  remainingMs: number
  banner: React.ReactNode
  offline: boolean
  onLate: () => void
}) {
  const q = view.question!
  const submit = useConvexMutation(api.answers.submitAnswer)
  const [selected, setSelected] = useState<string[]>([])
  const [pending, setPending] = useState<string | null>(null)
  const multi = q.type === 'multi'

  async function send(optionIds: string[]) {
    setPending(optionIds[0])
    try {
      await submit({ sessionId: view.session.id, playerId: view.player.id, questionId: q.id, optionIds })
    } catch (e) {
      setPending(null)
      if (errorCode(e) === 'TOO_LATE' || errorCode(e) === 'WRONG_PHASE') onLate()
    }
  }

  const disabled = offline || pending !== null
  return (
    <PhoneFrame banner={banner}>
      <div className="flex flex-col gap-3.5 px-4 pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] text-ink">
            Vraag {q.index + 1} / {q.total}
          </Label>
          <Badge>{q.topic}</Badge>
        </div>
        <CountdownBar remainingMs={remainingMs} totalMs={q.timeLimitSec * 1000} />
        <p className="m-0 font-display text-phone-question leading-[1.25] font-semibold tracking-heading">{q.text}</p>
      </div>
      <div role={multi ? 'group' : undefined} aria-label={multi ? 'Antwoorden' : undefined} className={multi ? 'flex min-h-0 flex-1 flex-col gap-2.5 px-4 py-3' : 'flex min-h-0 flex-1 flex-col gap-3 px-4 py-5'}>
        {multi && (
          <p className="m-0 mb-0.5 flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Icon name="check" size={15} strokeWidth={2.4} />
            Selecteer alles wat van toepassing is
          </p>
        )}
        {q.options.map((o, i) => {
          if (multi) {
            const on = selected.includes(o.id)
            return (
              <AnswerButton
                key={o.id}
                index={i}
                text={o.text}
                multi
                state={disabled ? 'disabled' : on ? 'selected' : 'idle'}
                onClick={() => setSelected((s) => (on ? s.filter((x) => x !== o.id) : [...s, o.id]))}
              />
            )
          }
          return (
            <AnswerButton
              key={o.id}
              index={i}
              text={o.text}
              state={pending === o.id ? 'pressed' : disabled ? 'disabled' : 'idle'}
              onClick={() => void send([o.id])}
            />
          )
        })}
      </div>
      {multi && (
        <div className="px-4 pt-1 pb-5">
          <Button size="lg" full disabled={selected.length === 0 || disabled} onClick={() => void send(selected)}>
            {selected.length ? `Verstuur (${selected.length})` : 'Verstuur'}
          </Button>
        </div>
      )}
    </PhoneFrame>
  )
}
