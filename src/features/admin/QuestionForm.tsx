import { useConvexMutation } from '@convex-dev/react-query'
import { useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { AnswerMarker, LETTERS } from '~/components/AnswerMarker'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { Input, Select, Textarea } from '~/components/Field'
import { Icon } from '~/components/Icon'
import { errorMessage } from '~/lib/errors'
import { cn } from '~/lib/cn'
import { useAdminPin } from './pin'

type Option = { id: string; text: string; correct: boolean }
type QType = Doc<'questions'>['type']

const TYPES: Array<{ value: QType; label: string; hint: string }> = [
  { value: 'single', label: 'Enkel antwoord', hint: 'Eén goed' },
  { value: 'multi', label: 'Meerdere antwoorden', hint: 'Een of meer goed' },
  { value: 'poll', label: 'Poll', hint: 'Geen goed antwoord' },
]
const TIME_LIMITS = [10, 20, 30, 45, 60, 90]

function nextOptionId(options: Array<Option>) {
  const used = new Set(options.map((o) => o.id))
  return (
    ['a', 'b', 'c', 'd', 'e', 'f'].find((id) => !used.has(id)) ??
    String(Date.now())
  )
}

const EMPTY: Array<Option> = [
  { id: 'a', text: '', correct: false },
  { id: 'b', text: '', correct: false },
  { id: 'c', text: '', correct: false },
  { id: 'd', text: '', correct: false },
]

export function QuestionForm({
  quizId,
  question,
  count,
  onSaved,
  onDeleted,
}: {
  quizId: Id<'quizzes'>
  question: Doc<'questions'> | null
  count: number
  onSaved: (id: Id<'questions'>) => void
  onDeleted: () => void
}) {
  const pin = useAdminPin()
  const save = useConvexMutation(api.admin.saveQuestion)
  const remove = useConvexMutation(api.admin.deleteQuestion)
  const move = useConvexMutation(api.admin.moveQuestion)
  const [topic, setTopic] = useState(question?.topic ?? '')
  const [text, setText] = useState(question?.text ?? '')
  const [type, setType] = useState<QType>(question?.type ?? 'single')
  const [options, setOptions] = useState<Array<Option>>(
    question?.options ?? EMPTY,
  )
  const [explanation, setExplanation] = useState(question?.explanation ?? '')
  const [timeLimitSec, setTimeLimitSec] = useState(question?.timeLimitSec ?? 30)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  )

  const setOption = (i: number, patch: Partial<Option>) =>
    setOptions((os) =>
      os.map((o, j) => {
        if (j === i) return { ...o, ...patch }
        // Single choice: marking one correct clears the others.
        if (patch.correct && type === 'single') return { ...o, correct: false }
        return o
      }),
    )

  async function submit() {
    setStatus(null)
    try {
      const id = await save({
        pin,
        quizId,
        questionId: question?._id,
        topic,
        text,
        type,
        options,
        explanation: explanation || undefined,
        timeLimitSec,
      })
      setStatus({ ok: true, message: 'Opgeslagen.' })
      onSaved(id)
    } catch (e) {
      setStatus({ ok: false, message: errorMessage(e) })
    }
  }

  const noCorrect = type !== 'poll' && !options.some((o) => o.correct)
  const order = question?.order ?? count + 1
  return (
    <main className="flex flex-1 flex-col gap-7 bg-ink-05 px-12 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="m-0 font-display text-[32px] font-bold tracking-display">
            {question ? `Vraag ${order}` : 'Nieuwe vraag'}
          </h1>
          {question && (
            <span className="flex gap-1">
              <button
                type="button"
                aria-label="Vraag omhoog"
                disabled={order <= 1}
                onClick={() =>
                  void move({
                    pin,
                    questionId: question._id,
                    toOrder: order - 1,
                  })
                }
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-ink-25 bg-white text-ink-70 disabled:opacity-40"
              >
                <Icon name="arrow-up" size={16} />
              </button>
              <button
                type="button"
                aria-label="Vraag omlaag"
                disabled={order >= count}
                onClick={() =>
                  void move({
                    pin,
                    questionId: question._id,
                    toOrder: order + 1,
                  })
                }
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-ink-25 bg-white text-ink-70 disabled:opacity-40"
              >
                <Icon name="arrow-down" size={16} />
              </button>
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {question && (
            <Button
              variant="ghost"
              size="md"
              icon="trash"
              onClick={() => {
                if (window.confirm('Deze vraag verwijderen?'))
                  void remove({ pin, questionId: question._id }).then(onDeleted)
              }}
            >
              Vraag verwijderen
            </Button>
          )}
          <Button size="md" icon="check" onClick={() => void submit()}>
            Opslaan
          </Button>
        </div>
      </div>
      {status && (
        <p
          className={cn(
            'm-0 -mt-3 text-sm',
            status.ok ? 'text-mint-600' : 'text-error',
          )}
        >
          {status.message}
        </p>
      )}

      <Card className="flex flex-col gap-6 p-7">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <Input
              label="Onderwerp"
              value={topic}
              maxLength={40}
              onChange={(e) => setTopic(e.target.value)}
              hint="Kort label boven de vraag."
            />
          </div>
          <Select
            label="Tijdslimiet"
            value={timeLimitSec}
            onChange={(e) => setTimeLimitSec(Number(e.target.value))}
          >
            {[...new Set([...TIME_LIMITS, timeLimitSec])]
              .sort((a, b) => a - b)
              .map((s) => (
                <option key={s} value={s}>
                  {s} seconden
                </option>
              ))}
          </Select>
        </div>
        <Textarea
          label="Vraag"
          rows={2}
          maxLength={200}
          value={text}
          onChange={(e) => setText(e.target.value)}
          hint={`${text.length} / 200 tekens. Tot ongeveer 130 blijft het op de beamer rustig.`}
        />
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="rox-label pb-2 text-xs text-ink">Type</legend>
          <div className="flex gap-3">
            {TYPES.map((t) => (
              <label
                key={t.value}
                className={cn(
                  'flex flex-1 basis-0 cursor-pointer items-center gap-3 rounded-sm px-4 py-3',
                  type === t.value
                    ? 'border-2 border-blue bg-blue-50'
                    : 'border border-ink-25 bg-white',
                )}
              >
                <input
                  type="radio"
                  name="type"
                  checked={type === t.value}
                  onChange={() => {
                    setType(t.value)
                    if (t.value === 'single')
                      setOptions((os) => {
                        const first = os.findIndex((o) => o.correct)
                        return os.map((o, i) => ({
                          ...o,
                          correct: i === first,
                        }))
                      })
                  }}
                  className="m-0 size-5 accent-[var(--rox-blue)]"
                />
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold">{t.label}</span>
                  <span className="text-[13px] text-ink-55">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card className="flex flex-col gap-4 p-7">
        <div className="flex items-center justify-between">
          <span className="rox-label text-xs text-ink">Antwoordopties</span>
          <span className="text-[13px] text-ink-55">
            {type === 'poll'
              ? 'Max. 140 tekens per optie · een poll heeft geen goed antwoord'
              : 'Max. 140 tekens per optie · markeer het goede antwoord'}
          </span>
        </div>
        {options.map((o, i) => (
          <div
            key={o.id}
            className={cn(
              'flex items-center gap-3',
              dragFrom === i && 'opacity-50',
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom === null || dragFrom === i) return
              setOptions((os) => {
                const copy = [...os]
                const [m] = copy.splice(dragFrom, 1)
                copy.splice(i, 0, m)
                return copy
              })
              setDragFrom(null)
            }}
          >
            <span
              draggable
              onDragStart={() => setDragFrom(i)}
              onDragEnd={() => setDragFrom(null)}
              aria-hidden="true"
              className="flex size-7 cursor-grab items-center justify-center text-ink-40"
            >
              <Icon name="grip" size={18} />
            </span>
            <AnswerMarker index={i} size="admin" />
            <div className="flex-1">
              <Input
                label={`Optie ${LETTERS[i]}`}
                hideLabel
                maxLength={140}
                value={o.text}
                onChange={(e) => setOption(i, { text: e.target.value })}
                className={
                  o.correct && type !== 'poll'
                    ? 'border-success bg-mint-100'
                    : undefined
                }
              />
            </div>
            {type !== 'poll' && (
              <label
                className={cn(
                  'box-border flex h-12 w-[132px] shrink-0 cursor-pointer items-center gap-2.5 rounded-pill border px-3.5 text-sm font-semibold',
                  o.correct
                    ? 'border-success bg-success text-white'
                    : 'border-ink-25 bg-white text-ink-70',
                )}
              >
                <input
                  type="checkbox"
                  checked={o.correct}
                  onChange={(e) => setOption(i, { correct: e.target.checked })}
                  className="m-0 size-[18px] accent-[var(--rox-mint-600)]"
                />
                Goed
              </label>
            )}
            <button
              type="button"
              aria-label={`Optie ${LETTERS[i]} verwijderen`}
              disabled={options.length <= 2}
              onClick={() => setOptions((os) => os.filter((_, j) => j !== i))}
              className="flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-ink-55 disabled:opacity-30"
            >
              <Icon name="trash" size={17} />
            </button>
          </div>
        ))}
        {options.length < 4 && (
          <div>
            <Button
              variant="outline"
              size="sm"
              icon="plus"
              onClick={() =>
                setOptions((os) => [
                  ...os,
                  { id: nextOptionId(os), text: '', correct: false },
                ])
              }
            >
              Optie toevoegen
            </Button>
          </div>
        )}
        {noCorrect && (
          <p className="m-0 text-sm text-error">
            Markeer minstens één goed antwoord. Zonder goed antwoord kan de quiz
            niet starten.
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-2 p-7">
        <Textarea
          label="Toelichting"
          rows={3}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          hint="Verschijnt groot op de beamer bij het resultaat. Laat leeg om zonder toelichting te tonen."
        />
      </Card>
    </main>
  )
}
