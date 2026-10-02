import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { BeamerScreen } from '~/features/host/BeamerScreen'
import { Stage } from '~/features/host/Stage'
import { useStored } from '~/features/host/sync'
import { hostStore, thanksStore, themeStore } from '~/lib/storage'
import { useRemaining, useServerOffset } from '~/lib/time'

export const Route = createFileRoute('/beamer/$sessionId')({
  ssr: false,
  component: BeamerRoute,
})

/** Double-click anywhere: full screen on and off. The screen itself has no controls. */
function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void document.documentElement.requestFullscreen().catch(() => {})
}

function BeamerRoute() {
  const { sessionId } = Route.useParams()
  const [theme] = useStored(themeStore.get)
  const hostToken = hostStore.get(sessionId)
  return (
    <Stage theme={theme} onDoubleClick={toggleFullscreen}>
      {hostToken ? (
        <Beamer sessionId={sessionId as Id<'sessions'>} hostToken={hostToken} />
      ) : (
        <Message>
          Open het beamerscherm vanuit het beheerscherm, in dezelfde browser.
        </Message>
      )}
    </Stage>
  )
}

function Beamer({
  sessionId,
  hostToken,
}: {
  sessionId: Id<'sessions'>
  hostToken: string
}) {
  const { data: view, error } = useQuery(
    convexQuery(api.sessions.getHostView, { sessionId, hostToken }),
  )
  const readThanks = useCallback(() => thanksStore.get(sessionId), [sessionId])
  const [thanksShown] = useStored(readThanks)
  const offset = useServerOffset()
  const remaining = useRemaining(view?.session.questionEndsAt ?? null, offset)
  if (error) return <Message>Deze sessie bestaat niet meer.</Message>
  if (!view) return null
  return (
    <BeamerScreen
      view={view}
      remainingMs={remaining}
      thanksShown={thanksShown}
    />
  )
}

function Message({ children }: { children: string }) {
  return (
    <div className="flex h-full items-center justify-center px-40">
      <p className="m-0 max-w-[1200px] text-center font-display text-beamer-h2 leading-[1.2] font-semibold tracking-heading text-host-soft">
        {children}
      </p>
    </div>
  )
}
