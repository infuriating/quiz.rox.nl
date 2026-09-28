import { ConvexError } from 'convex/values'
import { internal } from '../_generated/api'
import type { MutationCtx } from '../_generated/server'
import type { Doc } from '../_generated/dataModel'
import { getQuestions } from './data'
import { DEFAULT_IDLE_TIMEOUT_MINUTES } from './limits'

type Phase = Doc<'sessions'>['phase']

/** Throws unless the session is in one of the allowed phases. */
export function assertPhase(
  session: Doc<'sessions'>,
  ...allowed: Array<Phase>
): void {
  if (!allowed.includes(session.phase)) {
    throw new ConvexError({ code: 'WRONG_PHASE', phase: session.phase })
  }
}

async function cancelJob(
  ctx: MutationCtx,
  jobId: Doc<'sessions'>['scheduledRevealId'],
) {
  if (!jobId) return
  const job = await ctx.db.system.get('_scheduled_functions', jobId)
  if (job && job.state.kind === 'pending') await ctx.scheduler.cancel(jobId)
}

async function cancelScheduledReveal(
  ctx: MutationCtx,
  session: Doc<'sessions'>,
) {
  await cancelJob(ctx, session.scheduledRevealId)
}

/** Cancels every pending job of a session (reveal timer and expiry). */
export async function cancelSessionJobs(
  ctx: MutationCtx,
  session: Doc<'sessions'>,
) {
  await cancelJob(ctx, session.scheduledRevealId)
  await cancelJob(ctx, session.scheduledExpiryId)
}

/**
 * Pushes the expiry to idleTimeoutMinutes (default 60) from now. Called on session
 * creation and on every host action, so a session expires after that long without
 * host activity.
 */
export async function keepAlive(
  ctx: MutationCtx,
  session: Doc<'sessions'>,
): Promise<Doc<'sessions'>> {
  if (session.phase === 'finished') return session
  await cancelJob(ctx, session.scheduledExpiryId)
  const minutes = session.idleTimeoutMinutes ?? DEFAULT_IDLE_TIMEOUT_MINUTES
  const expiresAt = Date.now() + minutes * 60 * 1000
  const scheduledExpiryId = await ctx.scheduler.runAt(
    expiresAt,
    internal.game.expire,
    { sessionId: session._id },
  )
  await ctx.db.patch('sessions', session._id, { expiresAt, scheduledExpiryId })
  return { ...session, expiresAt, scheduledExpiryId }
}

/** Opens question `index` with server time and schedules the automatic reveal. */
export async function startQuestion(
  ctx: MutationCtx,
  session: Doc<'sessions'>,
  index: number,
) {
  const questions = await getQuestions(ctx, session.quizId)
  const question = questions[index]
  if (!question) throw new ConvexError({ code: 'NO_SUCH_QUESTION' })
  await cancelScheduledReveal(ctx, session)
  const now = Date.now()
  const endsAt = now + question.timeLimitSec * 1000
  const scheduledRevealId = await ctx.scheduler.runAt(
    endsAt,
    internal.game.autoReveal,
    {
      sessionId: session._id,
      questionIndex: index,
    },
  )
  await ctx.db.patch('sessions', session._id, {
    phase: 'question',
    currentQuestionIndex: index,
    questionStartedAt: now,
    questionEndsAt: endsAt,
    scheduledRevealId,
  })
}

/** Moves to reveal and cancels a pending automatic reveal. */
export async function revealNow(
  ctx: MutationCtx,
  session: Doc<'sessions'>,
  index = session.currentQuestionIndex,
) {
  await cancelScheduledReveal(ctx, session)
  await ctx.db.patch('sessions', session._id, {
    phase: 'reveal',
    currentQuestionIndex: index,
    scheduledRevealId: undefined,
  })
}

export async function finish(
  ctx: MutationCtx,
  session: Doc<'sessions'>,
  endReason: 'completed' | 'ended' | 'expired',
) {
  await cancelSessionJobs(ctx, session)
  await ctx.db.patch('sessions', session._id, {
    phase: 'finished',
    endReason,
    scheduledRevealId: undefined,
    scheduledExpiryId: undefined,
    finishedAt: Date.now(),
  })
}
