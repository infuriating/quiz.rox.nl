import rateLimiter from '@convex-dev/rate-limiter/convex.config'
import { defineApp } from 'convex/server'
import { v } from 'convex/values'

// HOST_PASSWORD guards the host screens and /admin. Use a long random value
// (at least 16 characters; 32 recommended). Set it with:
//   npx convex env set HOST_PASSWORD '<password>'
const app = defineApp({
  env: {
    HOST_PASSWORD: v.optional(v.string()),
  },
})

// Limits how fast players can join a session (convex/lib/rateLimits.ts).
app.use(rateLimiter)

export default app
