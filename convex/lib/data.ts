import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'
import { MAX_PLAYERS_PER_SESSION, MAX_QUESTIONS_PER_QUIZ } from './limits'

type Ctx = QueryCtx | MutationCtx

export async function getQuestions(
  ctx: Ctx,
  quizId: Id<'quizzes'>,
): Promise<Array<Doc<'questions'>>> {
  return await ctx.db
    .query('questions')
    .withIndex('by_quizId_and_order', (q) => q.eq('quizId', quizId))
    .take(MAX_QUESTIONS_PER_QUIZ)
}

export async function getPlayers(
  ctx: Ctx,
  sessionId: Id<'sessions'>,
): Promise<Array<Doc<'players'>>> {
  return await ctx.db
    .query('players')
    .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
    .take(MAX_PLAYERS_PER_SESSION)
}

export async function getAnswers(
  ctx: Ctx,
  sessionId: Id<'sessions'>,
  questionId: Id<'questions'>,
): Promise<Array<Doc<'answers'>>> {
  return await ctx.db
    .query('answers')
    .withIndex('by_sessionId_and_questionId', (q) =>
      q.eq('sessionId', sessionId).eq('questionId', questionId),
    )
    .take(MAX_PLAYERS_PER_SESSION)
}

export async function getPlayerAnswer(
  ctx: Ctx,
  playerId: Id<'players'>,
  questionId: Id<'questions'>,
): Promise<Doc<'answers'> | null> {
  return await ctx.db
    .query('answers')
    .withIndex('by_playerId_and_questionId', (q) =>
      q.eq('playerId', playerId).eq('questionId', questionId),
    )
    .unique()
}

/** The public shape of a question: no correct flags, no explanation. Safe before reveal. */
export function sanitizeQuestion(
  question: Doc<'questions'>,
  index: number,
  total: number,
) {
  return {
    id: question._id,
    index,
    total,
    topic: question.topic,
    text: question.text,
    type: question.type,
    timeLimitSec: question.timeLimitSec,
    options: question.options.map((o) => ({ id: o.id, text: o.text })),
  }
}
export type SanitizedQuestion = ReturnType<typeof sanitizeQuestion>

/** Count per option id, derived from the answers table. Only call from reveal onward. */
export function distribution(
  question: Doc<'questions'>,
  answers: Array<Doc<'answers'>>,
) {
  const counts = new Map<string, number>(question.options.map((o) => [o.id, 0]))
  for (const a of answers) {
    for (const id of a.optionIds) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return question.options.map((o) => ({
    optionId: o.id,
    count: counts.get(o.id) ?? 0,
  }))
}

export function correctOptionIds(question: Doc<'questions'>): Array<string> {
  return question.type === 'poll'
    ? []
    : question.options.filter((o) => o.correct).map((o) => o.id)
}

/** Non-poll questions without a correct option block a session from starting. */
export function questionsMissingCorrect(
  questions: Array<Doc<'questions'>>,
): Array<number> {
  return questions
    .filter((q) => q.type !== 'poll' && !q.options.some((o) => o.correct))
    .map((q) => q.order)
}

export function sameSet(a: Array<string>, b: Array<string>): boolean {
  if (a.length !== b.length) return false
  const s = new Set(a)
  return b.every((x) => s.has(x))
}
