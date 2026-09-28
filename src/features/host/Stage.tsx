import { useEffect, useState, type ReactNode } from 'react'

const W = 1920
const H = 1080

/** Renders the beamer design at exactly 1920x1080 and scales it to fit any screen. */
export function Stage({
  theme,
  children,
}: {
  theme: 'light' | 'dark'
  children: ReactNode
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
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-host-bg"
    >
      {/* The outer box has the scaled size so flex centring works; the inner stage keeps 1920x1080. */}
      <div
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
    </div>
  )
}
