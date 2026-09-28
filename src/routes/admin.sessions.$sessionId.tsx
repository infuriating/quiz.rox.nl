import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { AnswerMarker } from '~/components/AnswerMarker'
import { Badge } from '~/components/Badge'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { DistributionBar } from '~/components/DistributionBar'
import { Label } from '~/components/Label'
import {
  exportDistribution,
  exportParticipation,
} from '~/features/admin/exports'
import { DeleteSessionButton } from '~/features/admin/DeleteSessionButton'
import { useAdminPassword } from '~/features/admin/password'
import { sessionStatus } from '~/features/admin/sessionStatus'

export const Route = createFileRoute('/admin/sessions/$sessionId')({
  component: SessionResults,
})

const TYPE_LABEL = {
  single: 'Enkel antwoord',
  multi: 'Meerdere antwoorden',
  poll: 'Poll',
} as const

function SessionResults() {
  const password = useAdminPassword()
  const navigate = useNavigate()
  const { sessionId } = Route.useParams()
  const { data: r } = useQuery(
    convexQuery(api.admin.sessionResults, {
      password,
      sessionId: sessionId as Id<'sessions'>,
    }),
  )
  if (r === undefined) return null
  if (r === null)
    return (
      <main className="px-10 py-12 text-ink-70">Deze sessie bestaat niet.</main>
    )
  const longDate = (ms: number) =>
    new Date(ms).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  const date = longDate(r.session.createdAt)
  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-10 py-10">
      <Link to="/admin" className="text-sm no-underline text-blue">
        {r.quizTitle}
      </Link>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 font-display text-[40px] leading-[1.1] font-bold tracking-display">
            Sessie {date}
          </h1>
          <p className="m-0 text-base text-ink-70">
            {r.players.length} deelnemers · {r.questions.length} vragen ·{' '}
            {r.session.scoringEnabled ? 'met score' : 'zonder score'}
            {' · '}
            {sessionStatus(r.session).toLowerCase()}
          </p>
          <p className="m-0 text-sm text-ink-55">
            Wordt op {longDate(r.session.deleteAt)} automatisch verwijderd, met
            alle namen en e-mailadressen. Exporteer de CSV als je de gegevens
            langer nodig hebt.
          </p>
        </div>
        <div className="flex gap-3">
          <DeleteSessionButton
            sessionId={r.session.id}
            size="lg"
            onDeleted={() => void navigate({ to: '/admin' })}
          />
          <Button
            variant="outline"
            size="lg"
            icon="download"
            onClick={() => exportParticipation(r)}
          >
            Deelname (CSV)
          </Button>
          <Button
            size="lg"
            icon="download"
            onClick={() => exportDistribution(r)}
          >
            Verdeling (CSV)
          </Button>
        </div>
      </div>
      {r.questions.map((q) => (
        <Card key={q.id} className="flex flex-col gap-3 px-7 py-6">
          <div className="flex items-center gap-3">
            <Label className="text-xs text-blue-600">
              Vraag {String(q.order).padStart(2, '0')}
            </Label>
            <Badge tone="neutral" size="xs">
              {q.topic}
            </Badge>
            <span className="flex-1" />
            <span className="text-sm text-ink-55">
              {TYPE_LABEL[q.type]} · {q.answeredCount} van {r.players.length}{' '}
              beantwoord
            </span>
          </div>
          <h2 className="m-0 mb-1 font-display text-[20px] leading-[1.3] font-semibold tracking-heading">
            {q.text}
          </h2>
          {q.options.map((o, i) => (
            <div
              key={o.id}
              className="grid grid-cols-[40px_minmax(0,1fr)_280px_64px] items-center gap-4 border-t border-ink-15 py-2.5"
            >
              <AnswerMarker index={i} size="admin" />
              <span className="flex items-center gap-2.5 text-[15px] leading-[1.4]">
                {o.text}
                {o.correct && (
                  <Badge tone="success" size="xs">
                    Goed
                  </Badge>
                )}
              </span>
              <DistributionBar
                size="admin"
                count={o.count}
                total={r.players.length}
                correct={o.correct === true}
              />
              <span className="tabular text-right font-display text-base font-semibold">
                {o.count}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-[40px_minmax(0,1fr)_280px_64px] items-center gap-4 border-t border-ink-15 py-2.5 text-ink-55">
            <span />
            <span className="text-[15px]">Geen antwoord</span>
            <span />
            <span className="tabular text-right font-display text-base font-semibold">
              {q.noAnswerCount}
            </span>
          </div>
        </Card>
      ))}
    </main>
  )
}
