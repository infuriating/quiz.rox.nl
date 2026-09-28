import { ConvexError } from 'convex/values'
import { env } from '../_generated/server'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'

/** Throws unless `pin` matches the HOST_PIN environment variable. */
export function requirePin(pin: string): void {
  const expected = env.HOST_PIN
  if (!expected) {
    throw new ConvexError({ code: 'PIN_NOT_CONFIGURED' })
  }
  if (!constantTimeEqual(pin, expected)) {
    throw new ConvexError({ code: 'INVALID_PIN' })
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
