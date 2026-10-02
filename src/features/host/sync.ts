import { useCallback, useEffect, useState } from 'react'

/**
 * A value from localStorage that follows changes made in another window, so the beamer
 * picks up the dashboard's theme switch and its move to the thanks screen. The `storage`
 * event only fires in the other windows: call `refresh` after a change made here.
 * `read` must be stable (a module function or a useCallback).
 */
export function useStored<T>(read: () => T): [T, () => void] {
  const [value, setValue] = useState(read)
  const refresh = useCallback(() => setValue(read()), [read])
  useEffect(() => {
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [refresh])
  return [value, refresh]
}
