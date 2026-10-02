import { HostLobby } from './HostLobby'
import { HostQuestion } from './HostQuestion'
import { HostReveal } from './HostReveal'
import { HostLeaderboard, HostPodium } from './HostScoring'
import { HostThanks } from './HostThanks'
import type { HostView } from './types'

/** Bottom-left on the beamer, for late joiners. */
function JoinFooter({ code }: { code: string }) {
  return (
    <span className="absolute bottom-9 left-20 text-[22px] text-host-muted">
      {typeof window !== 'undefined' ? window.location.host : ''} ·{' '}
      <span className="font-display font-semibold tracking-label text-host-soft">
        {code}
      </span>
    </span>
  )
}

/**
 * What the room sees: no controls at all. Rendered full screen on /beamer and scaled
 * down as the preview on the manage dashboard, so both always show the same thing.
 * `thanksShown`: with scoring, the podium comes first and the host moves on to
 * "Iedereen bedankt" from the dashboard.
 */
export function BeamerScreen({
  view,
  remainingMs,
  thanksShown,
}: {
  view: HostView
  remainingMs: number
  thanksShown: boolean
}) {
  const s = view.session
  switch (s.phase) {
    case 'lobby':
      return <HostLobby view={view} />
    case 'question':
      return (
        <>
          <HostQuestion view={view} remainingMs={remainingMs} />
          <JoinFooter code={s.joinCode} />
        </>
      )
    case 'reveal':
      return <HostReveal view={view} />
    case 'leaderboard':
      // Scoring only: the server rejects this phase when scoring is off.
      return s.scoringEnabled ? (
        <>
          <HostLeaderboard view={view} />
          <JoinFooter code={s.joinCode} />
        </>
      ) : null
    case 'finished':
      return hasPodium(view) && !thanksShown ? (
        <HostPodium view={view} />
      ) : (
        <HostThanks view={view} />
      )
  }
}

export function hasPodium(view: HostView): boolean {
  return (
    view.session.scoringEnabled &&
    view.podium !== null &&
    view.podium.length > 0
  )
}
