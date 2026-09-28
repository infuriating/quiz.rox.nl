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
  createQuiz,
  expectCode,
  openSession,
  playerView,
  present,
  setup,
} from './test.setup'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe.each([false, true])('a full game, scoring %s', (scoring) => {
  test('runs question → reveal → next, sanitized until the reveal', async () => {
    const t = setup()
    const quizId = await createQuiz(t, { scoringEnabled: scoring })
    const {
      host,
      players: [sanne, daan],
    } = await openSession(t, quizId, ['Sanne', 'Daan', 'Noor'])

    await expectCode(t.mutation(api.game.next, host), 'WRONG_PHASE')
    await t.mutation(api.game.start, host)

    // Question 1 (single, correct C): nothing reveals the answer yet.
    let hv = await t.query(api.sessions.getHostView, host)
    const q1 = hv.question!.id
    expect(hv.session.phase).toBe('question')
    expect(hv.reveal).toBeNull()
    expect(JSON.stringify(hv)).not.toContain('"correct"')
    expect(JSON.stringify(hv)).not.toContain('Uitleg')
    let pv = await playerView(t, host.sessionId, sanne)
    expect(pv.reveal).toBeNull()
    expect(JSON.stringify(pv)).not.toContain('"correct":true')
    await expectCode(
      t.mutation(api.game.showLeaderboard, host),
      scoring ? 'WRONG_PHASE' : 'SCORING_DISABLED',
    )

    const answer = (playerId: typeof sanne, optionIds: Array<string>) =>
      t.mutation(api.answers.submitAnswer, {
        sessionId: host.sessionId,
        playerId,
        questionId: q1,
        optionIds,
      })
    await answer(sanne, ['c'])
    await expectCode(answer(sanne, ['a']), 'ALREADY_ANSWERED')
    await expectCode(answer(daan, ['a', 'b']), 'INVALID_OPTIONS')
    hv = await t.query(api.sessions.getHostView, host)
    expect(hv.answeredCount).toBe(1)
    expect(hv.reveal).toBeNull()
    await answer(daan, ['a'])

    // Reveal: correct option, explanation and distribution.
    await t.mutation(api.game.skipTimer, host)
    hv = await t.query(api.sessions.getHostView, host)
    expect(hv.session.phase).toBe('reveal')
    expect(hv.reveal!.correctOptionIds).toEqual(['c'])
    expect(hv.reveal!.explanation).toBe('Uitleg')
    expect(hv.reveal!.distribution.map((d) => d.count)).toEqual([1, 0, 1, 0])
    expect(hv.reveal!.noAnswerCount).toBe(1)
    pv = await playerView(t, host.sessionId, sanne)
    expect(pv.reveal!.correct).toBe(true)
    expect(pv.reveal!.pickedSameCount).toBe(1)
    if (scoring) {
      expect(pv.reveal!.score!.points).toBeGreaterThan(900)
      expect(pv.reveal!.score!.rank).toBe(1)
    } else {
      expect(pv.reveal!.score).toBeNull()
    }

    // With scoring on, the leaderboard sits between reveal and next question.
    await t.mutation(api.game.next, host)
    hv = await t.query(api.sessions.getHostView, host)
    if (scoring) {
      expect(hv.session.phase).toBe('leaderboard')
      expect(hv.leaderboard![0].name).toBe('Sanne')
      await t.mutation(api.game.next, host)
      hv = await t.query(api.sessions.getHostView, host)
    } else {
      expect(hv.leaderboard).toBeNull()
    }
    expect(hv.session.phase).toBe('question')
    expect(hv.question!.index).toBe(1)

    // Question 2 (multi, 5 s): the order of the picked set does not matter,
    // and the scheduled auto-reveal closes the question.
    const q2 = hv.question!.id
    await t.mutation(api.answers.submitAnswer, {
      sessionId: host.sessionId,
      playerId: sanne,
      questionId: q2,
      optionIds: ['b', 'a'],
    })
    vi.advanceTimersByTime(6000)
    await t.finishInProgressScheduledFunctions()
    await expectCode(
      t.mutation(api.answers.submitAnswer, {
        sessionId: host.sessionId,
        playerId: daan,
        questionId: q2,
        optionIds: ['a'],
      }),
      'WRONG_PHASE',
    )
    hv = await t.query(api.sessions.getHostView, host)
    expect(hv.session.phase).toBe('reveal')
    expect(hv.reveal!.correctOptionIds).toEqual(['a', 'b'])
    pv = await playerView(t, host.sessionId, daan)
    expect(pv.myAnswer).toBeNull()
    expect(pv.reveal!.correct).toBeNull()

    // "Vorige" goes back to the previous reveal.
    await t.mutation(api.game.previous, host)
    hv = await t.query(api.sessions.getHostView, host)
    expect(hv.session.phase).toBe('reveal')
    expect(hv.question!.index).toBe(0)

    const advance = async () => {
      await t.mutation(api.game.next, host)
      if (scoring) await t.mutation(api.game.next, host)
    }
    await advance()
    await t.mutation(api.game.skipTimer, host)
    await advance()

    // Question 3 (poll): no correct answer.
    hv = await t.query(api.sessions.getHostView, host)
    expect(hv.question!.type).toBe('poll')
    await t.mutation(api.answers.submitAnswer, {
      sessionId: host.sessionId,
      playerId: sanne,
      questionId: hv.question!.id,
      optionIds: ['b'],
    })
    await t.mutation(api.game.skipTimer, host)
    hv = await t.query(api.sessions.getHostView, host)
    expect(hv.reveal!.correctOptionIds).toEqual([])
    expect(hv.reveal!.correctCount).toBeNull()

    await advance()
    hv = await t.query(api.sessions.getHostView, host)
    expect(hv.session.phase).toBe('finished')
    expect(hv.session.endReason).toBe('completed')
    if (scoring) expect(hv.podium).toHaveLength(3)
    else expect(hv.podium).toBeNull()
    expect(hv.stats!.percentCorrect).not.toBeNull()

    pv = await playerView(t, host.sessionId, sanne)
    expect(pv.final!.questionsAnswered).toBe(3)
    if (scoring) expect(pv.final!.score!.total).toBeGreaterThan(0)
    else expect(pv.final!.score).toBeNull()

    const results = present(
      await t.query(api.admin.sessionResults, {
        password: 'test-host-password-0123456789ab',
        sessionId: host.sessionId,
      }),
    )
    expect(results.questions).toHaveLength(3)
    if (scoring) expect(results.players[0].score).not.toBeNull()
    else expect(results.players[0].score).toBeNull()
  })
})

