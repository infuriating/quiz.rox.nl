import { ConvexError, v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { internal } from './_generated/api'
import { requirePassword } from './lib/auth'
import { cancelSessionJobs } from './lib/flow'
import { distribution, getAnswers, getPlayers, getQuestions } from './lib/data'
import {
  MAX_OPTION_LENGTH,
  MAX_IDLE_TIMEOUT_MINUTES,
  MAX_OUTRO_LENGTH,
  MAX_PLAYERS_PER_SESSION,
  MAX_QUESTION_LENGTH,
  MAX_QUIZZES,
  MAX_SESSIONS_PER_QUIZ,
  PURGE_BATCH_SIZE,
} from './lib/limits'
import { rateLimiter } from './lib/rateLimits'
import { optionValidator, questionTypeValidator } from './lib/validators'

const passwordArg = { password: v.string() }

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

export const listQuizzes = query({
  args: passwordArg,
  handler: async (ctx, { password }) => {
    requirePassword(password)
    const quizzes = (await ctx.db.query('quizzes').take(MAX_QUIZZES)).filter(
      (q) => q.deletedAt === undefined,
    )
    return await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await getQuestions(ctx, quiz._id)
        const sessions = await ctx.db
          .query('sessions')
          .withIndex('by_quizId', (q) => q.eq('quizId', quiz._id))
          .order('desc')
          .take(MAX_SESSIONS_PER_QUIZ)
        const sessionRows = await Promise.all(
          sessions
            .filter((s) => s.deletedAt === undefined)
            .map(async (s) => {
              const players = await getPlayers(ctx, s._id)
              let answerCount = 0
              for (const q of questions)
                answerCount += (await getAnswers(ctx, s._id, q._id)).length
              return {
                id: s._id,
                createdAt: s.createdAt,
                finishedAt: s.finishedAt ?? null,
                phase: s.phase,
                endReason: s.endReason ?? null,
                scoringEnabled: s.scoringEnabled,
                playerCount: players.length,
                answerCount,
              }
            }),
        )
        return {
          id: quiz._id,
          title: quiz.title,
          description: quiz.description ?? null,
          scoringEnabled: quiz.scoringEnabled,
          active: quiz.inactive !== true,
          maxPlayers: quiz.maxPlayers ?? null,
          questionCount: questions.length,
          missingCorrect: questions
            .filter(
              (q) => q.type !== 'poll' && !q.options.some((o) => o.correct),
            )
            .map((q) => q.order),
          sessions: sessionRows,
        }
      }),
    )
  },
})

export const getQuiz = query({
  args: { ...passwordArg, quizId: v.id('quizzes') },
  handler: async (ctx, { password, quizId }) => {
    requirePassword(password)
    const quiz = await ctx.db.get('quizzes', quizId)
    if (!quiz || quiz.deletedAt !== undefined) return null
    return { quiz, questions: await getQuestions(ctx, quizId) }
  },
})

export const createQuiz = mutation({
  args: { ...passwordArg, title: v.string() },
  handler: async (ctx, { password, title }) => {
    requirePassword(password)
    const clean = title.trim()
    if (!clean) throw new ConvexError({ code: 'TITLE_REQUIRED' })
    return await ctx.db.insert('quizzes', {
      title: clean,
      scoringEnabled: false,
    })
  },
})

/** Inactive: hidden from the host's quiz picker and no new sessions; results stay. */
export const setQuizActive = mutation({
  args: { ...passwordArg, quizId: v.id('quizzes'), active: v.boolean() },
  handler: async (ctx, { password, quizId, active }) => {
    requirePassword(password)
    const quiz = await ctx.db.get('quizzes', quizId)
    if (!quiz || quiz.deletedAt !== undefined)
      throw new ConvexError({ code: 'NO_QUIZ' })
    await ctx.db.patch('quizzes', quizId, {
      inactive: active ? undefined : true,
    })
    return null
  },
})

