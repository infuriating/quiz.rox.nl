import { v } from 'convex/values'

export const questionTypeValidator = v.union(
  v.literal('single'),
  v.literal('multi'),
  v.literal('poll'),
)

export const phaseValidator = v.union(
  v.literal('lobby'),
  v.literal('question'),
  v.literal('reveal'),
  v.literal('leaderboard'),
  v.literal('finished'),
)

export const optionValidator = v.object({
  id: v.string(),
  text: v.string(),
  correct: v.boolean(),
})
