import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import {
  optionValidator,
  phaseValidator,
  questionTypeValidator,
} from './lib/validators'

export default defineSchema({
  quizzes: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    // Off by default: no points, ranks, leaderboard or podium.
    scoringEnabled: v.boolean(),
    // Shown on the final screens (phone + beamer). Empty = not shown.
    outroMessage: v.optional(v.string()),
    // Optional cap on participants. When set, the lobby shows "van N" and joins beyond N are refused.
    maxPlayers: v.optional(v.number()),
    // Minutes without a host action before a session expires. Absent = 60, max 240.
    idleTimeoutMinutes: v.optional(v.number()),
    // Inactive quizzes stay in /admin with their results, but cannot start new sessions.
    inactive: v.optional(v.boolean()),
    // Set when an admin deletes the quiz; its sessions and questions are then purged.
    deletedAt: v.optional(v.number()),
  }).index('by_title', ['title']),

  questions: defineTable({
    quizId: v.id('quizzes'),
    order: v.number(),
    topic: v.string(),
    text: v.string(),
    type: questionTypeValidator,
    options: v.array(optionValidator),
    explanation: v.optional(v.string()),
    timeLimitSec: v.number(),
  }).index('by_quizId_and_order', ['quizId', 'order']),

  sessions: defineTable({
    quizId: v.id('quizzes'),
    joinCode: v.string(),
    hostToken: v.string(),
    // Snapshots of the quiz settings at session creation.
    scoringEnabled: v.boolean(),
    maxPlayers: v.optional(v.number()),
    phase: phaseValidator,
    currentQuestionIndex: v.number(),
    questionStartedAt: v.optional(v.number()),
    questionEndsAt: v.optional(v.number()),
    scheduledRevealId: v.optional(v.id('_scheduled_functions')),
    // Expiry: idleTimeoutMinutes after the last host action (see lib/flow.ts keepAlive).
    idleTimeoutMinutes: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    scheduledExpiryId: v.optional(v.id('_scheduled_functions')),
    // Why the session reached "finished". Absent for sessions from before this field.
    endReason: v.optional(
      v.union(v.literal('completed'), v.literal('ended'), v.literal('expired')),
    ),
    // Set when an admin deletes the session; its data is then purged in batches.
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    finishedAt: v.optional(v.number()),
  })
    .index('by_joinCode', ['joinCode'])
    .index('by_quizId', ['quizId'])
    .index('by_createdAt', ['createdAt']),

  players: defineTable({
    sessionId: v.id('sessions'),
    name: v.string(),
    email: v.string(),
    // Stays 0 when scoring is off.
    score: v.number(),
    joinedAt: v.number(),
  })
    // Kept next to by_sessionId_and_email for its join-order (_creationTime) sort: lobby list.
    // eslint-disable-next-line @convex-dev/no-duplicate-indexes
    .index('by_sessionId', ['sessionId'])
    .index('by_sessionId_and_email', ['sessionId', 'email']),

  answers: defineTable({
    sessionId: v.id('sessions'),
    questionId: v.id('questions'),
    playerId: v.id('players'),
    optionIds: v.array(v.string()),
    answeredAt: v.number(),
    // Undefined for polls. Always stored otherwise, even with scoring off (the export needs it).
    correct: v.optional(v.boolean()),
    // 0 when scoring is off.
    points: v.number(),
  })
    .index('by_sessionId_and_questionId', ['sessionId', 'questionId'])
    .index('by_playerId_and_questionId', ['playerId', 'questionId']),
})
