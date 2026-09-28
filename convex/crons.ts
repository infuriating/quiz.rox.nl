import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Retention: sessions (players, emails, answers) older than a year are deleted.
crons.cron(
  'delete sessions past retention',
  '17 3 * * *',
  internal.admin.purgeExpiredSessions,
  {},
)

export default crons
