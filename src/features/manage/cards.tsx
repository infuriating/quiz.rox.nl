// The host-only cards on the manage dashboard. Everything here stays on the host's own
// screen; the beamer shows counts only, never names or the answer key before the reveal.
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { AnswerMarker, LETTERS } from '~/components/AnswerMarker'
import { Badge } from '~/components/Badge'
import { Card } from '~/components/Card'
import { CountdownBar } from '~/components/CountdownBar'
import { Icon } from '~/components/Icon'
import { Label } from '~/components/Label'
import { cn } from '~/lib/cn'
import type { HostView, ManageView } from '~/features/host/types'

const TYPE_LABEL = {
  single: 'Enkel antwoord',
  multi: 'Meerdere antwoorden',
  poll: 'Peiling',
} as const

const PLAYERS_SHOWN = 9

export function CardTitle({
  id,
  children,
  right,
}: {
  id: string
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="flex items-center gap-4">
      <Label as="h2" className="m-0 flex-1 text-xs text-ink-70">
        <span id={id}>{children}</span>
      </Label>
      {right}
    </div>
  )
}

function BigNumber({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="tabular font-display text-[64px] leading-[.9] font-bold tracking-hero lg:text-[88px]">
        {value}
      </span>
      <Label className="text-xs text-ink-55">{label}</Label>
    </div>
  )
}

function Bar({ value, of }: { value: number; of: number }) {
  return (
    <span
      className="block h-2.5 overflow-hidden rounded-pill bg-ink-10"
      role="presentation"
    >
      <span
        className="block h-full rounded-pill bg-ink transition-[width] duration-300 ease-cut"
        style={{ width: `${of === 0 ? 0 : Math.round((value / of) * 100)}%` }}
      />
    </span>
  )
}

/** The numbers next to the preview: what the host needs to know right now. */
export function PhaseStats({
  view,
  remainingMs,
}: {
  view: HostView
  remainingMs: number
}) {
  const s = view.session
  const players = s.playerCount
  switch (s.phase) {
    case 'lobby':
      return (
        <div className="flex flex-col gap-3.5">
          <BigNumber
            value={String(players)}
            label={
              s.maxPlayers === null
                ? 'spelers doen mee'
                : `van ${s.maxPlayers} spelers`
            }
          />
          <p className="m-0 text-[15px] leading-[1.55] text-ink-55">
            Namen verschijnen live op het scherm. Wie na de start binnenkomt,
            doet vanaf dat moment mee.
          </p>
        </div>
      )
    case 'question': {
      const q = view.question!
      const secs = Math.ceil(remainingMs / 1000)
      return (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <BigNumber
              value={String(secs)}
              label={secs === 0 ? 'tijd is om' : 'seconden over'}
            />
            <CountdownBar
              remainingMs={remainingMs}
              totalMs={q.timeLimitSec * 1000}
              showSeconds={false}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="tabular font-display text-[40px] leading-none font-bold tracking-display">
                {view.answeredCount} / {players}
              </span>
              <span className="text-base text-ink-55">beantwoord</span>
            </div>
            <Bar value={view.answeredCount} of={players} />
            <span className="text-sm text-ink-55">
              Het resultaat komt vanzelf als de tijd op is of iedereen heeft
              geantwoord.
            </span>
          </div>
        </div>
      )
    }
    case 'reveal':
    case 'leaderboard': {
      const r = view.reveal!
      const answered = players - r.noAnswerCount
      if (r.correctCount === null)
        return (
          <div className="flex flex-col gap-3">
            <BigNumber value={String(answered)} label="stemmen" />
            <span className="text-base text-ink-55">
              Peiling: {answered} van {players} spelers hebben gestemd.
            </span>
          </div>
        )
      const pct =
        players === 0 ? 0 : Math.round((r.correctCount / players) * 100)
      const rows = [
        { label: 'Goed', count: r.correctCount, swatch: 'bg-success' },
        {
          label: 'Fout',
          count: answered - r.correctCount,
          swatch: 'bg-ink-25',
        },
        {
          label: 'Geen antwoord',
          count: r.noAnswerCount,
          swatch: 'border-[1.5px] border-dashed border-ink-40',
        },
      ]
      return (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <BigNumber value={`${pct}%`} label="goed" />
            <span className="text-base text-ink-55">
              {r.correctCount} van {players} spelers goed
            </span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    'box-border size-2.5 rounded-[3px]',
                    row.swatch,
                  )}
                />
                <span className="flex-1">{row.label}</span>
                <span className="tabular font-semibold">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    case 'finished': {
      const pct = view.stats?.percentCorrect ?? null
      return (
        <div className="flex flex-col gap-4">
          <BigNumber
            value={pct === null ? String(players) : `${pct}%`}
            label={pct === null ? 'deelnemers' : 'goed beantwoord'}
          />
          <p className="m-0 text-[15px] leading-[1.55] text-ink-55">
            {s.endReason === 'expired'
              ? 'De sessie is verlopen.'
              : 'De quiz is afgerond.'}{' '}
            De resultaten en de CSV-exports staan in het beheer.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-medium">
            <Link
              to="/admin/sessions/$sessionId"
              params={{ sessionId: s.id }}
              className="text-blue no-underline hover:text-blue-600"
            >
              Bekijk de resultaten
            </Link>
            <Link
              to="/host"
              className="text-blue no-underline hover:text-blue-600"
            >
              Start een nieuwe sessie
            </Link>
          </div>
        </div>
      )
    }
  }
}

