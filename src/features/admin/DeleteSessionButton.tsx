import { useConvexMutation } from '@convex-dev/react-query'
import { useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/Button'
import { errorMessage } from '~/lib/errors'
import { useAdminPassword } from './password'

/** Deletes a session with all its players and answers, after a confirm. */
export function DeleteSessionButton({
  sessionId,
  size = 'sm',
  onDeleted,
}: {
  sessionId: Id<'sessions'>
  size?: 'sm' | 'lg'
  onDeleted?: () => void
}) {
  const password = useAdminPassword()
  const remove = useConvexMutation(api.admin.deleteSession)
  const [busy, setBusy] = useState(false)
  return (
    <Button
      variant="ghost"
      size={size}
      icon="trash"
      disabled={busy}
      onClick={async () => {
        if (
          !window.confirm(
            'Deze sessie verwijderen? Alle deelnemers en antwoorden worden definitief verwijderd, ook uit de exports.',
          )
        )
          return
        setBusy(true)
        try {
          await remove({ password, sessionId })
          onDeleted?.()
        } catch (e) {
          window.alert(errorMessage(e))
          setBusy(false)
        }
      }}
    >
      Verwijderen
    </Button>
  )
}
