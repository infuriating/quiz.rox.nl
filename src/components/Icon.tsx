// Line icons as drawn in the designs. Names follow Font Awesome regular so they can
// be swapped 1:1 for the ROX Font Awesome kit later.
const PATHS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  xmark: <path d="M6 6l12 12M18 6L6 18" />,
  'arrow-up': <path d="M12 19V5M6 11l6-6 6 6" />,
  'arrow-down': <path d="M12 5v14M6 13l6 6 6-6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  minus: <path d="M6 12h12" />,
  'chevron-left': <path d="M15 5l-7 7 7 7" />,
  'chevron-right': <path d="M9 5l7 7-7 7" />,
  'chevron-down': <path d="M5 9l7 7 7-7" />,
  forward: <path d="M5 6l7 6-7 6V6zM13 6l7 6-7 6" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  wifi: (
    <>
      <path d="M2.5 9a14 14 0 0119 0M6 12.5a9 9 0 0112 0M9.5 16a4 4 0 015 0" />
      <circle cx="12" cy="19" r="0.8" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0113 0M16 4.8a3.5 3.5 0 010 6.4M18 14a6.5 6.5 0 013.5 6" />
    </>
  ),
  grip: (
    <>
      {[6, 12, 18].map((y) => (
        <g key={y}>
          <circle cx="9" cy={y} r="1" />
          <circle cx="15" cy={y} r="1" />
        </g>
      ))}
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  rotate: <path d="M20 12a8 8 0 11-2.3-5.6M20 4v5h-5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />,
  'arrow-up-right-from-square': (
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
  ),
  'eye-slash': (
    <path d="M3 3l18 18M10.6 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7a12.6 12.6 0 01-3 4.1M6.6 6.6A12.4 12.4 0 002 12c1 2.5 5 7 10 7a9.7 9.7 0 005.4-1.6" />
  ),
  display: (
    <>
      <rect x="2.5" y="4" width="19" height="12.5" rx="1.5" />
      <path d="M8 20.5h8M12 16.5v4" />
    </>
  ),
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  className,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {PATHS[name]}
    </svg>
  )
}
