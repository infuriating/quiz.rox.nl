import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { requireHost, requirePin } from './lib/auth'
import { normalizeJoinCode, randomJoinCode, randomToken } from './lib/codes'
import {
  correctOptionIds,
  distribution,
  getAnswers,
  getPlayerAnswer,
  getPlayers,
  getQuestions,
  questionsMissingCorrect,
  sameSet,
  sanitizeQuestion,
} from './lib/data'
import {
  LEADERBOARD_SIZE,
  MAX_PLAYERS_PER_SESSION,
  PODIUM_SIZE,
} from './lib/limits'
import { rankBy } from './lib/scoring'

// ---------------------------------------------------------------------------
// Host: PIN + session creation
// ---------------------------------------------------------------------------

/** Checks the host PIN. Used by /host and /admin before storing the PIN client-side. */
export const verifyPin = mutation({
  args: { pin: v.string() },
  handler: (_ctx, { pin }) => {
    requirePin(pin)
    return true
  },
})

/** Creates a session in the lobby phase and returns the host token that guards host mutations. */
export const createSession = mutation({
  args: { pin: v.string(), quizId: v.id('quizzes') },
  handler: async (ctx, { pin, quizId }) => {
    requirePin(pin)
    const quiz = await ctx.db.get('quizzes', quizId)
    if (!quiz) throw new ConvexError({ code: 'NO_QUIZ' })
    const questions = await getQuestions(ctx, quizId)
    if (questions.length === 0) throw new ConvexError({ code: 'NO_QUESTIONS' })
    const missing = questionsMissingCorrect(questions)
    if (missing.length > 0)
      throw new ConvexError({ code: 'MISSING_CORRECT', questions: missing })

    let joinCode = randomJoinCode()
    for (let attempt = 0; attempt < 10; attempt++) {
      if (!(await activeSessionByCode(ctx, joinCode))) break
      joinCode = randomJoinCode()
    }
    const hostToken = randomToken()
    const sessionId = await ctx.db.insert('sessions', {
      quizId,
      joinCode,
      hostToken,
      scoringEnabled: quiz.scoringEnabled,
      maxPlayers: quiz.maxPlayers,
      phase: 'lobby',
      currentQuestionIndex: 0,
      createdAt: Date.now(),
    })
    return { sessionId, hostToken, joinCode }
  },
})

// ---------------------------------------------------------------------------
// Player: join + rejoin
// ---------------------------------------------------------------------------

async function sessionByCode(
  ctx: QueryCtx,
  code: string,
): Promise<Doc<'sessions'> | null> {
  return await activeSessionByCode(ctx, normalizeJoinCode(code))
}

/**
 * Join codes are reused over time; only one non-finished session holds a code.
 * Reads the newest few sessions with the code and picks the active one.
 */
async function activeSessionByCode(
  ctx: QueryCtx,
  joinCode: string,
): Promise<Doc<'sessions'> | null> {
  const recent = await ctx.db
    .query('sessions')
    .withIndex('by_joinCode', (q) => q.eq('joinCode', joinCode))
    .order('desc')
    .take(20)
  return recent.find((sess) => sess.phase !== 'finished') ?? null
}

/** Used by the Join screen to validate a code before submitting. */
export const lookupJoinCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const session = await sessionByCode(ctx, code)
    if (!session) return null
    const players = await getPlayers(ctx, session._id)
    return {
      sessionId: session._id,
      joinCode: session.joinCode,
      full:
        session.maxPlayers !== undefined &&
        players.length >= session.maxPlayers,
    }
  },
})

