/// <reference types="vite/client" />
// Shared setup for the convex-test suites. Convex does not deploy files with
// more than one dot in their name, so this and the *.test.ts files stay local.
import rateLimiter from '@convex-dev/rate-limiter/test'
import { convexTest } from 'convex-test'
import { vi } from 'vite-plus/test'
import { api } from './_generated/api'
import schema from './schema'
import type { Id } from './_generated/dataModel'

/** Every function module, as convex-test loads them (same filter as Convex). */
export const modules = import.meta.glob(['./**/*.*s', '!./**/*.*.*s'])

export const PASSWORD = 'test-host-password-0123456789ab'

/** A fresh in-memory backend with HOST_PASSWORD set. */
export function setup() {
  vi.stubEnv('HOST_PASSWORD', PASSWORD)
  const t = convexTest(schema, modules)
  rateLimiter.register(t)
  return t
}

export type Backend = ReturnType<typeof setup>

/** Rejects with a ConvexError carrying `code`. */
export async function expectCode(promise: Promise<unknown>, code: string) {
  try {
    await promise
  } catch (e) {
    const data = (e as { data?: { code?: string } }).data
    if (data?.code === code) return
    throw new Error(`expected ${code}, got ${data?.code ?? String(e)}`)
  }
  throw new Error(`expected ${code}, but it resolved`)
}

const options = (n: number, correct: Array<number>) =>
  ['A', 'B', 'C', 'D'].slice(0, n).map((text, i) => ({
    id: 'abcd'[i],
    text,
    correct: correct.includes(i),
  }))

/**
 * A quiz with three questions: single (correct C, with explanation), multi
 * (correct A+B, 5 s) and a poll.
 */
export async function createQuiz(
  t: Backend,
  settings: {
    scoringEnabled?: boolean
    maxPlayers?: number
    idleTimeoutMinutes?: number
  } = {},
): Promise<Id<'quizzes'>> {
  const password = PASSWORD
  const quizId = await t.mutation(api.admin.createQuiz, {
    password,
    title: 'Testquiz',
  })
  await t.mutation(api.admin.updateQuizSettings, {
    password,
    quizId,
    title: 'Testquiz',
    scoringEnabled: settings.scoringEnabled ?? false,
    maxPlayers: settings.maxPlayers,
    idleTimeoutMinutes: settings.idleTimeoutMinutes,
  })
  await t.mutation(api.admin.saveQuestion, {
    password,
    quizId,
    topic: 'T1',
    text: 'Enkel?',
    type: 'single',
    options: options(4, [2]),
    explanation: 'Uitleg',
    timeLimitSec: 20,
  })
  await t.mutation(api.admin.saveQuestion, {
    password,
    quizId,
    topic: 'T2',
    text: 'Meer?',
    type: 'multi',
    options: options(4, [0, 1]),
    timeLimitSec: 5,
  })
  await t.mutation(api.admin.saveQuestion, {
    password,
    quizId,
    topic: 'T3',
    text: 'Peiling?',
    type: 'poll',
    options: options(3, []),
    timeLimitSec: 20,
  })
  return quizId
}

/** Opens a lobby for `quizId` and joins `names` as players. */
export async function openSession(
  t: Backend,
  quizId: Id<'quizzes'>,
  names: Array<string> = [],
) {
  const { sessionId, hostToken, joinCode } = await t.mutation(
    api.sessions.createSession,
    { password: PASSWORD, quizId },
  )
  const players: Array<Id<'players'>> = []
  for (const name of names) {
    const { playerId } = await t.mutation(api.sessions.join, {
      code: joinCode,
      name,
      email: `${name.toLowerCase()}@example.com`,
    })
    players.push(playerId)
  }
  return { host: { sessionId, hostToken }, joinCode, players }
}

/** Narrows a nullable query result; fails the test when it is null. */
export function present<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('unexpected null')
  return value
}

export async function playerView(
  t: Backend,
  sessionId: Id<'sessions'>,
  playerId: Id<'players'>,
) {
  return present(
    await t.query(api.sessions.getPlayerView, { sessionId, playerId }),
  )
}
