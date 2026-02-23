import { Router } from "express";
import { AIServiceError } from "../services/ai/gemini.service";
import { tryHandleAgentQuery } from "../services/ai/agent.service";
import {
  buildAcknowledgementReply,
  buildGreetingReply,
  buildQuotaFallbackReply,
  isAcknowledgement,
  isAffirmative,
  isGreeting,
} from "../services/ai/chatReply.service";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const { role, message, childId } = req.body ?? {};

    if (!role || !childId || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Invalid request: role, childId, and message are required.",
      });
    }

    const trimmedMessage = message.trim();

    if (isGreeting(trimmedMessage)) {
      return res.json({
        reply: buildGreetingReply(String(role)),
      });
    }

    if (isAcknowledgement(trimmedMessage)) {
      return res.json({
        reply: buildAcknowledgementReply(String(role)),
      });
    }

    if (isAffirmative(trimmedMessage)) {
      const followUpQuestion =
        String(role).toLowerCase() === "parent"
          ? "Show both attendance and feeding details for my child this week."
          : "Show both attendance and feeding details this week.";

      const affirmativeReply = await tryHandleAgentQuery({
        role: String(role),
        question: followUpQuestion,
        childId: String(childId),
      });

      if (affirmativeReply) {
        return res.json({ reply: affirmativeReply });
      }

      return res.json({
        reply:
          "Please ask for attendance, feeding, or both so I can summarize the records.",
      });
    }

    const agentReply = await tryHandleAgentQuery({
      role: String(role),
      question: trimmedMessage,
      childId: String(childId),
    });
    if (agentReply) {
      console.log("[AI_CHAT_PATH] agent", { message: trimmedMessage });
      return res.json({ reply: agentReply });
    }

    return res.json({
      reply:
        "I couldn't process that request. Please ask about attendance or feeding for this child.",
    });
  } catch (error) {
    if (error instanceof AIServiceError && error.code === "quota_exceeded") {
      const fallbackReply = buildQuotaFallbackReply({
        role: String(req.body?.role ?? ""),
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