export const updateQuizSettings = mutation({
  args: {
    ...passwordArg,
    quizId: v.id('quizzes'),
    title: v.string(),
    description: v.optional(v.string()),
    scoringEnabled: v.boolean(),
    outroMessage: v.optional(v.string()),
    maxPlayers: v.optional(v.number()),
    idleTimeoutMinutes: v.optional(v.number()),
  },
  handler: async (
    ctx,
    {
      password,
      quizId,
      title,
      description,
      scoringEnabled,
      outroMessage,
      maxPlayers,
      idleTimeoutMinutes,
    },
  ) => {
    requirePassword(password)
    const clean = title.trim()
    if (!clean) throw new ConvexError({ code: 'TITLE_REQUIRED' })
    if (
      maxPlayers !== undefined &&
      (!Number.isInteger(maxPlayers) ||
        maxPlayers < 1 ||
        maxPlayers > MAX_PLAYERS_PER_SESSION)
    ) {
      throw new ConvexError({
        code: 'INVALID_MAX_PLAYERS',
        max: MAX_PLAYERS_PER_SESSION,
      })
    }
    if (
      idleTimeoutMinutes !== undefined &&
      (!Number.isInteger(idleTimeoutMinutes) ||
        idleTimeoutMinutes < 15 ||
        idleTimeoutMinutes > MAX_IDLE_TIMEOUT_MINUTES)
    ) {
      throw new ConvexError({
        code: 'INVALID_IDLE_TIMEOUT',
        max: MAX_IDLE_TIMEOUT_MINUTES,
      })
    }
    const outro = outroMessage?.trim()
    if (outro && outro.length > MAX_OUTRO_LENGTH)
      throw new ConvexError({ code: 'OUTRO_TOO_LONG' })
    await ctx.db.patch('quizzes', quizId, {
      title: clean,
      description: description?.trim() || undefined,
      scoringEnabled,
      outroMessage: outro || undefined,
      maxPlayers,
      idleTimeoutMinutes,
    })
    return null
  },
})

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

async function renumber(ctx: MutationCtx, quizId: Id<'quizzes'>) {
  const questions = await getQuestions(ctx, quizId)
  for (const [i, q] of questions.entries()) {
    if (q.order !== i + 1)
      await ctx.db.patch('questions', q._id, { order: i + 1 })
  }
}

const questionFields = {
  topic: v.string(),
  text: v.string(),
  type: questionTypeValidator,
  options: v.array(optionValidator),
  explanation: v.optional(v.string()),
  timeLimitSec: v.number(),
}

function validateQuestion(q: {
  text: string
  type: 'single' | 'multi' | 'poll'
  options: Array<{ id: string; text: string; correct: boolean }>
  timeLimitSec: number
}) {
  if (!q.text.trim() || q.text.length > MAX_QUESTION_LENGTH)
    throw new ConvexError({ code: 'INVALID_QUESTION_TEXT' })
  if (q.options.length < 2 || q.options.length > 4)
    throw new ConvexError({ code: 'INVALID_OPTION_COUNT' })
  if (
    q.options.some((o) => !o.text.trim() || o.text.length > MAX_OPTION_LENGTH)
  )
    throw new ConvexError({ code: 'INVALID_OPTION_TEXT' })
  if (new Set(q.options.map((o) => o.id)).size !== q.options.length)
    throw new ConvexError({ code: 'DUPLICATE_OPTION_ID' })
  if (q.type === 'single' && q.options.filter((o) => o.correct).length > 1)
    throw new ConvexError({ code: 'SINGLE_HAS_MULTIPLE_CORRECT' })
  if (
    !Number.isInteger(q.timeLimitSec) ||
    q.timeLimitSec < 5 ||
    q.timeLimitSec > 300
  )
    throw new ConvexError({ code: 'INVALID_TIME_LIMIT' })
}

