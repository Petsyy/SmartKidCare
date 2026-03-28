import { Router } from "express";
import { z } from "zod";
import { authenticateToken } from "../middlewares/auth.middleware";
import { AIServiceError } from "../services/ai/gemini.service";
import { shouldUseAIAgent, tryHandleAgentQuery } from "../services/ai/agent.service";
import {
  buildConversationId,
  getConversationHistory,
  writeConversationClosure,
} from "../services/ai/ai-writer.service";
import {
  buildAcknowledgementReply,
  buildGreetingReply,
  buildQuotaFallbackReply,
  isAcknowledgement,
  isAffirmative,
  isConversationClosure,
  isGreeting,
} from "../services/ai/chat-reply.services";
import { detectResponseLanguage } from "../services/ai/language.service";
import {
  AI_INPUT_LIMITS,
  inputIsGibberish,
  sanitizeAIChildId,
  sanitizeAIMessageInput,
} from "../utils/aiInputSanitizer";

const router = Router();
const FOLLOW_UP_STATE_TTL_MS = 10 * 60 * 1000;

type FollowUpChoice = "attendance" | "feeding" | "both";
type PendingTimeframe = "today" | "week" | "last_week" | "month" | "recent";
type PendingFollowUpKind = "detailed_review_confirmation" | "domain_selection";

type PendingFollowUpState = {
  kind: PendingFollowUpKind;
  timeframe: PendingTimeframe;
  domain: FollowUpChoice;
  expiresAt: number;
};

const pendingFollowUpByConversation = new Map<string, PendingFollowUpState>();

function setPendingFollowUp(
  conversationId: string,
  state: Omit<PendingFollowUpState, "expiresAt">,
): void {
  pendingFollowUpByConversation.set(conversationId, {
    ...state,
    expiresAt: Date.now() + FOLLOW_UP_STATE_TTL_MS,
  });
}

function getPendingFollowUp(
  conversationId: string,
): PendingFollowUpState | undefined {
  const state = pendingFollowUpByConversation.get(conversationId);
  if (!state) return undefined;
  if (Date.now() > state.expiresAt) {
    pendingFollowUpByConversation.delete(conversationId);
    return undefined;
  }
  return state;
}

function clearPendingFollowUp(conversationId: string): void {
  pendingFollowUpByConversation.delete(conversationId);
}

function recoverPendingFollowUpFromHistory(
  conversationId: string,
): PendingFollowUpState | undefined {
  const history = getConversationHistory(conversationId);
  if (!history.length) return undefined;

  const lastAssistantTurn = [...history]
    .reverse()
    .find((turn) => turn.role === "assistant" && turn.content.trim());
  const lastUserTurn = [...history]
    .reverse()
    .find((turn) => turn.role === "user" && turn.content.trim());

  if (!lastAssistantTurn || !lastUserTurn) return undefined;


  return {
    kind: "detailed_review_confirmation",
    timeframe: inferPendingTimeframe(lastUserTurn.content),
    domain: inferPendingDomain({
      question: lastUserTurn.content,
      reply: lastAssistantTurn.content,
    }),
    expiresAt: Date.now() + FOLLOW_UP_STATE_TTL_MS,
  };
}

function inferFollowUpChoice(message: string): FollowUpChoice | null {
  const lower = message.toLowerCase();
  const hasAttendance = /\b(attendance|present|absent|pagdalo|pasok|pumasok|lumiban|pagliban)\b/.test(
    lower,
  );
  const hasFeeding =
    /\b(feeding|feed|food|meal|meals|eat|ate|eaten|pagkain|kain|kumain|kinain|ulam)\b/.test(
      lower,
    );
  const asksBoth = /\b(both|pareho|lahat|all)\b/.test(lower);

  if (asksBoth || (hasAttendance && hasFeeding)) return "both";
  if (hasAttendance) return "attendance";
  if (hasFeeding) return "feeding";
  return null;
}

function inferPendingTimeframe(text: string): PendingTimeframe {
  const lower = text.toLowerCase();
  if (
    lower.includes("last week") ||
    lower.includes("previous week") ||
    lower.includes("nakaraang linggo") ||
    lower.includes("huling linggo")
  ) {
    return "last_week";
  }
  if (lower.includes("today") || lower.includes("ngayon")) return "today";
  if (lower.includes("month") || lower.includes("buwan")) return "month";
  if (lower.includes("week") || lower.includes("linggo")) return "week";
  return "recent";
}

function inferPendingDomain(params: {
  question: string;
  reply: string;
}): FollowUpChoice {
  const combined = `${params.question}\n${params.reply}`.toLowerCase();
  const hasAttendance = /\b(attendance|present|absent|pagdalo|pasok|pumasok|lumiban|pagliban)\b/.test(
    combined,
  );
  const hasFeeding =
    /\b(feeding|feed|food|meal|meals|eat|ate|eaten|pagkain|kain|kumain|kinain|ulam)\b/.test(
      combined,
    );

  if (hasAttendance && hasFeeding) return "both";
  if (hasFeeding) return "feeding";
  return "attendance";
}

