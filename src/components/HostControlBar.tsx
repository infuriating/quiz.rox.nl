import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'

function Ghost({
  label,
  icon,
  onClick,
  disabled,
  iconRight,
}: {
  label: string
  icon: IconName
  onClick?: () => void
  disabled?: boolean
  iconRight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-pill px-3.5 text-[15px] font-medium text-host-ctrl-text transition-colors hover:text-host-text disabled:cursor-default disabled:opacity-40"
    >
      {!iconRight && <Icon name={icon} size={16} />}
      {label}
      {iconRight && <Icon name={icon} size={16} />}
    </button>
  )
}

/**
 * Compact pill at the bottom edge. Only "Volgende" is filled. Left: join code for late joiners.
 * Pass `null` for a control to hide it in a phase where it does not apply.
 */
export function HostControlBar({
  onPrevious,
  onSkipTimer,
  onNext,
  nextLabel = 'Volgende',
  onEnd,
  onToggleTheme,
  dark,
  joinCode,
  right,
  busy,
}: {
  onPrevious?: (() => void) | null
  onSkipTimer?: (() => void) | null
  onNext?: (() => void) | null
  nextLabel?: string
  onEnd?: (() => void) | null
  onToggleTheme?: () => void
  dark?: boolean
  joinCode?: string | null
  right?: ReactNode
  busy?: boolean
}) {
  return (
    <div className="absolute right-20 bottom-7 left-20 flex items-center justify-between">
      {joinCode ? (
        <span className="text-base text-host-muted">
          {typeof window !== 'undefined' ? window.location.host : ''} ·{' '}
          <span className="font-display font-semibold tracking-label text-host-soft">
            {joinCode}
          </span>
        </span>
      ) : (
        <span />
      )}
      <nav
        aria-label="Hostbediening"
        className="flex items-center gap-0.5 rounded-pill border border-host-ctrl-line bg-host-ctrl-bg p-1"
      >
        {onPrevious && (
          <Ghost
            label="Vorige"
            icon="chevron-left"
            onClick={onPrevious}
            disabled={busy}
          />
        )}
        {onSkipTimer && (
          <Ghost
            label="Timer overslaan"
            icon="forward"
            onClick={onSkipTimer}
            disabled={busy}
          />
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={busy}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-pill bg-host-ctrl-primary-bg px-[18px] text-[15px] font-semibold text-host-ctrl-primary-fg disabled:opacity-60"
          >
            {nextLabel}
            <Icon name="chevron-right" size={16} />
          </button>
        )}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={dark ? 'Lichte modus' : 'Donkere modus'}
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-pill text-host-ctrl-text hover:text-host-text"
          >
            <Icon name={dark ? 'sun' : 'moon'} size={16} />
          </button>
        )}
        {onEnd && (
          <>
            <span aria-hidden="true" className="h-5 w-px bg-host-ctrl-line" />
            <Ghost
              label="Sessie beëindigen"
              icon="stop"
              onClick={onEnd}
              disabled={busy}
            />
          </>
        )}
      </nav>
      {right ?? <span />}
    </div>
  )
}
