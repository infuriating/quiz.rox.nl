import { useConvexMutation } from '@convex-dev/react-query'
import { useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/Button'
import { errorMessage } from '~/lib/errors'
import { useAdminPassword } from './password'

/** "Zet inactief" / "Activeer" and "Verwijderen" for one quiz. */
export function QuizActions({
  quizId,
  title,
  active,
  sessionCount,
  onDeleted,
}: {
  quizId: Id<'quizzes'>
  title: string
  active: boolean
  sessionCount: number
  onDeleted?: () => void
}) {
  const password = useAdminPassword()
  const setActive = useConvexMutation(api.admin.setQuizActive)
  const remove = useConvexMutation(api.admin.deleteQuiz)
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      window.alert(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const sessionsText =
    sessionCount === 0
      ? 'Deze quiz heeft nog geen sessies.'
      : `Ook ${sessionCount === 1 ? 'de sessie' : `alle ${sessionCount} sessies`} met deelnemers, antwoorden en resultaten ${sessionCount === 1 ? 'wordt' : 'worden'} verwijderd.`

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() =>
          void run(() => setActive({ password, quizId, active: !active }))
        }
      >
        {active ? 'Zet inactief' : 'Activeer'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon="trash"
        disabled={busy}
        onClick={() => {
          if (
            !window.confirm(
              `"${title}" definitief verwijderen? ${sessionsText} Wil je de resultaten bewaren, zet de quiz dan op inactief.`,
            )
          )
            return
          void run(async () => {
            await remove({ password, quizId })
            onDeleted?.()
          })
        }}
      >
        Verwijderen
      </Button>
    </>
  )
}