function timeframeLabelForPrompt(
  timeframe: PendingTimeframe,
  language: "en" | "tl",
): string {
  if (language === "tl") {
    if (timeframe === "today") return "ngayong araw";
    if (timeframe === "week") return "ngayong linggo";
    if (timeframe === "last_week") return "nakaraang linggo";
    if (timeframe === "month") return "ngayong buwan";
    return "kamakailan";
  }

  if (timeframe === "today") return "today";
  if (timeframe === "week") return "this week";
  if (timeframe === "last_week") return "last week";
  if (timeframe === "month") return "this month";
  return "recently";
}

function buildPromptScope(params: {
  role: string;
  timeframe: PendingTimeframe;
  language: "en" | "tl";
  possessive?: boolean;
}): string {
  const isParent = String(params.role).toLowerCase() === "parent";
  const subject =
    params.language === "tl"
      ? params.possessive
        ? "ng anak mo"
        : "sa anak mo"
      : params.possessive
        ? "your child's"
        : "your child";

  if (params.language === "tl") {
    if (params.timeframe === "recent") {
      return isParent
        ? " mula sa recent records ng anak mo"
        : " mula sa recent records";
    }

    const timeframeLabel = timeframeLabelForPrompt(
      params.timeframe,
      params.language,
    );
    return isParent ? ` ${subject} ${timeframeLabel}` : ` sa ${timeframeLabel}`;
  }

  if (params.timeframe === "recent") {
    return isParent
      ? " from your child's recent records"
      : " from the recent records";
  }

  const timeframeLabel = timeframeLabelForPrompt(params.timeframe, params.language);
  return isParent ? ` for ${subject} ${timeframeLabel}` : ` for ${timeframeLabel}`;
}

function buildDomainSelectionPrompt(params: {
  role: string;
  language: "en" | "tl";
  timeframe: PendingTimeframe;
}): string {
  const scope = buildPromptScope({
    role: params.role,
    timeframe: params.timeframe,
    language: params.language,
  });

  if (params.language === "tl") {
    return `Sige. Attendance details, feeding details, o pareho${scope}?`;
  }

  return `Sure. Do you want attendance details, feeding details, or both${scope}?`;
}

function buildGenericDomainSelectionPrompt(params: {
  role: string;
  language: "en" | "tl";
}): string {
  const isParent = String(params.role).toLowerCase() === "parent";

  if (params.language === "tl") {
    return isParent
      ? "Sige. Attendance details, feeding details, o pareho para sa anak mo?"
      : "Sige. Attendance, feeding, o pareho ang gusto mong makita?";
  }

  return isParent
    ? "Sure. Do you want attendance details, feeding details, or both for your child?"
    : "Sure. Do you want attendance, feeding, or both?";
}

function buildScopedFollowUpQuestion(
  role: string,
  choice: FollowUpChoice,
  timeframe: PendingTimeframe,
): string {
  const scope = buildPromptScope({
    role,
    timeframe,
    language: "en",
    possessive: false,
  });

  if (choice === "attendance") {
    return `Show attendance details${scope}.`;
  }
  if (choice === "feeding") {
    return `Show feeding details${scope}.`;
  }

  return `Show both attendance and feeding details${scope}.`;
}


const aiChatRequestSchema = z.object({
  role: z.enum(["parent"]).optional(),
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

    if (inputIsGibberish(message)) {
      return res.status(400).json({
        message:
          "I couldn't understand that. Please ask a clear question about attendance or feeding.",
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

    if (role !== "parent") {
      return res.status(403).json({
        message:
          "AI chat is currently available only for parent accounts.",
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
    const pendingFollowUp =
      getPendingFollowUp(conversationId) ??
      recoverPendingFollowUpFromHistory(conversationId);

    if (!hasAgentIntent && isGreeting(trimmedMessage)) {
      clearPendingFollowUp(conversationId);
      return res.json({
        reply: buildGreetingReply(String(role), language),
      });
    }

    if (!hasAgentIntent && isAcknowledgement(trimmedMessage)) {
      clearPendingFollowUp(conversationId);
      return res.json({
        reply: buildAcknowledgementReply(String(role), language),
      });
    }

    if (!hasAgentIntent && isConversationClosure(trimmedMessage)) {
      clearPendingFollowUp(conversationId);
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

    if (pendingFollowUp && !hasAgentIntent) {
      const selectedChoice = isAffirmative(trimmedMessage)
        ? pendingFollowUp.domain
        : inferFollowUpChoice(trimmedMessage);

      if (selectedChoice) {
        clearPendingFollowUp(conversationId);
        const followUpQuestion = buildScopedFollowUpQuestion(
          role,
          selectedChoice,
          pendingFollowUp.timeframe,
        );

        const followUpReply = await tryHandleAgentQuery({
          role,
          question: followUpQuestion,
          childId,
          requesterId,
          language,
          conversationId,
          suppressFollowUp: true,
        });

        if (followUpReply) {
          return res.json({ reply: followUpReply });
        }
      }

      if (trimmedMessage.trim().length <= 30) {
        return res.json({
          reply: buildDomainSelectionPrompt({
            role: String(role),
            language,
            timeframe: pendingFollowUp.timeframe,
          }),
        });
      }
    }

    if (isAffirmative(trimmedMessage)) {
      setPendingFollowUp(conversationId, {
        kind: "domain_selection",
        timeframe: "recent",
        domain: "both",
      });

      return res.json({
        reply: buildGenericDomainSelectionPrompt({
          role: String(role),
          language,
        }),
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
