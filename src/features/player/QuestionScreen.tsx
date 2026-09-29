import { useConvexMutation } from '@convex-dev/react-query'
import { useEffect, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import { AnswerButton } from '~/components/AnswerButton'
import { Badge } from '~/components/Badge'
import { Button } from '~/components/Button'
import { CountdownBar } from '~/components/CountdownBar'
import { Icon } from '~/components/Icon'
import { Label } from '~/components/Label'
import { cn } from '~/lib/cn'
import { errorCode } from '~/lib/errors'
import type { PlayerView } from './types'
import { PhoneFrame } from './PhoneFrame'

/** Questions longer than this use a smaller size on the phone. */
const LONG_QUESTION = 100

/** A–D or 1–4 → option index; anything else → null. */
function optionIndexForKey(key: string): number | null {
  const k = key.toLowerCase()
  const letter = 'abcd'.indexOf(k)
  if (letter !== -1) return letter
  const digit = '1234'.indexOf(k)
  return digit !== -1 ? digit : null
}

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
  const [selected, setSelected] = useState<Array<string>>([])
  const [pending, setPending] = useState<string | null>(null)
  const multi = q.type === 'multi'
  const disabled = offline || pending !== null

  async function send(optionIds: Array<string>) {
    setPending(optionIds[0])
    try {
      await submit({
        sessionId: view.session.id,
        playerId: view.player.id,
        questionId: q.id,
        optionIds,
      })
    } catch (e) {
      setPending(null)
      if (errorCode(e) === 'TOO_LATE' || errorCode(e) === 'WRONG_PHASE')
        onLate()
    }
  }

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    )

  // Keyboard shortcuts for desktop players: A–D / 1–4 pick an option (toggle for
  // multi), Enter sends a multi-select. Ignored while typing or with modifiers.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
        return
      if (multi && e.key === 'Enter' && selected.length > 0) {
        e.preventDefault()
        void send(selected)
        return
      }
      const index = optionIndexForKey(e.key)
      const option = index === null ? undefined : q.options[index]
      if (!option) return
      e.preventDefault()
      if (multi) toggle(option.id)
      else void send([option.id])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const counter = (
    <>
      Vraag {q.index + 1} / {q.total}
    </>
  )
  const countdown = (
    <CountdownBar remainingMs={remainingMs} totalMs={q.timeLimitSec * 1000} />
  )

  return (
    <PhoneFrame
      banner={banner}
      wide
      right={
        <Label className="hidden text-[13px] text-ink md:inline">
          {counter}
        </Label>
      }
    >
      <div className="flex flex-col gap-3.5 px-4 pt-4 md:gap-5 md:px-8 md:pt-7">
        <div className="rq-rise flex items-center justify-between">
          <Label className="text-[13px] text-ink md:hidden">{counter}</Label>
          <Badge>{q.topic}</Badge>
          <div className="hidden w-[360px] md:block">{countdown}</div>
        </div>
        <div className="md:hidden">{countdown}</div>
        <p
          className={cn(
            'rq-in m-0 font-display leading-[1.25] font-semibold [animation-delay:.2s] tracking-heading md:max-w-[880px] md:text-[28px] md:leading-[1.22]',
            // A long question leaves the answers too little room on a phone.
            q.text.length > LONG_QUESTION
              ? 'text-[17px]'
              : 'text-phone-question',
          )}
        >
          {q.text}
        </p>
      </div>
      {multi && (
        <p className="rq-fade m-0 flex items-center gap-2 px-4 pt-3 text-sm [animation-delay:.35s] font-semibold text-blue-600 md:px-8 md:pt-5 md:text-[15px]">
          <Icon name="check" size={15} strokeWidth={2.4} />
          Selecteer alles wat van toepassing is
        </p>
      )}
      <div
        role={multi ? 'group' : undefined}
        aria-label={multi ? 'Antwoorden' : undefined}
        className={
          multi
            ? 'flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3 md:grid md:overflow-visible md:grid-cols-2 md:grid-rows-2 md:gap-4 md:px-8 md:py-5'
            : 'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 md:grid md:overflow-visible md:grid-cols-2 md:grid-rows-2 md:gap-4 md:px-8'
        }
      >
        {q.options.map((o, i) => {
          if (multi) {
            const on = selected.includes(o.id)
            return (
              <AnswerButton
                key={o.id}
                index={i}
                text={o.text}
                multi
                className="md:min-h-24"
                enterDelay={0.45 + i * 0.07}
                state={disabled ? 'disabled' : on ? 'selected' : 'idle'}
                onClick={() => toggle(o.id)}
              />
            )
          }
          return (
            <AnswerButton
              key={o.id}
              index={i}
              text={o.text}
              className="md:min-h-24"
              enterDelay={0.45 + i * 0.07}
              state={
                pending === o.id
                  ? 'pressed'
                  : pending !== null
                    ? 'dimmed'
                    : disabled
                      ? 'disabled'
                      : 'idle'
              }
              onClick={() => void send([o.id])}
            />
          )
        })}
      </div>
      <div
        className={cn(
          'items-center justify-between gap-6 px-4 pt-1 pb-5 md:px-8 md:pt-0 md:pb-7',
          // Single choice has no footer on the phone: the tap submits.
          multi ? 'flex' : 'hidden md:flex',
        )}
      >
        <span className="hidden text-[13px] text-ink-55 md:inline">
          {multi
            ? 'Kies met A–D of 1–4, verstuur met Enter.'
            : 'Kies met de toetsen A–D of 1–4.'}
        </span>
        {multi && (
          <Button
            size="lg"
            full
            className="md:w-[280px]"
            disabled={selected.length === 0 || disabled}
            onClick={() => void send(selected)}
          >
            {selected.length ? `Verstuur (${selected.length})` : 'Verstuur'}
          </Button>
        )}
      </div>
    </PhoneFrame>
  )
}
