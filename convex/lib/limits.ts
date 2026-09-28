// Upper bounds for bounded reads. The app targets one room (~15 players);
// these caps keep every query bounded even for a larger public quiz.
export const MAX_PLAYERS_PER_SESSION = 500;
export const MAX_QUESTIONS_PER_QUIZ = 200;
export const MAX_SESSIONS_PER_QUIZ = 200;
export const MAX_QUIZZES = 200;
export const LEADERBOARD_SIZE = 5;
export const PODIUM_SIZE = 3;
export const MAX_OUTRO_LENGTH = 120;
export const MAX_OPTION_LENGTH = 140;
export const MAX_QUESTION_LENGTH = 200;
