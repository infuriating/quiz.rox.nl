import { defineApp } from 'convex/server'
import { v } from 'convex/values'

// HOST_PIN guards the host screens and /admin. Set it with:
//   npx convex env set HOST_PIN 123456
const app = defineApp({
  env: {
    HOST_PIN: v.optional(v.string()),
  },
})

export default app
