import type { ReactNode } from 'react'
import { Badge } from '~/components/Badge'
import { Icon } from '~/components/Icon'
import { Label } from '~/components/Label'
import type { SanitizedQuestion } from '../../../convex/lib/data'

export function HostHeader({
  question,
  right,
}: {
  question: Pick<SanitizedQuestion, 'index' | 'total' | 'topic' | 'type'>
  right?: ReactNode
}) {
  return (
    <div className="flex h-12 items-center justify-between">
      <div className="flex items-center gap-5">
        <Label className="text-beamer-label text-host-text">
          Vraag {question.index + 1} / {question.total}
        </Label>
        <Badge tone="host" size="beamer">
          {question.topic}
        </Badge>
        {question.type === 'multi' && (
          <span className="text-beamer-label font-semibold text-host-accent">
            Selecteer alles wat van toepassing is
          </span>
        )}
      </div>
      {right}
    </div>
  )
}

export function AnsweredCounter({
  answered,
  of,
}: {
  answered: number
  of: number
}) {
  return (
    <div
      role="status"
      className="flex items-center gap-3.5 font-display text-host-text"
    >
      <Icon name="users" size={32} className="text-host-muted" />
      <span className="tabular text-beamer-h3 font-bold">
        {answered} / {of}
      </span>
      <span className="font-body text-[24px] text-host-muted">beantwoord</span>
    </div>
  )
}
