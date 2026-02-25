import { Router } from "express";
import { z } from "zod";
import { authenticateToken } from "../middlewares/auth.middleware";
import { AIServiceError } from "../services/ai/gemini.service";
import { shouldUseAIAgent, tryHandleAgentQuery } from "../services/ai/agent.service";
import {
  buildConversationId,
  writeConversationClosure,
} from "../services/ai/aiWriter.service";
import {
  buildAcknowledgementReply,
  buildGreetingReply,
  buildQuotaFallbackReply,
  isAcknowledgement,
  isAffirmative,
  isConversationClosure,
  isGreeting,
} from "../services/ai/chatReply.service";
import { detectResponseLanguage } from "../services/ai/language.service";
import {
  AI_INPUT_LIMITS,
  sanitizeAIChildId,
  sanitizeAIMessageInput,
} from "../utils/aiInputSanitizer";

const router = Router();

const aiChatRequestSchema = z.object({
  role: z.enum(["parent", "teacher", "admin"]).optional(),
  message: z.string().max(5000, "Message is too long."),
  childId: z.string().optional(),
});

router.post("/chat", authenticateToken, async (req, res) => {
  let roleForFallback = "";
  let messageForFallback = "";

  try {
    const parsedRequest = aiChatRequestSchema.safeParse(req.body ?? {});
    if (!parsedRequest.success) {
      const firstIssue = parsedRequest.error.issues[0];
      return res.status(400).json({
        message: firstIssue?.message || "Invalid request payload.",
      });
    }

    const {
      role: bodyRole,
      message: rawMessage,
      childId: rawChildId,
    } = parsedRequest.data;
    const role = String(req.user?.role ?? bodyRole ?? "").trim().toLowerCase();
    const requesterId = String(req.user?.id ?? "");
    const message = sanitizeAIMessageInput(
      rawMessage,
      AI_INPUT_LIMITS.messageMaxLength,
    );
    const childId = sanitizeAIChildId(rawChildId);

    roleForFallback = role;
    messageForFallback = message;

    if (!message) {
      return res.status(400).json({
        message: "Invalid request: message is empty after sanitization.",
      });
    }

    if (rawChildId?.trim() && !childId) {
      return res.status(400).json({
        message: "Invalid request: childId must be a valid identifier.",
      });
    }

    if (!role || !requesterId) {
      return res.status(400).json({
        message: "Invalid request: authenticated role and message are required.",
      });
    }

    const trimmedMessage = message;
    const language = detectResponseLanguage(trimmedMessage);
    const conversationId = buildConversationId({
      requesterId,
      role,
      childId,
      language,
    });
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

    if (!hasAgentIntent && isConversationClosure(trimmedMessage)) {
      const closureReply = await writeConversationClosure({
        role,
        language,
        message: trimmedMessage,
        conversationId,
      });
      return res.json({
        reply: closureReply,
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
        childId,
        requesterId,
        language,
        conversationId,
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
      childId,
      requesterId,
      language,
      conversationId,
    });
    if (agentReply) {
      const accuracyMatch = agentReply.match(/(\d+(?:\.\d+)?)%/);
      if (accuracyMatch?.[1]) {
        console.log(`${accuracyMatch[1]}%`);
      }
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
      const message =
        messageForFallback ||
        sanitizeAIMessageInput(
          String(req.body?.message ?? ""),
          AI_INPUT_LIMITS.messageMaxLength,
        );
      const language = detectResponseLanguage(message);
      const fallbackReply = buildQuotaFallbackReply({
        role: roleForFallback || String(req.user?.role ?? req.body?.role ?? ""),
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
