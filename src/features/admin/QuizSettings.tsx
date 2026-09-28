import { useConvexMutation } from '@convex-dev/react-query'
import { useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/Button'
import { Input, Textarea } from '~/components/Field'
import { Label } from '~/components/Label'
import { Switch } from '~/components/Switch'
import { errorMessage } from '~/lib/errors'
import { useAdminPin } from './pin'

/** Quiz-level settings: scoring toggle (off by default), optional participant cap, closing message. */
export function QuizSettings({ quiz }: { quiz: Doc<'quizzes'> }) {
  const pin = useAdminPin()
  const save = useConvexMutation(api.admin.updateQuizSettings)
  const [title, setTitle] = useState(quiz.title)
  const [scoring, setScoring] = useState(quiz.scoringEnabled)
  const [capOn, setCapOn] = useState(quiz.maxPlayers !== undefined)
  const [cap, setCap] = useState(String(quiz.maxPlayers ?? 15))
  const [outro, setOutro] = useState(quiz.outroMessage ?? '')
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  )

  async function submit() {
    setStatus(null)
    try {
      await save({
        pin,
        quizId: quiz._id,
        title,
        description: quiz.description,
        scoringEnabled: scoring,
        maxPlayers: capOn ? Number(cap) : undefined,
        outroMessage: outro,
      })
      setStatus({ ok: true, message: 'Opgeslagen. Geldt voor nieuwe sessies.' })
    } catch (e) {
      setStatus({ ok: false, message: errorMessage(e) })
    }
  }

  return (
    <section
      aria-label="Quizinstellingen"
      className="mx-2 flex flex-col gap-3.5 rounded-[14px] border border-ink-15 bg-ink-05 p-4"
    >
      <Label className="text-[11px] text-ink-55">Quizinstellingen</Label>
      <Input
        label="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Switch
        checked={scoring}
        onChange={setScoring}
        label="Score en tussenstand"
        hint="Punten, positie, tussenstand en podium. Staat standaard uit."
      />
      <Switch
        checked={capOn}
        onChange={setCapOn}
        label="Maximaal aantal deelnemers"
        hint="De lobby toont dan “van N” en wie daarna aanmeldt krijgt een melding dat de quiz vol is."
      />
      {capOn && (
        <Input
          label="Max. deelnemers"
          hideLabel
          type="number"
          min={1}
          max={500}
          inputMode="numeric"
          value={cap}
          onChange={(e) => setCap(e.target.value)}
        />
      )}
      <Textarea
        label="Afsluitende boodschap"
        rows={3}
        maxLength={120}
        value={outro}
        onChange={(e) => setOutro(e.target.value)}
        hint={`Op het eindscherm van spelers en beamer. ${outro.length} / 120, leeg = niet tonen.`}
        className="text-sm"
      />
      <div className="flex items-center gap-3">
        <Button size="sm" icon="check" onClick={() => void submit()}>
          Instellingen opslaan
        </Button>
      </div>
      {status && (
        <p
          className={
            status.ok
              ? 'm-0 text-[13px] text-mint-600'
              : 'm-0 text-[13px] text-error'
          }
        >
          {status.message}
        </p>
      )}
    </section>
  )
}
