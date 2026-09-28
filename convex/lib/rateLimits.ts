import { MINUTE, RateLimiter } from '@convex-dev/rate-limiter'
import { components } from '../_generated/api'
import { JOIN_BURST, JOINS_PER_MINUTE } from './limits'

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Keyed by session: Convex does not expose the client's IP address.
  join: {
    kind: 'token bucket',
    rate: JOINS_PER_MINUTE,
    period: MINUTE,
    capacity: JOIN_BURST,
  },
})
