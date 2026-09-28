import { useConvexMutation } from '@convex-dev/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../../../convex/_generated/api'
import { Button } from '~/components/Button'
import { CodeInput } from '~/components/CodeInput'
import { Input } from '~/components/Field'
import { errorCode, errorMessage } from '~/lib/errors'
import { playerStore } from '~/lib/storage'
import { PhoneFrame } from './PhoneFrame'

export function JoinScreen({ initialCode = '' }: { initialCode?: string }) {
  const navigate = useNavigate()
  const join = useConvexMutation(api.sessions.join)
  const [code, setCode] = useState(initialCode.toUpperCase())
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{
    field: 'code' | 'name' | 'email' | 'form'
    message: string
  } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6)
      return setError({
        field: 'code',
        message: 'Vul de zes tekens in die op het scherm staan.',
      })
    if (!name.trim())
      return setError({ field: 'name', message: 'Vul je naam in.' })
    setBusy(true)
    setError(null)
    try {
      const { sessionId, playerId } = await join({ code, name, email })
      playerStore.set(sessionId, playerId)
      await navigate({ to: '/play/$sessionId', params: { sessionId } })
    } catch (err) {
      const c = errorCode(err)
      const field =
        c === 'INVALID_CODE' || c === 'SESSION_FULL'
          ? 'code'
          : c === 'NAME_REQUIRED'
            ? 'name'
            : c === 'INVALID_EMAIL'
              ? 'email'
              : 'form'
      setError({ field, message: errorMessage(err) })
      setBusy(false)
    }
  }

  return (
    <PhoneFrame>
      <form
        onSubmit={submit}
        noValidate
        className="flex flex-1 flex-col gap-7 px-5 pt-9 pb-6"
      >
        <div className="flex flex-col gap-2.5">
          <h1 className="m-0 font-display text-[44px] leading-[1.05] font-bold tracking-display">
            Doe mee
          </h1>
          <p className="m-0 text-[17px] leading-[1.5] text-ink-70">
            Vul de code in en speel mee vanaf je telefoon.
          </p>
        </div>
        <CodeInput
          value={code}
          onChange={(v) => {
            setCode(v)
            if (error?.field === 'code') setError(null)
          }}
          error={error?.field === 'code' ? error.message : null}
        />
        <Input
          label="Naam"
          size="lg"
          autoComplete="given-name"
          placeholder="Je voornaam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error?.field === 'name' ? error.message : null}
        />
        <Input
          label="Werkmail"
          size="lg"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="naam@bedrijf.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error?.field === 'email' ? error.message : null}
        />
        <div className="flex-1" />
        {error?.field === 'form' && (
          <p className="m-0 text-sm text-error">{error.message}</p>
        )}
        <Button
          type="submit"
          size="lg"
          full
          iconRight="arrow-right"
          disabled={busy}
        >
          Deelnemen
        </Button>
        <p className="m-0 text-center text-[13px] leading-[1.45] text-ink-55">
          We gebruiken je e-mail alleen om je deelname aan deze quiz te
          registreren.
        </p>
      </form>
    </PhoneFrame>
  )
}