export const saveQuestion = mutation({
  args: {
    ...passwordArg,
    quizId: v.id('quizzes'),
    questionId: v.optional(v.id('questions')),
    ...questionFields,
  },
  handler: async (ctx, { password, quizId, questionId, ...fields }) => {
    requirePassword(password)
    validateQuestion(fields)
    const options =
      fields.type === 'poll'
        ? fields.options.map((o) => ({ ...o, correct: false }))
        : fields.options
    const doc = {
      ...fields,
      options,
      topic: fields.topic.trim(),
      text: fields.text.trim(),
      explanation: fields.explanation?.trim() || undefined,
    }
    if (questionId) {
      const existing = await ctx.db.get('questions', questionId)
      if (!existing || existing.quizId !== quizId)
        throw new ConvexError({ code: 'NO_QUESTION' })
      await ctx.db.patch('questions', questionId, doc)
      return questionId
    }
    const count = (await getQuestions(ctx, quizId)).length
    return await ctx.db.insert('questions', {
      quizId,
      order: count + 1,
      ...doc,
    })
  },
})

export const deleteQuestion = mutation({
  args: { ...passwordArg, questionId: v.id('questions') },
  handler: async (ctx, { password, questionId }) => {
    requirePassword(password)
    const q = await ctx.db.get('questions', questionId)
    if (!q) return null
    await ctx.db.delete('questions', questionId)
    await renumber(ctx, q.quizId)
    return null
  },
})

/** Moves a question to a new 1-based position (drag-and-drop and the up/down buttons). */
export const moveQuestion = mutation({
  args: { ...passwordArg, questionId: v.id('questions'), toOrder: v.number() },
  handler: async (ctx, { password, questionId, toOrder }) => {
    requirePassword(password)
    const q = await ctx.db.get('questions', questionId)
    if (!q) throw new ConvexError({ code: 'NO_QUESTION' })
    const questions = (await getQuestions(ctx, q.quizId)).filter(
      (x) => x._id !== questionId,
    )
    const target = Math.max(0, Math.min(questions.length, toOrder - 1))
    questions.splice(target, 0, q)
    for (const [i, item] of questions.entries()) {
      if (item.order !== i + 1)
        await ctx.db.patch('questions', item._id, { order: i + 1 })
    }
    return null
  },
})

// ---------------------------------------------------------------------------
// Session results + exports (CSV is built client-side from these rows)
// ---------------------------------------------------------------------------

export const sessionResults = query({
  args: { ...passwordArg, sessionId: v.id('sessions') },
  handler: async (ctx, { password, sessionId }) => {
    requirePassword(password)
    const session = await ctx.db.get('sessions', sessionId)
    if (!session || session.deletedAt !== undefined) return null
    const quiz = await ctx.db.get('quizzes', session.quizId)
    const [questions, players] = await Promise.all([
      getQuestions(ctx, session.quizId),
      getPlayers(ctx, sessionId),
    ])
    const perQuestion = await Promise.all(
      questions.map(async (q) => {
        const answers = await getAnswers(ctx, sessionId, q._id)
        const counts = distribution(q, answers)
        return {
          id: q._id,
          order: q.order,
          topic: q.topic,
          text: q.text,
          type: q.type,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            correct: q.type === 'poll' ? null : o.correct,
            count: counts.find((c) => c.optionId === o.id)?.count ?? 0,
          })),
          answeredCount: answers.length,
          noAnswerCount: Math.max(0, players.length - answers.length),
          answers: answers.map((a) => ({
            playerId: a.playerId,
            correct: a.correct ?? null,
          })),
        }
      }),
    )
    return {
      session: {
        id: session._id,
        createdAt: session.createdAt,
        finishedAt: session.finishedAt ?? null,
        phase: session.phase,
        endReason: session.endReason ?? null,
        scoringEnabled: session.scoringEnabled,
      },
      quizTitle: quiz?.title ?? '',
      players: players.map((p) => ({
        id: p._id,
        name: p.name,
        email: p.email,
        // Absent (not 0) when the session had scoring off.
        score: session.scoringEnabled ? p.score : null,
      })),
      questions: perQuestion,
    }
  },
})

// ---------------------------------------------------------------------------
// Deleting a session: hide it at once, purge its players and answers in batches
// ---------------------------------------------------------------------------

