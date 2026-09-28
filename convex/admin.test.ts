import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vite-plus/test'
import { api } from './_generated/api'
import {
  PASSWORD,
  createQuiz,
  expectCode,
  openSession,
  setup,
} from './test.setup'
import type { Backend } from './test.setup'

const password = PASSWORD

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

/** Runs the scheduled purge jobs to completion. */
const purge = (t: Backend) =>
  t.finishAllScheduledFunctions(() => vi.advanceTimersByTime(1000))

const counts = (t: Backend) =>
  t.run(async (ctx) => ({
    quizzes: (await ctx.db.query('quizzes').collect()).length,
    questions: (await ctx.db.query('questions').collect()).length,
    sessions: (await ctx.db.query('sessions').collect()).length,
    players: (await ctx.db.query('players').collect()).length,
    answers: (await ctx.db.query('answers').collect()).length,
  }))

/** Plays one answer so the session has players and answers to purge. */
async function playedSession(t: Backend) {
  const quizId = await createQuiz(t)
  const { host, players } = await openSession(t, quizId, ['Sanne', 'Daan'])
  await t.mutation(api.game.start, host)
  const hv = await t.query(api.sessions.getHostView, host)
  await t.mutation(api.answers.submitAnswer, {
    sessionId: host.sessionId,
    playerId: players[0],
    questionId: hv.question!.id,
    optionIds: ['c'],
  })
  return { quizId, host }
}

describe('quiz settings', () => {
  test('validate the idle timeout and max players', async () => {
    const t = setup()
    const quizId = await createQuiz(t)
    const base = { password, quizId, title: 'Q', scoringEnabled: false }
    for (const idleTimeoutMinutes of [10, 241, 30.5]) {
      await expectCode(
        t.mutation(api.admin.updateQuizSettings, {
          ...base,
          idleTimeoutMinutes,
        }),
        'INVALID_IDLE_TIMEOUT',
      )
    }
    await expectCode(
      t.mutation(api.admin.updateQuizSettings, { ...base, maxPlayers: 0 }),
      'INVALID_MAX_PLAYERS',
    )
  })

  test('a session keeps the settings it started with', async () => {
    const t = setup()
    const quizId = await createQuiz(t, { maxPlayers: 1 })
    const { joinCode } = await openSession(t, quizId, ['Sanne'])
    await t.mutation(api.admin.updateQuizSettings, {
      password,
      quizId,
      title: 'Testquiz',
      scoringEnabled: false,
    })
    await expectCode(
      t.mutation(api.sessions.join, {
        code: joinCode,
        name: 'Daan',
        email: 'daan@example.com',
      }),
      'SESSION_FULL',
    )
  })

  test('a session cannot start while a question lacks a correct answer', async () => {
    const t = setup()
    const quizId = await t.mutation(api.admin.createQuiz, {
      password,
      title: 'Leeg',
    })
    await expectCode(
      t.mutation(api.sessions.createSession, { password, quizId }),
      'NO_QUESTIONS',
    )
    await t.run((ctx) =>
      ctx.db.insert('questions', {
        quizId,
        order: 0,
        topic: 'T',
        text: 'Zonder antwoord?',
        type: 'single',
        options: [
          { id: 'a', text: 'A', correct: false },
          { id: 'b', text: 'B', correct: false },
        ],
        timeLimitSec: 20,
      }),
    )
    await expectCode(
      t.mutation(api.sessions.createSession, { password, quizId }),
      'MISSING_CORRECT',
    )
  })
})

describe('inactive quizzes', () => {
  test('are hidden from the picker and cannot start a session', async () => {
    const t = setup()
    const quizId = await createQuiz(t)
    await t.mutation(api.admin.setQuizActive, {
      password,
      quizId,
      active: false,
    })
    const [quiz] = await t.query(api.admin.listQuizzes, { password })
    expect(quiz.active).toBe(false)
    await expectCode(
      t.mutation(api.sessions.createSession, { password, quizId }),
      'QUIZ_INACTIVE',
    )

    await t.mutation(api.admin.setQuizActive, {
      password,
      quizId,
      active: true,
    })
    await openSession(t, quizId)
  })

  test('let a running session continue', async () => {
    const t = setup()
    const quizId = await createQuiz(t)
    const { host } = await openSession(t, quizId, ['Sanne'])
    await t.mutation(api.admin.setQuizActive, {
      password,
      quizId,
      active: false,
    })
    await t.mutation(api.game.start, host)
    const hv = await t.query(api.sessions.getHostView, host)
    expect(hv.session.phase).toBe('question')
  })
})

describe('deleting', () => {
  test('a session hides it at once and purges its players and answers', async () => {
    const t = setup()
    const { host } = await playedSession(t)
    expect(await counts(t)).toMatchObject({ players: 2, answers: 1 })

    await t.mutation(api.admin.deleteSession, {
      password,
      sessionId: host.sessionId,
    })
    await expectCode(t.query(api.sessions.getHostView, host), 'NOT_HOST')
    const [quiz] = await t.query(api.admin.listQuizzes, { password })
    expect(quiz.sessions).toHaveLength(0)

    await purge(t)
    expect(await counts(t)).toMatchObject({
      sessions: 0,
      players: 0,
      answers: 0,
      questions: 3,
    })
  })

  test('a quiz is refused while one of its sessions is in progress', async () => {
    const t = setup()
    const { quizId, host } = await playedSession(t)
    await expectCode(
      t.mutation(api.admin.deleteQuiz, { password, quizId }),
      'QUIZ_HAS_ACTIVE_SESSION',
    )
    await t.mutation(api.game.end, host)
    await t.mutation(api.admin.deleteQuiz, { password, quizId })
    expect(await t.query(api.admin.listQuizzes, { password })).toHaveLength(0)

    await purge(t)
    expect(await counts(t)).toEqual({
      quizzes: 0,
      questions: 0,
      sessions: 0,
      players: 0,
      answers: 0,
    })
  })
})
