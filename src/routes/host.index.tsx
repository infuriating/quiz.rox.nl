import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PasswordScreen } from '~/features/host/PasswordScreen'
import { QuizPicker } from '~/features/host/QuizPicker'
import { Stage } from '~/features/host/Stage'
import { hostStore, passwordStore, themeStore } from '~/lib/storage'

export const Route = createFileRoute('/host/')({
  ssr: false,
  component: HostStart,
})

function HostStart() {
  const navigate = useNavigate()
  const [password, setPassword] = useState<string | null>(() =>
    passwordStore.get(),
  )
  return (
    <Stage theme={themeStore.get()}>
      {password ? (
        <QuizPicker
          password={password}
          onCreated={(sessionId, hostToken) => {
            hostStore.set(sessionId, hostToken)
            void navigate({ to: '/host/$sessionId', params: { sessionId } })
          }}
        />
      ) : (
        <PasswordScreen
          onOk={(p) => {
            passwordStore.set(p)
            setPassword(p)
          }}
        />
      )}
    </Stage>
  )
}