/** Joins a session. A duplicate email in the same session returns the existing player. */
export const join = mutation({
  args: { code: v.string(), name: v.string(), email: v.string() },
  handler: async (ctx, { code, name, email }) => {
    const session = await sessionByCode(ctx, code)
    if (!session) throw new ConvexError({ code: 'INVALID_CODE' })
    const cleanName = name.trim().slice(0, 40)
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanName) throw new ConvexError({ code: 'NAME_REQUIRED' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      throw new ConvexError({ code: 'INVALID_EMAIL' })

    const existing = await ctx.db
      .query('players')
      .withIndex('by_sessionId_and_email', (q) =>
        q.eq('sessionId', session._id).eq('email', cleanEmail),
      )
      .unique()
    if (existing) return { sessionId: session._id, playerId: existing._id }

    const players = await getPlayers(ctx, session._id)
    const cap = Math.min(
      session.maxPlayers ?? MAX_PLAYERS_PER_SESSION,
      MAX_PLAYERS_PER_SESSION,
    )
    if (players.length >= cap) throw new ConvexError({ code: 'SESSION_FULL' })

    const playerId = await ctx.db.insert('players', {
      sessionId: session._id,
      name: cleanName,
      email: cleanEmail,
      score: 0,
      joinedAt: Date.now(),
    })
    return { sessionId: session._id, playerId }
  },
})

/** Returns server time so clients can correct the cosmetic countdown for clock skew. */
export const getServerTime = mutation({
  args: {},
  handler: () => Date.now(),
})

// ---------------------------------------------------------------------------
// Views. Everything secret (correct flags, explanation, distribution) is only
// added from phase "reveal" onward. Score and rank are absent when scoring is off.
// ---------------------------------------------------------------------------

async function loadContext(ctx: QueryCtx, session: Doc<'sessions'>) {
  const [quiz, questions, players] = await Promise.all([
    ctx.db.get('quizzes', session.quizId),
    getQuestions(ctx, session.quizId),
    getPlayers(ctx, session._id),
  ])
  if (!quiz) throw new ConvexError({ code: 'NO_QUIZ' })
  const question =
    session.phase === 'lobby' || session.phase === 'finished'
      ? undefined
      : questions[session.currentQuestionIndex]
  const answers = question
    ? await getAnswers(ctx, session._id, question._id)
    : []
  return { quiz, questions, players, question, answers }
}

function baseSession(
  session: Doc<'sessions'>,
  quiz: Doc<'quizzes'>,
  total: number,
  playerCount: number,
) {
  return {
    id: session._id,
    phase: session.phase,
    joinCode: session.joinCode,
    scoringEnabled: session.scoringEnabled,
    maxPlayers: session.maxPlayers ?? null,
    quizTitle: quiz.title,
    createdAt: session.createdAt,
    outroMessage: quiz.outroMessage ?? null,
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions: total,
    questionEndsAt:
      session.phase === 'question' ? (session.questionEndsAt ?? null) : null,
    playerCount,
  }
}

/** Rank after the current question and after the one before it (score minus this question's points). */
function ranksWithMovement(
  players: Array<Doc<'players'>>,
  answers: Array<Doc<'answers'>>,
) {
  const pointsNow = new Map<Id<'players'>, number>(
    answers.map((a) => [a.playerId, a.points]),
  )
  const current = rankBy(players, (p) => p.score)
  const before = new Map(
    rankBy(players, (p) => p.score - (pointsNow.get(p._id) ?? 0)).map((r) => [
      r.playerId,
      r.rank,
    ]),
  )
  return current.map((r) => ({
    ...r,
    previousRank: before.get(r.playerId) ?? r.rank,
  }))
}

async function finishedStats(
  ctx: QueryCtx,
  session: Doc<'sessions'>,
  questions: Array<Doc<'questions'>>,
) {
  let graded = 0
  let correct = 0
  for (const q of questions) {
    if (q.type === 'poll') continue
    for (const a of await getAnswers(ctx, session._id, q._id)) {
      graded++
      if (a.correct) correct++
    }
  }
  return {
    percentCorrect: graded === 0 ? null : Math.round((correct / graded) * 100),
  }
}

export const getHostView = query({
  args: { sessionId: v.id('sessions'), hostToken: v.string() },
  handler: async (ctx, { sessionId, hostToken }) => {
    const session = await requireHost(ctx, sessionId, hostToken)
    const { quiz, questions, players, question, answers } = await loadContext(
      ctx,
      session,
    )
    const view = {
      session: baseSession(session, quiz, questions.length, players.length),
      players: players.map((p) => ({
        id: p._id,
        name: p.name,
        joinedAt: p.joinedAt,
      })),
      question: question
        ? sanitizeQuestion(
            question,
            session.currentQuestionIndex,
            questions.length,
          )
        : null,
      answeredCount: answers.length,
      reveal: null as null | {
        correctOptionIds: Array<string>
        explanation: string | null
        distribution: Array<{ optionId: string; count: number }>
        correctCount: number | null
        noAnswerCount: number
      },
      leaderboard: null as null | ReturnType<typeof ranksWithMovement>,
      podium: null as null | ReturnType<typeof rankBy>,
      stats: null as null | { percentCorrect: number | null },
    }
    if (
      question &&
      (session.phase === 'reveal' || session.phase === 'leaderboard')
    ) {
      view.reveal = {
        correctOptionIds: correctOptionIds(question),
        explanation: question.explanation?.trim() || null,
        distribution: distribution(question, answers),
        correctCount:
          question.type === 'poll'
            ? null
            : answers.filter((a) => a.correct).length,
        noAnswerCount: Math.max(0, players.length - answers.length),
      }
    }
    if (session.scoringEnabled && session.phase === 'leaderboard') {
      view.leaderboard = ranksWithMovement(players, answers).slice(
        0,
        LEADERBOARD_SIZE,
      )
    }
    if (session.phase === 'finished') {
      view.stats = await finishedStats(ctx, session, questions)
      if (session.scoringEnabled)
        view.podium = rankBy(players, (p) => p.score).slice(0, PODIUM_SIZE)
    }
    return view
  },
})

export const getPlayerView = query({
  args: { sessionId: v.id('sessions'), playerId: v.id('players') },
  handler: async (ctx, { sessionId, playerId }) => {
    const session = await ctx.db.get('sessions', sessionId)
    const player = await ctx.db.get('players', playerId)
    // Unknown player: the client sends them back to the Join screen.
    if (!session || !player || player.sessionId !== sessionId) return null
    const { quiz, questions, players, question, answers } = await loadContext(
      ctx,
      session,
    )
    const mine = question
      ? await getPlayerAnswer(ctx, playerId, question._id)
      : null

    const view = {
      session: baseSession(session, quiz, questions.length, players.length),
      player: { id: player._id, name: player.name },
      question: question
        ? sanitizeQuestion(
            question,
            session.currentQuestionIndex,
            questions.length,
          )
        : null,
      myAnswer: mine ? { optionIds: mine.optionIds } : null,
      answeredCount: answers.length,
      reveal: null as null | {
        correctOptionIds: Array<string>
        correct: boolean | null
        pickedSameCount: number
        correctCount: number | null
        score: null | { points: number; rank: number; previousRank: number }
      },
      final: null as null | {
        questionsAnswered: number
        score: null | { total: number; rank: number; correctCount: number }
      },
    }

    if (
      question &&
      (session.phase === 'reveal' || session.phase === 'leaderboard')
    ) {
      const ranks = session.scoringEnabled
        ? ranksWithMovement(players, answers)
        : []
      const me = ranks.find((r) => r.playerId === playerId)
      view.reveal = {
        correctOptionIds: correctOptionIds(question),
        correct: mine ? (mine.correct ?? null) : null,
        pickedSameCount: mine
          ? answers.filter((a) => sameSet(a.optionIds, mine.optionIds)).length
          : 0,
        correctCount:
          question.type === 'poll'
            ? null
            : answers.filter((a) => a.correct).length,
        score: me
          ? {
              points: mine?.points ?? 0,
              rank: me.rank,
              previousRank: me.previousRank,
            }
          : null,
      }
    }

    if (session.phase === 'finished') {
      let answered = 0
      let correct = 0
      for (const q of questions) {
        const a = await getPlayerAnswer(ctx, playerId, q._id)
        if (a) {
          answered++
          if (a.correct) correct++
        }
      }
      const me = session.scoringEnabled
        ? rankBy(players, (p) => p.score).find((r) => r.playerId === playerId)
        : undefined
      view.final = {
        questionsAnswered: answered,
        score: me
          ? { total: me.score, rank: me.rank, correctCount: correct }
          : null,
      }
    }
    return view
  },
})
