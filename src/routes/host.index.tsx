import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PinScreen } from '~/features/host/PinScreen'
import { QuizPicker } from '~/features/host/QuizPicker'
import { Stage } from '~/features/host/Stage'
import { hostStore, pinStore, themeStore } from '~/lib/storage'

export const Route = createFileRoute('/host/')({
  ssr: false,
  component: HostStart,
})

function HostStart() {
  const navigate = useNavigate()
  const [pin, setPin] = useState<string | null>(() => pinStore.get())
  return (
    <Stage theme={themeStore.get()}>
      {pin ? (
        <QuizPicker
          pin={pin}
          onCreated={(sessionId, hostToken) => {
            hostStore.set(sessionId, hostToken)
            void navigate({ to: '/host/$sessionId', params: { sessionId } })
          }}
        />
      ) : (
        <PinScreen
          onOk={(p) => {
            pinStore.set(p)
            setPin(p)
          }}
        />
      )}
    </Stage>
  )
}
