import { useConvexMutation } from '@convex-dev/react-query'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'

/** Offset (ms) to add to Date.now() to approximate server time. Measured once on load. */
export function useServerOffset(): number {
  const getServerTime = useConvexMutation(api.sessions.getServerTime)
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    let cancelled = false
    const t0 = Date.now()
    getServerTime({})
      .then((server) => {
        const t1 = Date.now()
        if (!cancelled) setOffset(server - (t0 + t1) / 2)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [getServerTime])
  return offset
}

/** Remaining ms until `endsAt` (server time), ticking. Cosmetic only: the server decides. */
export function useRemaining(endsAt: number | null, offset: number, tickMs = 200): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (endsAt === null) return
    const id = setInterval(() => setNow(Date.now()), tickMs)
    return () => clearInterval(id)
  }, [endsAt, tickMs])
  if (endsAt === null) return 0
  return Math.max(0, endsAt - (now + offset))
}
