import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { AIServiceError } from "../services/ai/gemini.service";
import { shouldUseAIAgent, tryHandleAgentQuery } from "../services/ai/agent.service";
import {
  buildAcknowledgementReply,
  buildGreetingReply,
  buildQuotaFallbackReply,
  isAcknowledgement,
  isAffirmative,
  isGreeting,
} from "../services/ai/chatReply.service";
import { detectResponseLanguage } from "../services/ai/language.service";

const router = Router();

router.post("/chat", authenticateToken, async (req, res) => {
  try {
    const { role: bodyRole, message, childId } = req.body ?? {};
    const role = String(req.user?.role ?? bodyRole ?? "");
    const requesterId = String(req.user?.id ?? "");

    if (!role || !requesterId || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Invalid request: authenticated role and message are required.",
      });
    }

    const trimmedMessage = message.trim();
    const language = detectResponseLanguage(trimmedMessage);
    const hasAgentIntent = shouldUseAIAgent(trimmedMessage);

    if (!hasAgentIntent && isGreeting(trimmedMessage)) {
      return res.json({
        reply: buildGreetingReply(String(role), language),
      });
    }

    if (!hasAgentIntent && isAcknowledgement(trimmedMessage)) {
      return res.json({
        reply: buildAcknowledgementReply(String(role), language),
      });
    }

    if (isAffirmative(trimmedMessage)) {
      const followUpQuestion =
        String(role).toLowerCase() === "parent"
          ? "Show both attendance and feeding details for my child this week."
          : "Show both attendance and feeding details this week.";

      const affirmativeReply = await tryHandleAgentQuery({
        role,
        question: followUpQuestion,
        childId: childId ? String(childId) : undefined,
        requesterId,
        language,
      });

      if (affirmativeReply) {
        return res.json({ reply: affirmativeReply });
      }

      return res.json({
        reply:
          language === "tl"
            ? "Pakitanong ang attendance, feeding, o pareho para maibuod ko ang records."
            : "Please ask for attendance, feeding, or both so I can summarize the records.",
      });
    }

    const agentReply = await tryHandleAgentQuery({
      role,
      question: trimmedMessage,
      childId: childId ? String(childId) : undefined,
      requesterId,
      language,
    });
    if (agentReply) {
      console.log("[AI_CHAT_PATH] agent", { message: trimmedMessage });
      return res.json({ reply: agentReply });
    }

    return res.json({
      reply:
        language === "tl"
          ? "Hindi ko naproseso ang request. Pakitanong ang attendance o feeding ng batang ito."
          : "I couldn't process that request. Please ask about attendance or feeding for this child.",
    });
  } catch (error) {
    if (error instanceof AIServiceError && error.code === "quota_exceeded") {
      const message = String(req.body?.message ?? "");
      const language = detectResponseLanguage(message);
      const fallbackReply = buildQuotaFallbackReply({
        role: String(req.body?.role ?? ""),
        retryAfterSeconds: error.retryAfterSeconds,
        language,
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
