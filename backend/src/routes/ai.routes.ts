import { Router } from "express";
import { AIServiceError, askGemini } from "../services/gemini.service";
import { buildAIContext } from "../services/aiContext.service";
import { tryHandleDateSpecificQuery } from "../services/aiDateQuery.service";
import {
  buildAffirmativeFollowUpReply,
  buildGreetingReply,
  buildQuotaFallbackReply,
  isAffirmative,
  isGreeting,
} from "../services/aiChatReply.service";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const {
      role,
      attendanceSummary,
      feedingSummary,
      insights,
      message,
    } = req.body ?? {};

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

    const deterministicReply = tryHandleDateSpecificQuery({
      message: trimmedMessage,
      attendanceSummary: attendanceSummary ?? "No attendance data available.",
      feedingSummary: feedingSummary ?? "No feeding data available.",
    });
    if (deterministicReply) {
      return res.json({ reply: deterministicReply });
    }

    const prompt = buildAIContext({
      role,
      attendanceSummary: attendanceSummary ?? "No attendance data available.",
      feedingSummary: feedingSummary ?? "No feeding data available.",
      insights: Array.isArray(insights) ? insights : [],
      question: trimmedMessage,
    });

    const reply = await askGemini(prompt);

    res.json({ reply });
  } catch (error) {
    if (error instanceof AIServiceError && error.code === "quota_exceeded") {
      const fallbackReply = buildQuotaFallbackReply({
        role: String(req.body?.role ?? ""),
        question: String(req.body?.message ?? ""),
        attendanceSummary:
          String(req.body?.attendanceSummary ?? "No attendance data available."),
        feedingSummary:
          String(req.body?.feedingSummary ?? "No feeding data available."),
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
