import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/Badge'
import { Button } from '~/components/Button'
import { Label } from '~/components/Label'
import { errorMessage } from '~/lib/errors'

/** After the PIN: pick a quiz and open its lobby. Beamer style, one button per quiz. */
export function QuizPicker({ pin, onCreated }: { pin: string; onCreated: (sessionId: Id<'sessions'>, hostToken: string) => void }) {
  const { data: quizzes } = useQuery(convexQuery(api.admin.listQuizzes, { pin }))
  const create = useConvexMutation(api.sessions.createSession)
  const [error, setError] = useState<{ id: string; message: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function open(quizId: Id<'quizzes'>) {
    setBusy(quizId)
    setError(null)
    try {
      const { sessionId, hostToken } = await create({ pin, quizId })
      onCreated(sessionId, hostToken)
    } catch (e) {
      setError({ id: quizId, message: errorMessage(e) })
      setBusy(null)
    }
  }

  return (
    <div className="flex h-full flex-col gap-12 px-60 pt-24 pb-24">
      <Label className="text-beamer-label text-host-muted">Host</Label>
      <h1 className="m-0 font-display text-beamer-title leading-none font-bold tracking-hero text-host-text">Kies een quiz</h1>
      <ul className="m-0 flex list-none flex-col gap-4 overflow-hidden p-0">
        {(quizzes ?? []).map((q) => (
          <li key={q.id} className="flex items-center gap-8 rounded-lg border-2 border-host-hair bg-host-raised px-10 py-7">
            <div className="flex flex-1 flex-col gap-2">
              <span className="flex items-center gap-4">
                <span className="font-display text-beamer-h3 font-semibold tracking-heading text-host-text">{q.title}</span>
                {q.scoringEnabled && (
                  <Badge tone="host" size="beamer">
                    Score aan
                  </Badge>
                )}
              </span>
              <span className="text-[22px] text-host-muted">
                {q.questionCount} vragen{q.maxPlayers ? ` · max. ${q.maxPlayers} deelnemers` : ''}
              </span>
              {error?.id === q.id && <span className="text-[22px] text-error">{error.message}</span>}
            </div>
            <Button size="lg" iconRight="arrow-right" disabled={busy !== null || q.questionCount === 0} onClick={() => void open(q.id)}>
              Open de lobby
            </Button>
          </li>
        ))}
        {quizzes?.length === 0 && <li className="text-beamer-body text-host-muted">Nog geen quizzen. Maak er een aan in het beheer.</li>}
      </ul>
    </div>
  )
}
