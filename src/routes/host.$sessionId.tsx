import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Button } from '~/components/Button'
import { HostControlBar } from '~/components/HostControlBar'
import { HostLobby } from '~/features/host/HostLobby'
import { HostQuestion } from '~/features/host/HostQuestion'
import { HostReveal } from '~/features/host/HostReveal'
import { HostLeaderboard, HostPodium } from '~/features/host/HostScoring'
import { HostThanks } from '~/features/host/HostThanks'
import { Stage } from '~/features/host/Stage'
import type { HostView } from '~/features/host/types'
import { errorMessage } from '~/lib/errors'
import { hostStore, themeStore } from '~/lib/storage'
import { useRemaining, useServerOffset } from '~/lib/time'

export const Route = createFileRoute('/host/$sessionId')({
  ssr: false,
  component: HostRoute,
})

function HostRoute() {
  const { sessionId } = Route.useParams()
  const hostToken = hostStore.get(sessionId)
  if (!hostToken) return <Navigate to="/host" replace />
  return <Host sessionId={sessionId as Id<'sessions'>} hostToken={hostToken} />
}

function Host({ sessionId, hostToken }: { sessionId: Id<'sessions'>; hostToken: string }) {
  const args = { sessionId, hostToken }
  const { data: view, error } = useQuery(convexQuery(api.sessions.getHostView, args))
  const [theme, setTheme] = useState(themeStore.get)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const offset = useServerOffset()
  const remaining = useRemaining(view?.session.questionEndsAt ?? null, offset)

  const start = useConvexMutation(api.game.start)
  const next = useConvexMutation(api.game.next)
  const previous = useConvexMutation(api.game.previous)
  const skip = useConvexMutation(api.game.skipTimer)
  const end = useConvexMutation(api.game.end)

  if (error) return <Navigate to="/host" replace />
  if (!view) return <Stage theme={theme}>{null}</Stage>

  const run = (fn: (a: typeof args) => Promise<unknown>) => async () => {
    setBusy(true)
    setActionError(null)
    try {
      await fn(args)
    } catch (e) {
      setActionError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  const toggleTheme = () => {
    const t = theme === 'dark' ? 'light' : 'dark'
    themeStore.set(t)
    setTheme(t)
  }
  const confirmEnd = () => {
    if (window.confirm('Sessie beëindigen? Spelers zien direct het eindscherm.')) void run(end)()
  }

  const s = view.session
  const isLast = s.currentQuestionIndex + 1 >= s.totalQuestions
  const common = { onToggleTheme: toggleTheme, dark: theme === 'dark', busy }
  let screen: React.ReactNode = null
  let bar: React.ReactNode = null

  switch (s.phase) {
    case 'lobby':
      screen = <HostLobby view={view} />
      bar = (
        <HostControlBar
          {...common}
          onEnd={confirmEnd}
          right={
            <Button size="lg" iconRight="arrow-right" disabled={busy || s.playerCount === 0} onClick={() => void run(start)()}>
              Start de quiz
            </Button>
          }
        />
      )
      break
    case 'question':
      screen = <HostQuestion view={view} remainingMs={remaining} />
      bar = <HostControlBar {...common} joinCode={s.joinCode} onPrevious={s.currentQuestionIndex > 0 ? run(previous) : null} onSkipTimer={run(skip)} onEnd={confirmEnd} />
      break
    case 'reveal':
      screen = <HostReveal view={view} />
      bar = (
        <HostControlBar
          {...common}
          onPrevious={s.currentQuestionIndex > 0 ? run(previous) : null}
          onNext={run(next)}
          nextLabel={s.scoringEnabled ? 'Tussenstand' : isLast ? 'Afronden' : 'Volgende'}
          onEnd={confirmEnd}
        />
      )
      break
    case 'leaderboard':
      // Scoring only: the server rejects this phase when scoring is off.
      screen = s.scoringEnabled ? <HostLeaderboard view={view} /> : null
      bar = <HostControlBar {...common} joinCode={s.joinCode} onPrevious={run(previous)} onNext={run(next)} nextLabel={isLast ? 'Afronden' : 'Volgende'} onEnd={confirmEnd} />
      break
    case 'finished':
      screen = s.scoringEnabled && view.podium && view.podium.length > 0 ? <PodiumThenThanks view={view} /> : <HostThanks view={view} />
      break
  }

  return (
    <Stage theme={theme}>
      {screen}
      {bar}
      {actionError && (
        <p role="alert" className="absolute top-6 left-1/2 m-0 -translate-x-1/2 rounded-pill bg-error-soft px-6 py-3 text-[20px] text-error">
          {actionError}
        </p>
      )}
    </Stage>
  )
}

/** With scoring: the podium first, then "Iedereen bedankt" on the host's click. */
function PodiumThenThanks({ view }: { view: HostView }) {
  const [thanks, setThanks] = useState(false)
  if (thanks) return <HostThanks view={view} />
  return (
    <>
      <HostPodium view={view} />
      <HostControlBar onNext={() => setThanks(true)} nextLabel="Afsluiten" />
    </>
  )
}
