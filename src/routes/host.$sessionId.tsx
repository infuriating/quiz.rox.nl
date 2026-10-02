import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Navigate, createFileRoute } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { ManageDashboard } from '~/features/manage/ManageDashboard'
import { hostStore } from '~/lib/storage'
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

/** The manage dashboard. The room sees /beamer/$sessionId, opened from here. */
function Host({
  sessionId,
  hostToken,
}: {
  sessionId: Id<'sessions'>
  hostToken: string
}) {
  const args = { sessionId, hostToken }
  const { data: view, error } = useQuery(
    convexQuery(api.sessions.getHostView, args),
  )
  const { data: manage } = useQuery(
    convexQuery(api.sessions.getManageView, args),
  )
  const offset = useServerOffset()
  const remaining = useRemaining(view?.session.questionEndsAt ?? null, offset)

  if (error) return <Navigate to="/host" replace />
  if (!view || !manage) return <div className="min-h-dvh bg-ink-10" />
  return (
    <ManageDashboard
      sessionId={sessionId}
      hostToken={hostToken}
      view={view}
      manage={manage}
      remainingMs={remaining}
    />
  )
}
