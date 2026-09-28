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

/** A session expires after this long without a host action (default, per quiz overridable). */
export const DEFAULT_IDLE_TIMEOUT_MINUTES = 60
/** Upper bound for the per-quiz override, e.g. for a quiz with presentations in between. */
export const MAX_IDLE_TIMEOUT_MINUTES = 4 * 60
/** Rows deleted per transaction when purging a deleted session. */
export const PURGE_BATCH_SIZE = 500
