import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Navigate, createFileRoute } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'
import { JoinScreen } from '~/features/player/JoinScreen'
import { playerStore } from '~/lib/storage'

export const Route = createFileRoute('/join/$code')({
  ssr: false,
  component: JoinRoute,
})

function JoinRoute() {
  const { code } = Route.useParams()
  const lookup = useQuery(convexQuery(api.sessions.lookupJoinCode, { code }))
  // Already joined on this device: go straight back into the game.
  const known = lookup.data ? playerStore.get(lookup.data.sessionId) : null
  if (lookup.data && known) {
    return <Navigate to="/play/$sessionId" params={{ sessionId: lookup.data.sessionId }} replace />
  }
  if (lookup.isPending) return null
  return <JoinScreen initialCode={code} />
}
