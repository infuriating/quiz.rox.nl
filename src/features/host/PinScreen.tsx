import { useConvexMutation } from '@convex-dev/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { api } from '../../../convex/_generated/api'
import { Button } from '~/components/Button'
import { Label } from '~/components/Label'
import { errorMessage } from '~/lib/errors'
import { cn } from '~/lib/cn'

const LENGTH = 6

/** Simple centered PIN entry. Also used as the gate for /admin (compact variant). */
export function PinScreen({ onOk, compact }: { onOk: (pin: string) => void; compact?: boolean }) {
  const verify = useConvexMutation(api.sessions.verifyPin)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(true)
  const ref = useRef<HTMLInputElement>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await verify({ pin })
      onOk(pin)
    } catch (err) {
      setError(errorMessage(err))
      setPin('')
    }
  }

  const cell = compact ? 'h-16 w-[52px] rounded-sm' : 'h-32 w-[104px] rounded-md'
  return (
    <form onSubmit={submit} className={cn('flex flex-col items-center justify-center text-center', compact ? 'min-h-dvh gap-8 bg-ink-05 px-6' : 'h-full gap-14')}>
      <Label className={compact ? 'text-xs text-ink-55' : 'text-beamer-label text-host-muted'}>{compact ? 'Beheer' : 'Host'}</Label>
      <h1 className={cn('m-0 font-display font-bold', compact ? 'text-h2 tracking-display' : 'text-beamer-title leading-[1.04] tracking-hero text-host-text')}>Voer je host-PIN in</h1>
      <div className="relative flex gap-5" onClick={() => ref.current?.focus()}>
        <label htmlFor="pin" className="sr-only">
          Host-PIN
        </label>
        <input
          ref={ref}
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          maxLength={LENGTH}
          value={pin}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, '').slice(0, LENGTH))
            setError(null)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby="pin-msg"
          className="absolute inset-0 h-full w-full border-0 opacity-0"
        />
        {Array.from({ length: LENGTH }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              'box-border flex items-center justify-center bg-host-raised',
              cell,
              error ? 'border-2 border-error' : focused && i === Math.min(pin.length, LENGTH - 1) ? 'border-[3px] border-blue' : 'border-2 border-host-line',
            )}
          >
            {i < pin.length && <span className={cn('rounded-full bg-host-text', compact ? 'size-3' : 'size-[22px]')} />}
          </span>
        ))}
      </div>
      <p id="pin-msg" className={cn('m-0', compact ? 'text-sm' : 'text-beamer-label', error ? 'text-error' : 'text-host-muted')}>
        {error ?? 'De PIN staat in de Convex-omgeving als HOST_PIN.'}
      </p>
      <Button type="submit" size={compact ? 'lg' : 'beamer'} iconRight="arrow-right" disabled={pin.length < 4}>
        {compact ? 'Naar het beheer' : 'Verder'}
      </Button>
    </form>
  )
}
