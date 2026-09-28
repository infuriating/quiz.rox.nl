import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAnswers, getPlayerAnswer, getPlayers, getQuestions } from "./lib/data";
import { revealNow } from "./lib/flow";
import { evaluate, pointsFor } from "./lib/scoring";

/** The only place answers are evaluated. Uses server time. */
export const submitAnswer = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    questionId: v.id("questions"),
    optionIds: v.array(v.string()),
  },
  handler: async (ctx, { sessionId, playerId, questionId, optionIds }) => {
    const now = Date.now();
    const session = await ctx.db.get("sessions", sessionId);
    if (!session) throw new ConvexError({ code: "NO_SESSION" });
    const player = await ctx.db.get("players", playerId);
    if (!player || player.sessionId !== sessionId) throw new ConvexError({ code: "NOT_A_PLAYER" });

    if (session.phase !== "question") throw new ConvexError({ code: "WRONG_PHASE" });
    if (session.questionEndsAt === undefined || now > session.questionEndsAt) {
      throw new ConvexError({ code: "TOO_LATE" });
    }
    const questions = await getQuestions(ctx, session.quizId);
    const question = questions[session.currentQuestionIndex];
    if (question._id !== questionId) throw new ConvexError({ code: "WRONG_QUESTION" });

    const unique = [...new Set(optionIds)];
    const known = new Set(question.options.map((o) => o.id));
    if (unique.length === 0 || unique.some((id) => !known.has(id))) {
      throw new ConvexError({ code: "INVALID_OPTIONS" });
    }
    if (question.type !== "multi" && unique.length !== 1) {
      throw new ConvexError({ code: "INVALID_OPTIONS" });
    }
    if (await getPlayerAnswer(ctx, playerId, questionId)) {
      throw new ConvexError({ code: "ALREADY_ANSWERED" });
    }

    const correct = evaluate(question, unique);
    const elapsed = now - (session.questionStartedAt ?? now);
    const points = session.scoringEnabled && correct ? pointsFor(true, elapsed, question.timeLimitSec) : 0;
    await ctx.db.insert("answers", {
      sessionId,
      questionId,
      playerId,
      optionIds: unique,
      answeredAt: now,
      correct,
      points,
    });
    if (points > 0) {
      await ctx.db.patch("players", playerId, { score: player.score + points });
    }

    // Everyone answered: reveal right away.
    const [players, answers] = await Promise.all([
      getPlayers(ctx, sessionId),
      getAnswers(ctx, sessionId, questionId),
    ]);
    if (answers.length >= players.length) {
      await revealNow(ctx, session);
    }
    return null;
  },
});
