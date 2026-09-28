import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useConnectionBanner } from '~/components/ConnectionBanner'
import { FinalScreen } from '~/features/player/FinalScreen'
import { LobbyScreen } from '~/features/player/LobbyScreen'
import { QuestionScreen } from '~/features/player/QuestionScreen'
import { RevealScreen } from '~/features/player/RevealScreen'
import { LateScreen, ReceivedScreen } from '~/features/player/WaitScreens'
import { playerStore } from '~/lib/storage'
import { useRemaining, useServerOffset } from '~/lib/time'

export const Route = createFileRoute('/play/$sessionId')({
  ssr: false,
  component: PlayRoute,
})

function PlayRoute() {
  const { sessionId } = Route.useParams()
  const playerId = playerStore.get(sessionId)
  if (!playerId) return <Navigate to="/" replace />
  return (
    <Play
      sessionId={sessionId as Id<'sessions'>}
      playerId={playerId as Id<'players'>}
    />
  )
}

function Play({
  sessionId,
  playerId,
}: {
  sessionId: Id<'sessions'>
  playerId: Id<'players'>
}) {
  const { data: view, isPending } = useQuery(
    convexQuery(api.sessions.getPlayerView, { sessionId, playerId }),
  )
  const { banner, offline } = useConnectionBanner()
  const offset = useServerOffset()
  const remaining = useRemaining(view?.session.questionEndsAt ?? null, offset)
  const questionId = view?.question?.id
  const [lateFor, setLateFor] = useState<string | null>(null)

  if (isPending) return null
  if (view === null || view === undefined) {
    // Unknown player (e.g. session was reset): forget it and start over.
    playerStore.clear(sessionId)
    return <Navigate to="/" replace />
  }

  switch (view.session.phase) {
    case 'lobby':
      return <LobbyScreen view={view} banner={banner} />
    case 'question': {
      if (view.myAnswer) return <ReceivedScreen view={view} banner={banner} />
      // Cosmetic: the local countdown hit zero or the server rejected the answer as late.
      if (
        lateFor === questionId ||
        (view.session.questionEndsAt !== null && remaining === 0)
      ) {
        return <LateScreen view={view} banner={banner} />
      }
      return (
        <QuestionScreen
          key={questionId}
          view={view}
          remainingMs={remaining}
          banner={banner}
          offline={offline}
          onLate={() => setLateFor(questionId ?? null)}
        />
      )
    }
    case 'reveal':
    case 'leaderboard':
      if (!view.myAnswer) return <LateScreen view={view} banner={banner} />
      return <RevealScreen view={view} banner={banner} />
    case 'finished':
      return <FinalScreen view={view} banner={banner} />
  }
}
