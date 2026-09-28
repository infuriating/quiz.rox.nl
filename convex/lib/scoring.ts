import type { Doc } from '../_generated/dataModel'

const BASE_POINTS = 500
const MAX_SPEED_BONUS = 500

/** Evaluates a submitted option set. Returns undefined for polls (no correct answer). */
export function evaluate(
  question: Doc<'questions'>,
  optionIds: string[],
): boolean | undefined {
  if (question.type === 'poll') return undefined
  const correct = new Set(
    question.options.filter((o) => o.correct).map((o) => o.id),
  )
  const picked = new Set(optionIds)
  if (correct.size !== picked.size) return false
  for (const id of picked) if (!correct.has(id)) return false
  return true
}

/** Correct = 500 + up to 500 speed bonus, linear over the time limit. */
export function pointsFor(
  correct: boolean,
  elapsedMs: number,
  timeLimitSec: number,
): number {
  if (!correct) return 0
  const limitMs = timeLimitSec * 1000
  const remaining = Math.min(1, Math.max(0, 1 - elapsedMs / limitMs))
  return BASE_POINTS + Math.round(MAX_SPEED_BONUS * remaining)
}

export type RankedPlayer = {
  playerId: Doc<'players'>['_id']
  name: string
  score: number
  rank: number
}

/** Standard competition ranking (1, 2, 2, 4). Ties keep join order for display. */
export function rankBy(
  players: Doc<'players'>[],
  scoreOf: (p: Doc<'players'>) => number,
): RankedPlayer[] {
  const sorted = [...players].sort(
    (a, b) => scoreOf(b) - scoreOf(a) || a.joinedAt - b.joinedAt,
  )
  const ranked: RankedPlayer[] = []
  sorted.forEach((p, i) => {
    const score = scoreOf(p)
    const prev = ranked[i - 1]
    const rank = prev && prev.score === score ? prev.rank : i + 1
    ranked.push({ playerId: p._id, name: p.name, score, rank })
  })
  return ranked
}