/** Lobby only: the one thing to do before starting. */
export function ShareCard({ onOpenBeamer }: { onOpenBeamer: () => void }) {
  return (
    <section
      aria-labelledby="delen"
      className="flex flex-col gap-6 rounded-md bg-ink p-7 text-white md:flex-row md:items-center"
    >
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-md bg-white/8"
      >
        <Icon name="display" size={28} strokeWidth={1.8} />
      </span>
      <div className="flex flex-1 flex-col gap-1.5">
        <h2
          id="delen"
          className="m-0 font-display text-[22px] font-semibold tracking-heading"
        >
          Deel alleen het beamerscherm
        </h2>
        <p className="m-0 text-[15px] leading-[1.55] text-inverse-muted">
          Open het beamerscherm in een eigen venster en zet het op de beamer, of
          deel alleen dat venster in Teams. Dubbelklik erop voor volledig
          scherm. Dit scherm met de knoppen blijft bij jou.
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenBeamer}
        className="inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 self-start rounded-pill border-0 bg-white px-5 text-[15px] font-semibold text-ink hover:bg-ink-10 md:self-center"
      >
        <Icon name="arrow-up-right-from-square" />
        Open beamerscherm
      </button>
    </section>
  )
}

/** Question phase: the answer key and the explanation, ahead of the room. */
export function AnswerKeyCard({
  view,
  manage,
}: {
  view: HostView
  manage: ManageView
}) {
  const q = view.question!
  const key = manage.current
  const poll = q.type === 'poll'
  return (
    <Card aria-labelledby="vraag" className="flex flex-col gap-4.5 p-6">
      <CardTitle
        id="vraag"
        right={
          !poll && (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-55">
              <Icon name="eye-slash" size={14} />
              Alleen jij ziet het antwoord
            </span>
          )
        }
      >
        Deze vraag
      </CardTitle>
      <p className="m-0 font-display text-[22px] leading-[1.25] font-semibold tracking-heading">
        {q.text}
      </p>
      <div className="grid gap-2.5 md:grid-cols-2">
        {q.options.map((o, i) => {
          const correct = key?.correctOptionIds.includes(o.id) ?? false
          return (
            <div
              key={o.id}
              className={cn(
                'flex min-h-14 items-center gap-3 rounded-sm border py-2.5 pr-3.5 pl-2.5',
                correct ? 'border-mint-200 bg-mint-100' : 'border-ink-15',
              )}
            >
              <AnswerMarker index={i} size="admin" />
              <span
                className={cn(
                  'flex-1 text-[15px] leading-[1.4]',
                  correct && 'font-medium',
                )}
              >
                {o.text}
              </span>
              {correct && (
                <span className="rox-label inline-flex items-center gap-1 text-[11px] text-mint-600">
                  <Icon name="check" size={14} strokeWidth={2.4} />
                  Juist
                </span>
              )}
            </div>
          )
        })}
      </div>
      {poll && (
        <p className="m-0 text-sm text-ink-55">
          Peiling: er is geen goed antwoord.
        </p>
      )}
      {key?.explanation && (
        <div className="flex flex-col gap-1 rounded-sm bg-ink-10 px-4 py-3.5">
          <Label className="text-[11px] text-ink-55">
            Uitleg bij het resultaat
          </Label>
          <p className="m-0 text-[15px] leading-[1.55] text-ink-70">
            {key.explanation}
          </p>
        </div>
      )}
    </Card>
  )
}

