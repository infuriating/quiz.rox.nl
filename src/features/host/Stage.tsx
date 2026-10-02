import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const W = 1920
const H = 1080

/** The 1920x1080 beamer design at `scale`, in a box of the scaled size. */
function Canvas({
  theme,
  scale,
  children,
}: {
  theme: 'light' | 'dark'
  scale: number
  children: ReactNode
}) {
  return (
    // The outer box has the scaled size so flex centring works; the inner stage keeps 1920x1080.
    <div
      data-theme={theme}
      className="relative shrink-0"
      style={{ width: W * scale, height: H * scale }}
    >
      <div
        className="absolute top-0 left-0 overflow-hidden bg-host-bg font-body text-host-text"
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Renders the beamer design at exactly 1920x1080 and scales it to fit any screen. */
export function Stage({
  theme,
  children,
  onDoubleClick,
}: {
  theme: 'light' | 'dark'
  children: ReactNode
  onDoubleClick?: () => void
}) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / W, window.innerHeight / H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div
      data-theme={theme}
      onDoubleClick={onDoubleClick}
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-host-bg"
    >
      <Canvas theme={theme} scale={scale}>
        {children}
      </Canvas>
    </div>
  )
}

/**
 * The same stage scaled to the width of its container, for the preview on the manage
 * dashboard. Inert and hidden from screen readers: the dashboard says it in its own words.
 */
export function StagePreview({
  theme,
  children,
}: {
  theme: 'light' | 'dark'
  children: ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / W),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div
      ref={box}
      aria-hidden="true"
      inert
      className="aspect-video w-full overflow-hidden rounded-sm border border-ink-15"
    >
      {scale > 0 && (
        <Canvas theme={theme} scale={scale}>
          {children}
        </Canvas>
      )}
    </div>
  )
}