/** Hides a session at once and schedules the purge of its players and answers. */
async function markSessionDeleted(ctx: MutationCtx, session: Doc<'sessions'>) {
  await cancelSessionJobs(ctx, session)
  // Finished + deletedAt: the join code is free and every view treats it as gone.
  await ctx.db.patch('sessions', session._id, {
    phase: 'finished',
    deletedAt: Date.now(),
    finishedAt: session.finishedAt ?? Date.now(),
    scheduledRevealId: undefined,
    scheduledExpiryId: undefined,
  })
  await ctx.scheduler.runAfter(0, internal.admin.purgeSession, {
    sessionId: session._id,
  })
}

export const deleteSession = mutation({
  args: { ...passwordArg, sessionId: v.id('sessions') },
  handler: async (ctx, { password, sessionId }) => {
    requirePassword(password)
    const session = await ctx.db.get('sessions', sessionId)
    if (!session || session.deletedAt !== undefined) return null
    await markSessionDeleted(ctx, session)
    return null
  },
})

/** Deletes a deleted session's answers, then players, then the session, one batch per run. */
export const purgeSession = internalMutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('sessions', sessionId)
    if (!session || session.deletedAt === undefined) return null
    const answers = await ctx.db
      .query('answers')
      .withIndex('by_sessionId_and_questionId', (q) =>
        q.eq('sessionId', sessionId),
      )
      .take(PURGE_BATCH_SIZE)
    const players =
      answers.length > 0
        ? []
        : await ctx.db
            .query('players')
            .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
            .take(PURGE_BATCH_SIZE)
    for (const a of answers) await ctx.db.delete('answers', a._id)
    for (const p of players) await ctx.db.delete('players', p._id)
    if (answers.length > 0 || players.length > 0) {
      await ctx.scheduler.runAfter(0, internal.admin.purgeSession, {
        sessionId,
      })
    } else {
      await rateLimiter.reset(ctx, 'join', { key: sessionId })
      await ctx.db.delete('sessions', sessionId)
    }
    return null
  },
})

// ---------------------------------------------------------------------------
// Deleting a quiz: refuses while a session is in progress; otherwise deletes the
// quiz with all its sessions (players, answers) and questions.
// ---------------------------------------------------------------------------

export const deleteQuiz = mutation({
  args: { ...passwordArg, quizId: v.id('quizzes') },
  handler: async (ctx, { password, quizId }) => {
    requirePassword(password)
    const quiz = await ctx.db.get('quizzes', quizId)
    if (!quiz || quiz.deletedAt !== undefined) return null
    const sessions = (
      await ctx.db
        .query('sessions')
        .withIndex('by_quizId', (q) => q.eq('quizId', quizId))
        .take(MAX_SESSIONS_PER_QUIZ)
    ).filter((s) => s.deletedAt === undefined)
    if (sessions.some((s) => s.phase !== 'finished')) {
      throw new ConvexError({ code: 'QUIZ_HAS_ACTIVE_SESSION' })
    }
    await ctx.db.patch('quizzes', quizId, { deletedAt: Date.now() })
    for (const session of sessions) await markSessionDeleted(ctx, session)
    await ctx.scheduler.runAfter(0, internal.admin.purgeQuiz, { quizId })
    return null
  },
})

/** Deletes a deleted quiz's questions, waits for its sessions to be purged, then deletes the quiz. */
export const purgeQuiz = internalMutation({
  args: { quizId: v.id('quizzes') },
  handler: async (ctx, { quizId }) => {
    const quiz = await ctx.db.get('quizzes', quizId)
    if (!quiz || quiz.deletedAt === undefined) return null
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_quizId_and_order', (q) => q.eq('quizId', quizId))
      .take(PURGE_BATCH_SIZE)
    for (const q of questions) await ctx.db.delete('questions', q._id)
    const sessionLeft = await ctx.db
      .query('sessions')
      .withIndex('by_quizId', (q) => q.eq('quizId', quizId))
      .first()
    if (questions.length > 0 || sessionLeft) {
      // Sessions purge in their own jobs; check back shortly.
      await ctx.scheduler.runAfter(
        questions.length > 0 ? 0 : 1000,
        internal.admin.purgeQuiz,
        { quizId },
      )
    } else {
      await ctx.db.delete('quizzes', quizId)
    }
    return null
  },
})