/** Reveal and leaderboard: who picked what. Names stay here, off the beamer. */
export function PicksCard({
  view,
  manage,
}: {
  view: HostView
  manage: ManageView
}) {
  const q = view.question!
  const correctIds = manage.current?.correctOptionIds ?? []
  const names = (match: (ids: Array<string> | null) => boolean) =>
    manage.players.filter((p) => match(p.optionIds)).map((p) => p.name)
  const rows = [
    ...q.options.map((o, i) => ({
      key: o.id,
      marker: <AnswerMarker index={i} size="admin" />,
      label: o.text,
      correct: correctIds.includes(o.id),
      names: names((ids) => ids?.includes(o.id) ?? false),
    })),
    {
      key: 'none',
      marker: <span className="size-10 shrink-0" />,
      label: 'Geen antwoord',
      correct: false,
      names: names((ids) => ids === null),
    },
  ]
  return (
    <Card aria-labelledby="keuzes" className="flex flex-col gap-3 p-6">
      <CardTitle id="keuzes">Wie koos wat</CardTitle>
      <ul className="m-0 flex list-none flex-col p-0">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-start gap-3.5 border-t border-ink-15 py-3 first:border-t-0"
          >
            {row.marker}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2 text-[15px] font-medium">
                {row.label}
                {row.correct && (
                  <Badge tone="success" size="xs">
                    Goed
                  </Badge>
                )}
              </span>
              <span className="text-sm leading-[1.5] text-ink-55">
                {row.names.length === 0 ? 'Niemand' : row.names.join(', ')}
              </span>
            </div>
            <span className="tabular pt-0.5 font-display text-base font-semibold">
              {row.names.length}
            </span>
          </li>
        ))}
      </ul>
      <p className="m-0 text-sm text-ink-55">
        Het beamerscherm toont alleen aantallen, nooit namen.
      </p>
    </Card>
  )
}

