import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Badge } from '~/components/Badge'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { Input } from '~/components/Field'
import { Icon } from '~/components/Icon'
import { useAdminPin } from '~/features/admin/pin'
import { errorMessage } from '~/lib/errors'
import { cn } from '~/lib/cn'

export const Route = createFileRoute('/admin/')({
  component: QuizList,
})

const dateFmt = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function QuizList() {
  const pin = useAdminPin()
  const navigate = useNavigate()
  const { data: quizzes } = useQuery(
    convexQuery(api.admin.listQuizzes, { pin }),
  )
  const createQuiz = useConvexMutation(api.admin.createQuiz)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [newTitle, setNewTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sessionTotal = (quizzes ?? []).reduce(
    (n, q) => n + q.sessions.length,
    0,
  )

  async function create(e: FormEvent) {
    e.preventDefault()
    try {
      const quizId = await createQuiz({ pin, title: newTitle ?? '' })
      await navigate({ to: '/admin/quizzes/$quizId', params: { quizId } })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-8 px-10 py-12">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 font-display text-[40px] leading-[1.1] font-bold tracking-display">
            Quizzen
          </h1>
          <p className="m-0 text-base text-ink-70">
            {quizzes?.length ?? 0} quizzen · {sessionTotal} sessies
          </p>
        </div>
        <Button size="lg" icon="plus" onClick={() => setNewTitle('')}>
          Nieuwe quiz
        </Button>
      </div>

      {newTitle !== null && (
        <Card className="p-6">
          <form onSubmit={create} className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Titel van de nieuwe quiz"
                value={newTitle}
                autoFocus
                onChange={(e) => setNewTitle(e.target.value)}
                error={error}
              />
            </div>
            <Button variant="ghost" size="md" onClick={() => setNewTitle(null)}>
              Annuleren
            </Button>
            <Button type="submit" size="md" icon="check">
              Aanmaken
            </Button>
          </form>
        </Card>
      )}

      {(quizzes ?? []).map((q) => {
        const isOpen = open[q.id] ?? q === quizzes?.[0]
        return (
          <Card key={q.id}>
            <div className="flex items-center gap-4 px-6 py-5">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Sessies verbergen' : 'Sessies tonen'}
                onClick={() => setOpen((o) => ({ ...o, [q.id]: !isOpen }))}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-ink-10"
              >
                <span
                  className={cn(
                    'inline-flex transition-transform',
                    !isOpen && '-rotate-90',
                  )}
                >
                  <Icon name="chevron-down" size={18} className="text-ink-70" />
                </span>
              </button>
              <div className="flex flex-1 flex-col gap-1">
                <span className="flex items-center gap-2.5">
                  <span className="mr-0.5 font-display text-[20px] font-semibold tracking-heading">
                    {q.title}
                  </span>
                  <Badge tone={q.scoringEnabled ? 'blue' : 'neutral'} size="xs">
                    {q.scoringEnabled ? 'Score aan' : 'Zonder score'}
                  </Badge>
                  {q.maxPlayers !== null && (
                    <Badge tone="neutral" size="xs">
                      Max. {q.maxPlayers}
                    </Badge>
                  )}
                </span>
                <span className="text-sm text-ink-55">
                  {q.questionCount} vragen · {q.sessions.length} sessies
                  {q.missingCorrect.length > 0 && (
                    <span className="text-error">
                      {' '}
                      · vraag {q.missingCorrect.join(', ')} heeft nog geen goed
                      antwoord
                    </span>
                  )}
                </span>
              </div>
              <Link
                to="/admin/quizzes/$quizId"
                params={{ quizId: q.id }}
                className="inline-flex h-10 items-center rounded-pill px-[18px] text-sm font-semibold text-ink-70 no-underline hover:bg-ink-10"
              >
                Vragen bewerken
              </Link>
              <Link
                to="/host"
                className="inline-flex h-10 items-center gap-2 rounded-pill border border-ink-25 bg-white px-[18px] text-sm font-semibold text-ink no-underline"
              >
                Start sessie
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
            {isOpen && <Sessions sessions={q.sessions} />}
          </Card>
        )
      })}
    </main>
  )
}

type SessionRow = {
  id: Id<'sessions'>
  createdAt: number
  finishedAt: number | null
  phase: string
  playerCount: number
  answerCount: number
  scoringEnabled: boolean
}

function Sessions({ sessions }: { sessions: Array<SessionRow> }) {
  if (sessions.length === 0)
    return (
      <p className="m-0 px-6 pb-6 pl-[76px] text-sm text-ink-55">
        Nog geen sessies.
      </p>
    )
  const th =
    'border-b border-ink-15 px-5 pb-3 text-left font-display text-[11px] font-medium tracking-label text-ink-55 uppercase'
  return (
    <div className="px-6 pt-1 pb-3 pl-[76px]">
      <table className="w-full border-collapse">
        <caption className="caption-top px-5 pt-2 pb-3 text-left text-sm text-ink-70">
          {sessions.length} sessies · per vraag bijgehouden wie wat koos
        </caption>
        <thead>
          <tr>
            <th scope="col" className={th}>
              Datum
            </th>
            <th scope="col" className={th}>
              Status
            </th>
            <th scope="col" className={th}>
              Deelnemers
            </th>
            <th scope="col" className={th}>
              Antwoorden
            </th>
            <th scope="col" className={th}>
              <span className="sr-only">Acties</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => {
            const td = cn(
              'px-5 py-4 align-middle text-[15px]',
              i < sessions.length - 1 && 'border-b border-ink-15',
            )
            return (
              <tr key={s.id}>
                <td className={cn(td, 'font-semibold')}>
                  {dateFmt.format(s.createdAt)}
                </td>
                <td className={cn(td, 'text-ink-70')}>
                  {s.phase === 'finished' ? 'Afgerond' : 'Bezig'}
                </td>
                <td className={cn(td, 'tabular')}>{s.playerCount}</td>
                <td className={cn(td, 'tabular')}>{s.answerCount}</td>
                <td className={cn(td, 'text-right')}>
                  <Link
                    to="/admin/sessions/$sessionId"
                    params={{ sessionId: s.id }}
                    className="inline-flex h-9 items-center gap-2 rounded-pill border border-ink-25 bg-white px-4 text-sm font-semibold text-ink no-underline"
                  >
                    Bekijk resultaten en exporteer CSV
                    <Icon name="arrow-right" size={15} />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
