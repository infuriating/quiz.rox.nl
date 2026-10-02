import { useConvexMutation } from '@convex-dev/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/Badge'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { Icon } from '~/components/Icon'
import type { IconName } from '~/components/Icon'
import { Label } from '~/components/Label'
import { BeamerScreen, hasPodium } from '~/features/host/BeamerScreen'
import { StagePreview } from '~/features/host/Stage'
import { useStored } from '~/features/host/sync'
import type { HostView, ManageView } from '~/features/host/types'
import { cn } from '~/lib/cn'
import { errorMessage } from '~/lib/errors'
import { thanksStore, themeStore } from '~/lib/storage'
import {
  AnswerKeyCard,
  CardTitle,
  NextCard,
  PhaseStats,
  PicksCard,
  PlayersCard,
  ProgressCard,
  ShareCard,
} from './cards'

type Action = {
  label: string
  icon?: IconName
  iconRight?: IconName
  /** `KeyboardEvent.key` that triggers it, and how the button shows it. */
  key: string
  keyLabel: string
  run: () => void
  disabled?: boolean
}

/** Opens the beamer as its own window, or brings the one already open to the front. */
function openBeamer(sessionId: string) {
  window.open(
    `/beamer/${sessionId}`,
    `rq-beamer-${sessionId}`,
    'popup,width=1280,height=720',
  )
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

function Kbd({
  children,
  onPrimary,
}: {
  children: string
  onPrimary?: boolean
}) {
  return (
    <kbd
      className={cn(
        'ml-1 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[6px] px-1.5 font-display text-xs font-medium max-lg:hidden',
        onPrimary
          ? 'bg-white/20 text-white'
          : 'border border-ink-25 bg-ink-10 text-ink-55',
      )}
    >
      {children}
    </kbd>
  )
}

function statusBadge(view: HostView) {
  const s = view.session
  const n = `${s.currentQuestionIndex + 1} / ${s.totalQuestions}`
  switch (s.phase) {
    case 'lobby':
      return { tone: 'blue', text: 'Lobby open' } as const
    case 'question':
      return { tone: 'success', text: `Live · Vraag ${n}` } as const
    case 'reveal':
      return { tone: 'success', text: `Live · Resultaat ${n}` } as const
    case 'leaderboard':
      return { tone: 'success', text: `Live · Tussenstand ${n}` } as const
    case 'finished':
      return {
        tone: 'neutral',
        text: s.endReason === 'expired' ? 'Verlopen' : 'Afgerond',
      } as const
  }
}

/**
 * The host's own screen: every control and everything only the host may see. The room
 * sees /beamer, which has no controls; the preview here renders that same screen.
 */
export function ManageDashboard({
  sessionId,
  hostToken,
  view,
  manage,
  remainingMs,
}: {
  sessionId: Id<'sessions'>
  hostToken: string
  view: HostView
  manage: ManageView
  remainingMs: number
}) {
  const args = { sessionId, hostToken }
  const [theme, refreshTheme] = useStored(themeStore.get)
  const readThanks = useCallback(() => thanksStore.get(sessionId), [sessionId])
  const [thanksShown, refreshThanks] = useStored(readThanks)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const start = useConvexMutation(api.game.start)
  const next = useConvexMutation(api.game.next)
  const previous = useConvexMutation(api.game.previous)
  const skip = useConvexMutation(api.game.skipTimer)
  const end = useConvexMutation(api.game.end)

  const run = (fn: (a: typeof args) => Promise<unknown>) => async () => {
    setBusy(true)
    setActionError(null)
    try {
      await fn(args)
    } catch (e) {
      setActionError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  const setTheme = (t: 'light' | 'dark') => {
    themeStore.set(t)
    refreshTheme()
  }
  const confirmEnd = () => {
    if (
      window.confirm('Sessie beëindigen? Spelers zien direct het eindscherm.')
    )
      void run(end)()
  }

  const s = view.session
  const isLast = s.currentQuestionIndex + 1 >= s.totalQuestions
  const canGoBack =
    s.phase === 'leaderboard' ||
    ((s.phase === 'question' || s.phase === 'reveal') &&
      s.currentQuestionIndex > 0)
  const back: Action | null = canGoBack
    ? {
        label: 'Vorige',
        icon: 'chevron-left',
        key: 'ArrowLeft',
        keyLabel: '←',
        run: () => void run(previous)(),
      }
    : null
  const forward = (label: string): Action => ({
    label,
    iconRight: 'chevron-right',
    key: 'ArrowRight',
    keyLabel: '→',
    run: () => void run(next)(),
  })
  let primary: Action | null = null
  switch (s.phase) {
    case 'lobby':
      primary = {
        label: 'Start de quiz',
        iconRight: 'arrow-right',
        key: 'ArrowRight',
        keyLabel: '→',
        run: () => void run(start)(),
        disabled: s.playerCount === 0,
      }
      break
    case 'question':
      primary = {
        label: 'Timer overslaan',
        icon: 'forward',
        key: 's',
        keyLabel: 'S',
        run: () => void run(skip)(),
      }
      break
    case 'reveal':
      primary = forward(
        s.scoringEnabled
          ? 'Tussenstand'
          : isLast
            ? 'Afronden'
            : 'Volgende vraag',
      )
      break
    case 'leaderboard':
      primary = forward(isLast ? 'Afronden' : 'Volgende vraag')
      break
    case 'finished':
      if (hasPodium(view) && !thanksShown)
        primary = {
          label: 'Naar het bedankscherm',
          iconRight: 'chevron-right',
          key: 'ArrowRight',
          keyLabel: '→',
          run: () => {
            thanksStore.set(sessionId)
            refreshThanks()
          },
        }
      break
  }

  // The dashboard has focus while another window is shared, so the keys work from here.
  // One listener for the page's lifetime; it reads the current actions from this ref.
  const keys = useRef<{ actions: Array<Action>; busy: boolean }>({
    actions: [],
    busy: false,
  })
  useEffect(() => {
    keys.current = {
      actions: [back, primary].filter((a): a is Action => a !== null),
      busy,
    }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target))
        return
      const action = keys.current.actions.find(
        (a) => a.key.toLowerCase() === e.key.toLowerCase(),
      )
      if (!action || action.disabled || keys.current.busy) return
      e.preventDefault()
      action.run()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const badge = statusBadge(view)
  const asking = s.phase === 'question'
  const revealed = s.phase === 'reveal' || s.phase === 'leaderboard'

  return (
    <div className="min-h-dvh bg-ink-10 text-ink">
      <header className="flex min-h-[72px] flex-wrap items-center gap-x-6 gap-y-3 border-b border-ink-15 bg-white px-4 py-3 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center bg-ink font-display text-[17px] font-bold text-white"
          >
            R
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <Label className="text-[11px]">Sessie beheren</Label>
            <span className="truncate font-display text-[17px] font-semibold tracking-heading">
              {s.quizTitle}
            </span>
          </div>
          <Badge tone={badge.tone} className="ml-3 gap-2 max-sm:hidden">
            {badge.tone === 'success' && (
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-success"
              />
            )}
            {badge.text}
          </Badge>
        </div>
        <span className="flex items-center gap-2 text-sm text-ink-55">
          Code
          <span className="font-display text-base font-semibold tracking-label text-ink">
            {s.joinCode}
          </span>
        </span>
        <span aria-hidden="true" className="h-6 w-px bg-ink-15 max-md:hidden" />
        <Button
          variant="outline"
          icon="arrow-up-right-from-square"
          onClick={() => openBeamer(sessionId)}
        >
          Open beamerscherm
        </Button>
        {s.phase !== 'finished' && (
          <Button
            variant="ghost"
            icon="stop"
            disabled={busy}
            onClick={confirmEnd}
          >
            Sessie beëindigen
          </Button>
        )}
      </header>

      <main className="mx-auto box-border grid max-w-[1376px] items-start gap-6 p-4 pb-32 md:p-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-8">
        {actionError && (
          <p
            role="alert"
            className="m-0 rounded-sm bg-error-soft px-5 py-3 text-[15px] text-error lg:col-span-2"
          >
            {actionError}
          </p>
        )}
        <div className="flex min-w-0 flex-col gap-6">
          {s.phase === 'lobby' && (
            <ShareCard onOpenBeamer={() => openBeamer(sessionId)} />
          )}

          <Card aria-labelledby="nu" className="flex flex-col gap-5 p-6">
            <CardTitle
              id="nu"
              right={
                <div
                  role="group"
                  aria-label="Thema beamerscherm"
                  className="flex rounded-pill border border-ink-15 bg-ink-10 p-[3px]"
                >
                  {(
                    [
                      ['light', 'Licht', 'sun'],
                      ['dark', 'Donker', 'moon'],
                    ] as const
                  ).map(([value, label, icon]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={theme === value}
                      onClick={() => setTheme(value)}
                      className={cn(
                        'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-pill border-0 px-3.5 text-sm font-medium',
                        theme === value
                          ? 'bg-white text-ink shadow-card'
                          : 'bg-transparent text-ink-70 hover:text-ink',
                      )}
                    >
                      <Icon name={icon} size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              }
            >
              Nu op het beamerscherm
            </CardTitle>

            <div className="grid items-center gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <StagePreview theme={theme}>
                <BeamerScreen
                  view={view}
                  remainingMs={remainingMs}
                  thanksShown={thanksShown}
                />
              </StagePreview>
              <PhaseStats view={view} remainingMs={remainingMs} />
            </div>

            {(back || primary || asking) && (
              <nav
                aria-label="Hostbediening"
                className="flex items-center gap-3 border-t border-ink-15 pt-5 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-20 max-lg:bg-white max-lg:px-4 max-lg:pt-3.5 max-lg:pb-7"
              >
                {s.phase === 'lobby' && (
                  <span className="flex-1 text-sm text-ink-55 max-lg:hidden">
                    {s.totalQuestions} vragen · score{' '}
                    {s.scoringEnabled ? 'aan' : 'uit'}
                  </span>
                )}
                {back && (
                  <Button
                    variant="outline"
                    size="lg"
                    icon={back.icon}
                    disabled={busy}
                    onClick={back.run}
                    aria-keyshortcuts={back.key}
                    className="px-6 font-medium max-lg:px-5"
                  >
                    {back.label}
                    <Kbd>{back.keyLabel}</Kbd>
                  </Button>
                )}
                {primary && (
                  <Button
                    size="lg"
                    icon={primary.icon}
                    iconRight={primary.iconRight}
                    disabled={busy || primary.disabled}
                    onClick={primary.run}
                    aria-keyshortcuts={primary.key}
                    className={cn(s.phase !== 'lobby' && 'flex-1')}
                  >
                    {primary.label}
                    <Kbd onPrimary>{primary.keyLabel}</Kbd>
                  </Button>
                )}
                {asking && (
                  <Button
                    variant="outline"
                    size="lg"
                    iconRight="chevron-right"
                    disabled
                    className="font-medium max-lg:hidden"
                  >
                    Volgende
                  </Button>
                )}
              </nav>
            )}
          </Card>

          {asking && <AnswerKeyCard view={view} manage={manage} />}
          {revealed && <PicksCard view={view} manage={manage} />}
        </div>

        <aside className="flex flex-col gap-6">
          {revealed && <NextCard view={view} manage={manage} />}
          <PlayersCard view={view} manage={manage} />
          {!revealed && <NextCard view={view} manage={manage} />}
          <ProgressCard view={view} />
        </aside>
      </main>
    </div>
  )
}
