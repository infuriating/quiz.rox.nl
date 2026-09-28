import type { FunctionReturnType } from 'convex/server'
import type { api } from '../../../convex/_generated/api'

export type PlayerView = NonNullable<
  FunctionReturnType<typeof api.sessions.getPlayerView>
>
