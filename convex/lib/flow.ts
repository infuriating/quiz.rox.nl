import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { getQuestions } from "./data";

type Phase = Doc<"sessions">["phase"];

/** Throws unless the session is in one of the allowed phases. */
export function assertPhase(session: Doc<"sessions">, ...allowed: Phase[]): void {
  if (!allowed.includes(session.phase)) {
    throw new ConvexError({ code: "WRONG_PHASE", phase: session.phase });
  }
}

async function cancelScheduledReveal(ctx: MutationCtx, session: Doc<"sessions">) {
  if (session.scheduledRevealId) {
    const job = await ctx.db.system.get("_scheduled_functions", session.scheduledRevealId);
    if (job && job.state.kind === "pending") {
      await ctx.scheduler.cancel(session.scheduledRevealId);
    }
  }
}

/** Opens question `index` with server time and schedules the automatic reveal. */
export async function startQuestion(ctx: MutationCtx, session: Doc<"sessions">, index: number) {
  const questions = await getQuestions(ctx, session.quizId);
  const question = questions[index];
  if (!question) throw new ConvexError({ code: "NO_SUCH_QUESTION" });
  await cancelScheduledReveal(ctx, session);
  const now = Date.now();
  const endsAt = now + question.timeLimitSec * 1000;
  const scheduledRevealId = await ctx.scheduler.runAt(endsAt, internal.game.autoReveal, {
    sessionId: session._id,
    questionIndex: index,
  });
  await ctx.db.patch("sessions", session._id, {
    phase: "question",
    currentQuestionIndex: index,
    questionStartedAt: now,
    questionEndsAt: endsAt,
    scheduledRevealId,
  });
}

/** Moves to reveal and cancels a pending automatic reveal. */
export async function revealNow(ctx: MutationCtx, session: Doc<"sessions">, index = session.currentQuestionIndex) {
  await cancelScheduledReveal(ctx, session);
  await ctx.db.patch("sessions", session._id, {
    phase: "reveal",
    currentQuestionIndex: index,
    scheduledRevealId: undefined,
  });
}

export async function finish(ctx: MutationCtx, session: Doc<"sessions">) {
  await cancelScheduledReveal(ctx, session);
  await ctx.db.patch("sessions", session._id, {
    phase: "finished",
    scheduledRevealId: undefined,
    finishedAt: Date.now(),
  });
}
