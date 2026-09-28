import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Button } from '~/components/Button'
import { Icon } from '~/components/Icon'
import { Label } from '~/components/Label'
import { useAdminPassword } from '~/features/admin/password'
import { QuestionForm } from '~/features/admin/QuestionForm'
import { QuizSettings } from '~/features/admin/QuizSettings'
import { cn } from '~/lib/cn'

export const Route = createFileRoute('/admin/quizzes/$quizId')({
  component: QuestionEditor,
})

const TYPE_LABEL = { single: 'Enkel', multi: 'Meerdere', poll: 'Poll' } as const

function QuestionEditor() {
  const password = useAdminPassword()
  const { quizId } = Route.useParams()
  const { data } = useQuery(
    convexQuery(api.admin.getQuiz, {
      password,
      quizId: quizId as Id<'quizzes'>,
    }),
  )
  const move = useConvexMutation(api.admin.moveQuestion)
  const [selected, setSelected] = useState<Id<'questions'> | 'new' | null>(null)
  const [dragId, setDragId] = useState<Id<'questions'> | null>(null)

  if (data === undefined) return null
  if (data === null)
    return (
      <main className="px-10 py-12 text-ink-70">Deze quiz bestaat niet.</main>
    )
  const { quiz, questions } = data
  const current =
    selected === 'new'
      ? null
      : (questions.find((q) => q._id === selected) ?? questions[0] ?? null)
  const isNew = selected === 'new' || questions.length === 0

  return (
    <div className="flex min-h-[calc(100dvh-64px)]">
      <aside className="flex w-[360px] shrink-0 flex-col gap-5 border-r border-ink-15 bg-white px-5 py-8">
        <div className="flex flex-col gap-1.5 px-2">
          <Link to="/admin" className="text-sm text-blue no-underline">
            Quizzen
          </Link>
          <span className="font-display text-[20px] font-semibold tracking-heading">
            {quiz.title}
          </span>
        </div>
        <QuizSettings key={quiz._id} quiz={quiz} />
        <div className="flex items-center justify-between px-2">
          <Label className="text-[11px] text-ink-55">
            {questions.length} vragen
          </Label>
          <span className="text-[13px] text-ink-55">Sleep om te ordenen</span>
        </div>
        <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
          {questions.map((q) => {
            const on = !isNew && current?._id === q._id
            const missing =
              q.type !== 'poll' && !q.options.some((o) => o.correct)
            return (
              <li
                key={q._id}
                draggable
                onDragStart={() => setDragId(q._id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId && dragId !== q._id)
                    void move({
                      password,
                      questionId: dragId,
                      toOrder: q.order,
                    })
                  setDragId(null)
                }}
                className={cn(
                  'flex items-center gap-3 rounded-sm py-1 pr-3 pl-2',
                  on && 'bg-blue-100',
                  dragId === q._id && 'opacity-50',
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex size-7 cursor-grab items-center justify-center text-ink-40"
                >
                  <Icon name="grip" size={18} />
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(q._id)}
                  className="flex flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent py-2 text-left"
                >
                  <span
                    className={cn(
                      'w-7 font-display text-sm font-semibold',
                      on ? 'text-blue-600' : 'text-ink-55',
                    )}
                  >
                    {String(q.order).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'flex-1 text-[15px]',
                      on ? 'font-semibold' : 'font-medium',
                    )}
                  >
                    {q.topic || 'Zonder onderwerp'}
                    {missing && (
                      <span className="sr-only"> (nog geen goed antwoord)</span>
                    )}
                  </span>
                  {missing && (
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full bg-error"
                    />
                  )}
                  <span className="rox-label text-[10px] text-ink-55">
                    {TYPE_LABEL[q.type]}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <Button
          variant="outline"
          size="md"
          icon="plus"
          onClick={() => setSelected('new')}
        >
          Vraag toevoegen
        </Button>
      </aside>
      <QuestionForm
        key={isNew ? 'new' : current?._id}
        quizId={quiz._id}
        question={isNew ? null : current}
        count={questions.length}
        onSaved={(id) => setSelected(id)}
        onDeleted={() => setSelected(null)}
      />
    </div>
  )
}
