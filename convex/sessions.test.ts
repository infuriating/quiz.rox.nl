import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vite-plus/test'
import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import {
  PASSWORD,
  createQuiz,
  expectCode,
  openSession,
  setup,
} from './test.setup'
import type { Backend } from './test.setup'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('host password', () => {
  test('accepts the configured password and rejects others', async () => {
    const t = setup()
    await t.mutation(api.sessions.verifyPassword, { password: PASSWORD })
    await expectCode(
      t.mutation(api.sessions.verifyPassword, { password: 'wrong' }),
      'INVALID_PASSWORD',
    )
    // Same length, one character off: the comparison itself must reject it.
    await expectCode(
      t.mutation(api.sessions.verifyPassword, {
        password: PASSWORD.slice(0, -1) + 'X',
      }),
      'INVALID_PASSWORD',
    )
  })

  test('refuses every login when no password is configured', async () => {
    const t = setup()
    vi.stubEnv('HOST_PASSWORD', '')
    await expectCode(
      t.mutation(api.sessions.verifyPassword, { password: '' }),
      'PASSWORD_NOT_CONFIGURED',
    )
  })

  test('refuses every login when the configured password is too short', async () => {
    const t = setup()
    vi.stubEnv('HOST_PASSWORD', 'short')
    await expectCode(
      t.mutation(api.sessions.verifyPassword, { password: 'short' }),
      'PASSWORD_TOO_SHORT',
    )
  })

  test('guards the admin functions', async () => {
    const t = setup()
    await expectCode(
      t.query(api.admin.listQuizzes, { password: 'wrong' }),
      'INVALID_PASSWORD',
    )
  })
})

describe('joining', () => {
  test('uses an unambiguous code, case-insensitive', async () => {
    const t = setup()
    const quizId = await createQuiz(t)
    const { joinCode } = await openSession(t, quizId)
    expect(joinCode).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    const { playerId } = await t.mutation(api.sessions.join, {
      code: joinCode.toLowerCase(),
      name: 'Sanne',
      email: 'sanne@example.com',
    })
    expect(playerId).toBeDefined()
  })

  test('returns the same player for the same email', async () => {
    const t = setup()
    const quizId = await createQuiz(t)
    const {
      joinCode,
      players: [first],
    } = await openSession(t, quizId, ['Sanne'])
    const { playerId } = await t.mutation(api.sessions.join, {
      code: joinCode,
      name: 'Sanne',
      email: 'SANNE@example.com',
    })
    expect(playerId).toBe(first)
  })

  test('validates the name, email and code', async () => {
    const t = setup()
    const quizId = await createQuiz(t)
    const { joinCode } = await openSession(t, quizId)
    await expectCode(
      t.mutation(api.sessions.join, {
        code: joinCode,
        name: '  ',
        email: 'a@example.com',
      }),
      'NAME_REQUIRED',
    )
    await expectCode(
      t.mutation(api.sessions.join, {
        code: joinCode,
        name: 'A',
        email: 'geen-email',
      }),
      'INVALID_EMAIL',
    )
    await expectCode(
      t.mutation(api.sessions.join, {
        code: 'ZZZZZZ',
        name: 'A',
        email: 'a@example.com',
      }),
      'INVALID_CODE',
    )
  })

  test('enforces the maximum number of players', async () => {
    const t = setup()
    const quizId = await createQuiz(t, { maxPlayers: 2 })
    const { joinCode } = await openSession(t, quizId, ['Sanne', 'Daan'])
    await expectCode(
      t.mutation(api.sessions.join, {
        code: joinCode,
        name: 'Noor',
        email: 'noor@example.com',
      }),
      'SESSION_FULL',
    )
  })

  test('the host view needs the host token', async () => {
    const t = setup()
    const quizId = await createQuiz(t)
    const { host } = await openSession(t, quizId)
    await expectCode(
      t.query(api.sessions.getHostView, { ...host, hostToken: 'x' }),
      'NOT_HOST',
    )
  })
})

describe('session expiry', () => {
  const MINUTE = 60 * 1000

  const sessionDoc = (t: Backend, id: Id<'sessions'>) =>
    t.run((ctx) => ctx.db.get('sessions', id))

  test('expires after an hour without host activity', async () => {
    const t = setup()
    const quizId = await createQuiz(t)
    const { host, joinCode } = await openSession(t, quizId)
    vi.advanceTimersByTime(59 * MINUTE)
    await t.finishInProgressScheduledFunctions()
    expect((await sessionDoc(t, host.sessionId))!.phase).toBe('lobby')

    vi.advanceTimersByTime(2 * MINUTE)
    await t.finishInProgressScheduledFunctions()
    const session = await sessionDoc(t, host.sessionId)
    expect(session!.phase).toBe('finished')
    expect(session!.endReason).toBe('expired')
    // The code is free again: nobody can join an expired session.
    await expectCode(
      t.mutation(api.sessions.join, {
        code: joinCode,
        name: 'Laat',
        email: 'laat@example.com',
      }),
      'INVALID_CODE',
    )
  })

  test('every host action restarts the clock', async () => {
    const t = setup()
    const quizId = await createQuiz(t)
    const { host } = await openSession(t, quizId)
    vi.advanceTimersByTime(50 * MINUTE)
    await t.mutation(api.game.start, host)
    vi.advanceTimersByTime(50 * MINUTE)
    await t.finishInProgressScheduledFunctions()
    expect((await sessionDoc(t, host.sessionId))!.phase).not.toBe('finished')
  })

  test('uses the per-quiz timeout', async () => {
    const t = setup()
    const quizId = await createQuiz(t, { idleTimeoutMinutes: 240 })
    const { host } = await openSession(t, quizId)
    vi.advanceTimersByTime(3 * 60 * MINUTE)
    await t.finishInProgressScheduledFunctions()
    expect((await sessionDoc(t, host.sessionId))!.phase).toBe('lobby')
    vi.advanceTimersByTime(61 * MINUTE)
    await t.finishInProgressScheduledFunctions()
    expect((await sessionDoc(t, host.sessionId))!.endReason).toBe('expired')
  })
})
