// Upper bounds for bounded reads. The app targets one room (~15 players);
// these caps keep every query bounded even for a larger public quiz.
export const MAX_PLAYERS_PER_SESSION = 500
export const MAX_QUESTIONS_PER_QUIZ = 200
export const MAX_SESSIONS_PER_QUIZ = 200
export const MAX_QUIZZES = 200
export const LEADERBOARD_SIZE = 5
export const PODIUM_SIZE = 3
export const MAX_OUTRO_LENGTH = 120
export const MAX_OPTION_LENGTH = 140
export const MAX_QUESTION_LENGTH = 200

/**
 * Joining: new players per session. A burst covers a full room scanning the
 * QR code at once; after that, joins refill at this rate per minute. Stops a
 * script from filling a public session with fake players in seconds.
 */
export const JOIN_BURST = 200
export const JOINS_PER_MINUTE = 120

/** A session expires after this long without a host action (default, per quiz overridable). */
export const DEFAULT_IDLE_TIMEOUT_MINUTES = 60
/** Upper bound for the per-quiz override, e.g. for a quiz with presentations in between. */
export const MAX_IDLE_TIMEOUT_MINUTES = 4 * 60
/**
 * Retention: a session with its players (names, emails) and answers is deleted
 * this long after it was created. Long enough to serve as a training record
 * for a yearly audit; export the CSV first if it must be kept longer.
 */
export const RETENTION_DAYS = 365
export const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000
/** Sessions marked for deletion per run of the retention job. */
export const RETENTION_BATCH_SIZE = 100
/** Rows deleted per transaction when purging a deleted session. */
export const PURGE_BATCH_SIZE = 500
