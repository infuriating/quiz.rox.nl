import { ConvexError } from 'convex/values'
import { env } from '../_generated/server'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'

/** A configured password shorter than this is refused, so a weak one cannot slip into production. */
export const MIN_HOST_PASSWORD_LENGTH = 16

/** Throws unless `password` matches the HOST_PASSWORD environment variable. */
export function requirePassword(password: string): void {
  const expected = env.HOST_PASSWORD
  if (!expected) {
    throw new ConvexError({ code: 'PASSWORD_NOT_CONFIGURED' })
  }
  if (expected.length < MIN_HOST_PASSWORD_LENGTH) {
    throw new ConvexError({
      code: 'PASSWORD_TOO_SHORT',
      min: MIN_HOST_PASSWORD_LENGTH,
    })
  }
  if (!constantTimeEqual(password, expected)) {
    throw new ConvexError({ code: 'INVALID_PASSWORD' })
  }
}

/** Loads a session and checks the host token issued at session creation. */
export async function requireHost(
  ctx: QueryCtx | MutationCtx,
  sessionId: Id<'sessions'>,
  hostToken: string,
): Promise<Doc<'sessions'>> {
  const session = await ctx.db.get('sessions', sessionId)
  if (
    !session ||
    session.deletedAt !== undefined ||
    !constantTimeEqual(session.hostToken, hostToken)
  ) {
    throw new ConvexError({ code: 'NOT_HOST' })
  }
  return session
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
