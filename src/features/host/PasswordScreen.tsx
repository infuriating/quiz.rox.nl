import { useConvexMutation } from '@convex-dev/react-query'
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../../../convex/_generated/api'
import { Button } from '~/components/Button'
import { Label } from '~/components/Label'
import { errorMessage } from '~/lib/errors'
import { cn } from '~/lib/cn'

/**
 * Host password entry, centred. Also the gate for /admin (compact variant).
 * Always masked, with no "show password" toggle: on /host this screen is on
 * the projector. `autocomplete="current-password"` lets a password manager fill it.
 */
export function PasswordScreen({
  onOk,
  compact,
}: {
  onOk: (password: string) => void
  compact?: boolean
}) {
  const verify = useConvexMutation(api.sessions.verifyPassword)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const id = useId()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await verify({ password })
      onOk(password)
    } catch (err) {
      setError(errorMessage(err))
      setPassword('')
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'min-h-dvh gap-8 bg-ink-05 px-6' : 'h-full gap-14',
      )}
    >
      {/* Lets a password manager tie the saved password to this app. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value="host"
        readOnly
        hidden
      />
      <Label
        className={
          compact ? 'text-xs text-ink-55' : 'text-beamer-label text-host-muted'
        }
      >
        {compact ? 'Beheer' : 'Host'}
      </Label>
      <h1
        className={cn(
          'm-0 font-display font-bold',
          compact
            ? 'text-h2 tracking-display'
            : 'text-beamer-title leading-[1.04] tracking-hero text-host-text',
        )}
      >
        Voer het hostwachtwoord in
      </h1>
      <div
        className={cn(
          'flex w-full flex-col gap-3 text-left',
          compact ? 'max-w-[440px]' : 'max-w-[720px]',
        )}
      >
        <label htmlFor={id} className="sr-only">
          Hostwachtwoord
        </label>
        <input
          id={id}
          type="password"
          name="password"
          autoComplete="current-password"
          autoFocus
          spellCheck={false}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-msg`}
          className={cn(
            'box-border w-full bg-host-raised font-body text-host-text focus:outline-none',
            compact
              ? 'h-14 rounded-sm px-4 text-[17px]'
              : 'h-[88px] rounded-md px-7 text-[32px] tracking-[0.12em]',
            error
              ? 'border-2 border-error shadow-[0_0_0_4px_var(--status-error-ring)]'
              : 'border-2 border-host-line focus:border-blue',
          )}
        />
        <p
          id={`${id}-msg`}
          className={cn(
            'm-0 text-center',
            compact ? 'text-sm' : 'text-beamer-label',
            error ? 'text-error' : 'text-host-muted',
          )}
        >
          {error ??
            'Het wachtwoord staat in de Convex-omgeving als HOST_PASSWORD.'}
        </p>
      </div>
      <Button
        type="submit"
        size={compact ? 'lg' : 'beamer'}
        iconRight="arrow-right"
        disabled={busy || password.length === 0}
      >
        {compact ? 'Naar het beheer' : 'Verder'}
      </Button>
    </form>
  )
}