test('an answer after the time limit is rejected', async () => {
  const t = setup()
  const quizId = await createQuiz(t)
  const {
    host,
    players: [sanne],
  } = await openSession(t, quizId, ['Sanne'])
  await t.mutation(api.game.start, host)
  const hv = await t.query(api.sessions.getHostView, host)
  // Past the 20 s limit, before the scheduled reveal has run.
  vi.advanceTimersByTime(21_000)
  await expectCode(
    t.mutation(api.answers.submitAnswer, {
      sessionId: host.sessionId,
      playerId: sanne,
      questionId: hv.question!.id,
      optionIds: ['c'],
    }),
    'TOO_LATE',
  )
})

test('the player view hides the player count during a question', async () => {
  const t = setup()
  const quizId = await createQuiz(t)
  const {
    host,
    players: [sanne],
  } = await openSession(t, quizId, ['Sanne', 'Daan'])
  expect((await playerView(t, host.sessionId, sanne)).session.playerCount).toBe(
    2,
  )
  await t.mutation(api.game.start, host)
  // Skipping other players' rows keeps one answer from re-running every phone.
  expect(
    (await playerView(t, host.sessionId, sanne)).session.playerCount,
  ).toBeNull()
})

test('ending a session finishes it with endReason "ended"', async () => {
  const t = setup()
  const quizId = await createQuiz(t)
  const { host } = await openSession(t, quizId, ['Sanne'])
  await t.mutation(api.game.start, host)
  await t.mutation(api.game.end, host)
  const hv = await t.query(api.sessions.getHostView, host)
  expect(hv.session.phase).toBe('finished')
  expect(hv.session.endReason).toBe('ended')
})
