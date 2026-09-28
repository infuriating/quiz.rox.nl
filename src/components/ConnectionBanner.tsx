import { useConvexConnectionState } from 'convex/react'
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

/** Floating banner at the top of the phone screen while the Convex connection is down. */
export function ConnectionBannerView({
  state,
}: {
  state: 'offline' | 'restored'
}) {
  return (
    <div
      role="status"
      className="absolute top-2 right-3 left-3 z-20 flex items-center gap-3 rounded-[14px] bg-ink px-3.5 py-3 text-white shadow-pop"
    >
      {state === 'offline' ? (
        <>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black-soft text-warning">
            <Icon name="wifi" size={18} />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-semibold">Verbinding weg</span>
            <span className="text-[13px] text-inverse-muted">
              We verbinden je opnieuw. Je antwoorden blijven bewaard.
            </span>
          </span>
          <span
            aria-hidden="true"
            className="size-[18px] shrink-0 animate-spin rounded-full border-2 border-black-line border-t-white"
          />
        </>
      ) : (
        <>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-white">
            <Icon name="check" size={18} strokeWidth={2.6} />
          </span>
          <span className="text-[15px] font-semibold">Weer verbonden</span>
        </>
      )}
    </div>
  )
}

const OFFLINE_GRACE_MS = 1500
const RESTORED_VISIBLE_MS = 2000

/** Returns whether controls should be disabled, and renders the banner itself. */
export function useConnectionBanner() {
  const { isWebSocketConnected, hasEverConnected } = useConvexConnectionState()
  const [shown, setShown] = useState<'offline' | 'restored' | null>(null)
  const wasOffline = useRef(false)
  useEffect(() => {
    if (!hasEverConnected) return
    if (!isWebSocketConnected) {
      const t = setTimeout(() => {
        wasOffline.current = true
        setShown('offline')
      }, OFFLINE_GRACE_MS)
      return () => clearTimeout(t)
    }
    if (wasOffline.current) {
      wasOffline.current = false
      setShown('restored')
      const t = setTimeout(() => setShown(null), RESTORED_VISIBLE_MS)
      return () => clearTimeout(t)
    }
  }, [isWebSocketConnected, hasEverConnected])
  return {
    offline: shown === 'offline',
    banner: shown ? <ConnectionBannerView state={shown} /> : null,
  }
}
