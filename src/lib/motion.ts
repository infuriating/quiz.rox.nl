import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function prefersReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReduced)
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** False until `ms` after mount (immediately true under reduced motion). Times a beat in a sequence. */
export function useAfter(ms: number): boolean {
  const [done, setDone] = useState(() => ms <= 0 || prefersReduced())
  useEffect(() => {
    if (done) return
    const id = setTimeout(() => setDone(true), ms)
    return () => clearTimeout(id)
  }, [done, ms])
  return done
}

/**
 * Counts toward `to` on the ROX counter spring (stiffness 180, damping 28): settles in
 * about 1.3 s without overshoot. Starts at `from` and waits `delay` ms after mount;
 * a later change of `to` springs on from the current value. Jumps under reduced motion.
 */
export function useSpring(
  to: number,
  { from = 0, delay: waitMs = 0 }: { from?: number; delay?: number } = {},
): number {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(() => (prefersReduced() ? to : from))
  const current = useRef(value)
  const [mountedAt] = useState(() => performance.now())
  useEffect(() => {
    if (reduced) {
      current.current = to
      return
    }
    let raf = 0
    let x = current.current
    let v = 0
    let last = 0
    const span = Math.abs(to - x) || 1
    const step = (now: number) => {
      const dt = last ? Math.min(0.034, (now - last) / 1000) : 0.016
      last = now
      for (let i = 0; i < 4; i++) {
        const a = -180 * (x - to) - 28 * v
        v += (a * dt) / 4
        x += (v * dt) / 4
      }
      const settled =
        Math.abs(x - to) < span * 0.002 && Math.abs(v) < span * 0.02
      current.current = settled ? to : x
      setValue(current.current)
      if (!settled) raf = requestAnimationFrame(step)
    }
    // The delay counts from mount, so a later `to` (or StrictMode's second run) does not wait again.
    const wait = Math.max(0, waitMs - (performance.now() - mountedAt))
    const id = setTimeout(() => (raf = requestAnimationFrame(step)), wait)
    return () => {
      clearTimeout(id)
      cancelAnimationFrame(raf)
    }
  }, [to, waitMs, mountedAt, reduced])
  return reduced ? to : value
}

/** Inline `animation-delay` in seconds. */
export function delay(s: number): CSSProperties {
  return { animationDelay: `${s.toFixed(2)}s` }
}

/** Inline custom properties, e.g. `vars({ '--rq-delay': '.3s' })`. */
export function vars(v: Record<`--${string}`, string | number>): CSSProperties {
  return v
}

/**
 * True for `ms` after `flag` turns true while mounted, so a screen can stay up long
 * enough for its exit (the answer lock-in) to play. `null` means not known yet: a flag
 * that is already true on first load never holds. Never holds under reduced motion.
 */
export function useHoldAfter(flag: boolean | null, ms: number): boolean {
  const [prev, setPrev] = useState(flag)
  const [holding, setHolding] = useState(false)
  if (flag !== prev) {
    setPrev(flag)
    if (flag && prev === false && !prefersReduced()) setHolding(true)
  }
  useEffect(() => {
    if (!holding) return
    const id = setTimeout(() => setHolding(false), ms)
    return () => clearTimeout(id)
  }, [holding, ms])
  return holding
}