function joinTime(ms: number) {
  return new Date(ms).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Lobby: newest first with the time they joined. During a question: who is still thinking. */
export function PlayersCard({
  view,
  manage,
}: {
  view: HostView
  manage: ManageView
}) {
  const [all, setAll] = useState(false)
  const phase = view.session.phase
  const asking = phase === 'question'
  const players =
    phase === 'lobby'
      ? [...manage.players].sort((a, b) => b.joinedAt - a.joinedAt)
      : asking
        ? [...manage.players].sort(
            (a, b) => Number(a.answered) - Number(b.answered),
          )
        : manage.players
  const waiting = manage.players.filter((p) => !p.answered).length
  const shown = all ? players : players.slice(0, PLAYERS_SHOWN)
  return (
    <Card
      aria-labelledby="spelers"
      className="flex flex-col gap-2 px-6 pt-6 pb-3"
    >
      <div className="pb-2">
        <CardTitle
          id="spelers"
          right={
            <span className="text-sm text-ink-55">
              {phase === 'lobby'
                ? 'Nieuwste boven'
                : asking
                  ? waiting === 0
                    ? 'Iedereen heeft geantwoord'
                    : `${waiting} ${waiting === 1 ? 'wacht' : 'wachten'} nog`
                  : null}
            </span>
          }
        >
          Spelers · {manage.players.length}
        </CardTitle>
      </div>
      {players.length === 0 ? (
        <p className="m-0 border-t border-ink-15 py-3 text-[15px] text-ink-55">
          Nog niemand. Namen verschijnen hier zodra spelers meedoen.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {shown.map((p) => (
            <li
              key={p.id}
              className="flex h-11 items-center gap-3 border-t border-ink-15"
            >
              <span className="min-w-0 flex-1 truncate text-[15px]">
                {p.name}
              </span>
              {phase === 'lobby' ? (
                <span className="tabular text-[13px] text-ink-55">
                  {joinTime(p.joinedAt)}
                </span>
              ) : (
                asking &&
                (p.answered ? (
                  <>
                    <span className="text-[13px]">Beantwoord</span>
                    <span
                      aria-hidden="true"
                      className="flex size-5 items-center justify-center rounded-full bg-ink text-white"
                    >
                      <Icon name="check" size={12} strokeWidth={3} />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[13px] text-ink-55">Wacht</span>
                    <span
                      aria-hidden="true"
                      className="box-border size-5 rounded-full border-[1.5px] border-dashed border-ink-40"
                    />
                  </>
                ))
              )}
            </li>
          ))}
        </ul>
      )}
      {players.length > PLAYERS_SHOWN && (
        <button
          type="button"
          aria-expanded={all}
          onClick={() => setAll(!all)}
          className="flex h-11 cursor-pointer items-center justify-center gap-1.5 border-0 border-t border-solid border-ink-15 bg-transparent text-[15px] font-medium text-blue hover:text-blue-600"
        >
          {all ? 'Toon minder' : `Toon alle ${players.length}`}
          <Icon
            name="chevron-down"
            size={14}
            className={cn('transition-transform', all && 'rotate-180')}
          />
        </button>
      )}
    </Card>
  )
}

/** The question after this one, so the host can introduce it. */
export function NextCard({
  view,
  manage,
}: {
  view: HostView
  manage: ManageView
}) {
  const phase = view.session.phase
  if (phase === 'finished') return null
  const next = manage.next
  const tinted = phase === 'reveal' || phase === 'leaderboard'
  const title =
    phase === 'lobby'
      ? 'Eerste vraag'
      : next
        ? `Hierna · Vraag ${next.index + 1} / ${next.total}`
        : 'Hierna'
  const body = next ? (
    <>
      <p
        className={cn(
          'm-0 leading-[1.4]',
          tinted
            ? 'font-display text-[20px] font-semibold tracking-heading'
            : 'text-[15px]',
        )}
      >
        {next.text}
      </p>
      {tinted && (
        <ol className="m-0 flex list-none flex-col gap-1.5 p-0 text-[15px] text-ink-85">
          {next.options.map((o, i) => (
            <li key={o.id} className="flex gap-2.5">
              <span className="w-4 shrink-0 font-display font-bold">
                {LETTERS[i]}
              </span>
              {o.text}
            </li>
          ))}
        </ol>
      )}
      <span className={cn('text-sm', tinted ? 'text-ink-70' : 'text-ink-55')}>
        {TYPE_LABEL[next.type]} · {next.timeLimitSec} seconden
      </span>
    </>
  ) : (
    <p className="m-0 text-[15px] leading-[1.5]">
      Dit is de laatste vraag. Daarna is de quiz klaar.
    </p>
  )
  return (
    <section
      aria-labelledby="hierna"
      className={cn(
        'flex flex-col gap-3 rounded-md p-6',
        tinted ? 'bg-blue-100' : 'border border-ink-15 bg-white shadow-card',
      )}
    >
      <Label
        as="h2"
        className={cn('m-0 text-xs', tinted ? 'text-blue-600' : 'text-ink-70')}
      >
        <span id="hierna">{title}</span>
      </Label>
      {body}
    </section>
  )
}

/** One cell per question: done, now, still to come. */
export function ProgressCard({ view }: { view: HostView }) {
  const s = view.session
  const current =
    s.phase === 'lobby'
      ? -1
      : s.phase === 'finished'
        ? s.totalQuestions
        : s.currentQuestionIndex
  return (
    <Card aria-labelledby="verloop" className="flex flex-col gap-4 p-6">
      <CardTitle id="verloop">Verloop</CardTitle>
      <ol
        aria-label="Vragen"
        className="m-0 grid list-none grid-cols-6 gap-2 p-0"
      >
        {Array.from({ length: s.totalQuestions }, (_, i) => {
          const state = i < current ? 'klaar' : i === current ? 'nu' : null
          return (
            <li
              key={i}
              aria-current={state === 'nu' ? 'step' : undefined}
              aria-label={`Vraag ${i + 1}${state ? `, ${state}` : ''}`}
              className={cn(
                'tabular box-border flex h-10 items-center justify-center rounded-[10px] font-display text-sm font-semibold',
                state === 'klaar' && 'bg-ink-10 text-ink-55',
                state === 'nu' && 'bg-blue font-bold text-white',
                state === null && 'border border-ink-15',
              )}
            >
              {i + 1}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
