import { ConvexError, v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { requireHost } from "./lib/auth";
import { getQuestions, questionsMissingCorrect } from "./lib/data";
import { assertPhase, finish, revealNow, startQuestion } from "./lib/flow";

const hostArgs = { sessionId: v.id("sessions"), hostToken: v.string() };

/** lobby -> first question. */
export const start = mutation({
  args: hostArgs,
  handler: async (ctx, { sessionId, hostToken }) => {
    const session = await requireHost(ctx, sessionId, hostToken);
    assertPhase(session, "lobby");
    const questions = await getQuestions(ctx, session.quizId);
    if (questions.length === 0) throw new ConvexError({ code: "NO_QUESTIONS" });
    const missing = questionsMissingCorrect(questions);
    if (missing.length > 0) throw new ConvexError({ code: "MISSING_CORRECT", questions: missing });
    await startQuestion(ctx, session, 0);
    return null;
  },
});

/** question -> reveal before the timer ends ("Timer overslaan"). */
export const skipTimer = mutation({
  args: hostArgs,
  handler: async (ctx, { sessionId, hostToken }) => {
    const session = await requireHost(ctx, sessionId, hostToken);
    assertPhase(session, "question");
    await revealNow(ctx, session);
    return null;
  },
});

/** reveal -> leaderboard (scoring only) or next question / finished; leaderboard -> next question / finished. */
export const next = mutation({
  args: hostArgs,
  handler: async (ctx, { sessionId, hostToken }) => {
    const session = await requireHost(ctx, sessionId, hostToken);
    assertPhase(session, "reveal", "leaderboard");
    if (session.phase === "reveal" && session.scoringEnabled) {
      await ctx.db.patch("sessions", session._id, { phase: "leaderboard" });
      return null;
    }
    const questions = await getQuestions(ctx, session.quizId);
    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      await startQuestion(ctx, session, nextIndex);
    } else {
      await finish(ctx, session);
    }
    return null;
  },
});

/** Back to the previous reveal: from question/reveal of i to reveal of i-1, from leaderboard of i to reveal of i. */
export const previous = mutation({
  args: hostArgs,
  handler: async (ctx, { sessionId, hostToken }) => {
    const session = await requireHost(ctx, sessionId, hostToken);
    assertPhase(session, "question", "reveal", "leaderboard");
    const target = session.phase === "leaderboard" ? session.currentQuestionIndex : session.currentQuestionIndex - 1;
    if (target < 0) throw new ConvexError({ code: "NO_PREVIOUS" });
    await revealNow(ctx, session, target);
    return null;
  },
});

/** Only valid with scoring on; `next` uses the same rule. Exposed so the host can re-open it. */
export const showLeaderboard = mutation({
  args: hostArgs,
  handler: async (ctx, { sessionId, hostToken }) => {
    const session = await requireHost(ctx, sessionId, hostToken);
    if (!session.scoringEnabled) throw new ConvexError({ code: "SCORING_DISABLED" });
    assertPhase(session, "reveal");
    await ctx.db.patch("sessions", session._id, { phase: "leaderboard" });
    return null;
  },
});

export const end = mutation({
  args: hostArgs,
  handler: async (ctx, { sessionId, hostToken }) => {
    const session = await requireHost(ctx, sessionId, hostToken);
    if (session.phase === "finished") return null;
    await finish(ctx, session);
    return null;
  },
});

/** Scheduled at questionEndsAt. No-op if the host already moved on. */
export const autoReveal = internalMutation({
  args: { sessionId: v.id("sessions"), questionIndex: v.number() },
  handler: async (ctx, { sessionId, questionIndex }) => {
    const session = await ctx.db.get("sessions", sessionId);
    if (!session || session.phase !== "question" || session.currentQuestionIndex !== questionIndex) {
      return null;
    }
    await revealNow(ctx, session);
    return null;
  },
});
