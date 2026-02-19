import { Router } from "express";
import { AIServiceError, askGemini } from "../services/ai/gemini.service";
import { buildAIContext } from "../services/ai/context.service";
import { tryHandleAgentQuery } from "../services/ai/agent.service";
import {
  tryHandleDateSpecificQuery,
  tryHandleStatusMetricQuery,
} from "../services/ai/dateQuery.service";
import {
  buildAffirmativeFollowUpReply,
  buildGreetingReply,
  buildQuotaFallbackReply,
  isAffirmative,
  isGreeting,
} from "../services/ai/chatReply.service";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const { role, attendanceSummary, feedingSummary, insights, message } =
      req.body ?? {};

    if (!role || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Invalid request: role and message are required.",
      });
    }

    const trimmedMessage = message.trim();

    if (isGreeting(trimmedMessage)) {
      return res.json({
        reply: buildGreetingReply(String(role)),
      });
    }

    if (isAffirmative(trimmedMessage)) {
      const normalizedAttendanceSummary = String(
        attendanceSummary ?? "No attendance data available.",
      );
      const normalizedFeedingSummary = String(
        feedingSummary ?? "No feeding data available.",
      );

      return res.json({
        reply: buildAffirmativeFollowUpReply({
          role: String(role),
          attendanceSummary: normalizedAttendanceSummary,
          feedingSummary: normalizedFeedingSummary,
        }),
      });
    }

    const normalizedAttendanceSummary =
      attendanceSummary ?? "No attendance data available.";
    const normalizedFeedingSummary =
      feedingSummary ?? "No feeding data available.";

    const agentReply = await tryHandleAgentQuery({
      role: String(role),
      question: trimmedMessage,
      attendanceSummary: normalizedAttendanceSummary,
      feedingSummary: normalizedFeedingSummary,
    });
    if (agentReply) {
      console.log("[AI_CHAT_PATH] agent", { message: trimmedMessage });
      return res.json({ reply: agentReply });
    }

    const deterministicReply =
      tryHandleStatusMetricQuery({
        message: trimmedMessage,
        attendanceSummary: normalizedAttendanceSummary,
        feedingSummary: normalizedFeedingSummary,
      }) ??
      tryHandleDateSpecificQuery({
        message: trimmedMessage,
        attendanceSummary: normalizedAttendanceSummary,
        feedingSummary: normalizedFeedingSummary,
      });
    if (deterministicReply) {
      console.log("[AI_CHAT_PATH] deterministic", { message: trimmedMessage });
      return res.json({ reply: deterministicReply });
    }

    const prompt = buildAIContext({
      role,
      attendanceSummary: normalizedAttendanceSummary,
      feedingSummary: normalizedFeedingSummary,
      insights: Array.isArray(insights) ? insights : [],
      question: trimmedMessage,
    });

    const reply = await askGemini(prompt);
    console.log("[AI_CHAT_PATH] gemini", { message: trimmedMessage });

    res.json({ reply });
  } catch (error) {
    if (error instanceof AIServiceError && error.code === "quota_exceeded") {
      const fallbackReply = buildQuotaFallbackReply({
        role: String(req.body?.role ?? ""),
        question: String(req.body?.message ?? ""),
        attendanceSummary: String(
          req.body?.attendanceSummary ?? "No attendance data available.",
        ),
        feedingSummary: String(
          req.body?.feedingSummary ?? "No feeding data available.",
        ),
        retryAfterSeconds: error.retryAfterSeconds,
      });

      return res.json({ reply: fallbackReply });
    }

    const message = error instanceof Error ? error.message : "AI chat failed";
    console.error("AI chat error:", error);
    const status = error instanceof AIServiceError ? error.status : 500;
    res.status(status).json({ message });
  }
});

export default router;
