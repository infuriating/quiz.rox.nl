import type { FunctionReturnType } from 'convex/server'
import type { api } from '../../../convex/_generated/api'

export type HostView = FunctionReturnType<typeof api.sessions.getHostView>
export type ManageView = FunctionReturnType<typeof api.sessions.getManageView>
