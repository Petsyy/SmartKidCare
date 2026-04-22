import { z } from "zod";
import { 
  AI_INPUT_LIMITS, 
  inputIsGibberish, 
  sanitizeAIChildId, 
  sanitizeAIMessageInput 
} from "../../shared/utils/ai-input-sanitizer";
import { AIServiceError } from ".";
import { shouldUseAIAgent, tryHandleAgentQuery } from "./agent.service";
import { buildConversationId, writeConversationClosure, getConversationHistory } from "./ai-writer.service";

export type AIResponseLanguage = "en" | "tl";

type AuthContext = { id?: string; role?: string };

export type AiChatRequestContext = {
  body: unknown;
  user?: AuthContext;
};

export type AiChatResult = {
  status: number;
  body: { message?: string; reply?: string };
};

const FOLLOW_UP_STATE_TTL_MS = 10 * 60 * 1000;

export type FollowUpChoice = "attendance" | "feeding" | "both";
export type PendingTimeframe = "today" | "week" | "last_week" | "month" | "recent";
export type PendingFollowUpState = {
  kind: "detailed_review_confirmation" | "domain_selection";
  timeframe: PendingTimeframe;
  domain: FollowUpChoice;
  expiresAt: number;
};

const GREETING_PATTERN = /^(hi|hello|hey|good morning|good afternoon|good evening)[.!?]*$/;
const ACKNOWLEDGEMENT_PATTERN = /^(thanks|thanks a lot|thank you|thank you so much|ty|ok|okay|alright|got it|noted)[.!?]*$/;
const CONVERSATION_CLOSURE_PATTERN = /^(no(?:pe)?\s*(?:,)?\s*(?:thank\s*you|thanks)|not now(?:\s*(?:,)?\s*(?:thank\s*you|thanks))?)\s*[.!?]*$/;
const TRAILING_PUNCTUATION_PATTERN = /[.!?]+$/g;

const AFFIRMATIVES = new Set(["yes", "y", "yeah", "yep", "sure", "ok", "okay", "yes please", "sure please", "go ahead", "proceed"]);

const pendingFollowUpByConversation = new Map<string, PendingFollowUpState>();

const setPendingFollowUp = (conversationId: string, state: Omit<PendingFollowUpState, "expiresAt">) => {
  pendingFollowUpByConversation.set(conversationId, {
    ...state,
    expiresAt: Date.now() + FOLLOW_UP_STATE_TTL_MS,
  });
};

const getPendingFollowUp = (conversationId: string): PendingFollowUpState | undefined => {
  const state = pendingFollowUpByConversation.get(conversationId);
  if (!state) return undefined;
  if (Date.now() > state.expiresAt) {
    pendingFollowUpByConversation.delete(conversationId);
    return undefined;
  }
  return state;
};

const clearPendingFollowUp = (conversationId: string) => pendingFollowUpByConversation.delete(conversationId);

const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

const isGreeting = (text: string) => GREETING_PATTERN.test(normalize(text));
const isAcknowledgement = (text: string) => ACKNOWLEDGEMENT_PATTERN.test(normalize(text));
const isConversationClosure = (text: string) => CONVERSATION_CLOSURE_PATTERN.test(normalize(text));
const isAffirmative = (text: string) => AFFIRMATIVES.has(normalize(text).replace(TRAILING_PUNCTUATION_PATTERN, ""));

const inferFollowUpChoice = (message: string): FollowUpChoice | null => {
  const lower = message.toLowerCase();
  const hasAttendance = /\b(attendance|present|absent)\b/.test(lower);
  const hasFeeding = /\b(feeding|feed|food|meal|meals|eat|ate|eaten)\b/.test(lower);
  const asksBoth = /\b(both|all)\b/.test(lower);

  if (asksBoth || (hasAttendance && hasFeeding)) return "both";
  if (hasAttendance) return "attendance";
  if (hasFeeding) return "feeding";
  return null;
};

const buildGreetingReply = (role: string) => 
  "Hello! I can help with your child's attendance and feeding records. What would you like to know?";

const buildAcknowledgementReply = () => 
  "You're welcome. Ask anytime about your child's attendance or feeding.";

const buildQuotaFallbackReply = (retry?: number) => 
  `AI is temporarily rate-limited.${retry ? ` Please try again in about ${retry} seconds.` : " Please try again shortly."} You can still ask about your child's attendance or feeding once the limit resets.`;

const timeframeLabel = (tf: PendingTimeframe) => {
  if (tf === "today") return "today";
  if (tf === "week") return "this week";
  if (tf === "last_week") return "last week";
  if (tf === "month") return "this month";
  return "recently";
};

const buildScope = (role: string, tf: PendingTimeframe, possessive = false) => {
  const isParent = role.toLowerCase() === "parent";
  const subject = possessive ? "your child's" : "your child";
  if (tf === "recent") return isParent ? " from your child's recent records" : " from the recent records";
  return isParent ? ` for ${subject} ${timeframeLabel(tf)}` : ` for ${timeframeLabel(tf)}`;
};

const buildDomainSelectionPrompt = (role: string, tf: PendingTimeframe) => 
  `Sure. Do you want attendance details, feeding details, or both${buildScope(role, tf)}?`;

const buildScopedFollowUpQuestion = (role: string, choice: FollowUpChoice, tf: PendingTimeframe) => {
  const scope = buildScope(role, tf, false);
  if (choice === "attendance") return `Show attendance details${scope}.`;
  if (choice === "feeding") return `Show feeding details${scope}.`;
  return `Show both attendance and feeding details${scope}.`;
};

const aiChatRequestSchema = z.object({
  role: z.enum(["parent"]).optional(),
  message: z.string().max(5000, "Message is too long."),
  childId: z.string().optional(),
});

const parseRequest = (body: unknown, auth: AuthContext) => {
  const parsed = aiChatRequestSchema.safeParse(body ?? {});
  if (!parsed.success) return { ok: false, status: 400, message: parsed.error.issues[0]?.message || "Invalid request." };

  const role = String(auth.role ?? parsed.data.role ?? "").trim().toLowerCase();
  const requesterId = String(auth.id ?? "");
  const message = sanitizeAIMessageInput(parsed.data.message, AI_INPUT_LIMITS.messageMaxLength);
  const childId = sanitizeAIChildId(parsed.data.childId);

  if (!message) return { ok: false, status: 400, message: "Message is empty." };
  if (inputIsGibberish(message)) return { ok: false, status: 400, message: "I couldn't understand that. Please ask about records." };
  if (role !== "parent") return { ok: false, status: 403, message: "AI chat is for parents only." };

  return { ok: true, data: { role, requesterId, message, childId } };
};

export const handleAiChatRequest = async (params: AiChatRequestContext): Promise<AiChatResult> => {
  try {
    const parsed = parseRequest(params.body, params.user ?? {});
    if (!parsed.ok) return { status: parsed.status!, body: { message: parsed.message! } };

    const { role, requesterId, message: trimmedMessage, childId } = parsed.data!;
    const language: AIResponseLanguage = "en";
    const conversationId = buildConversationId({ requesterId, role, childId, language });
    
    const hasAgentIntent = shouldUseAIAgent(trimmedMessage);
    const pendingFollowUp = getPendingFollowUp(conversationId);

    // 1. Static Replies
    if (!hasAgentIntent && isGreeting(trimmedMessage)) {
      clearPendingFollowUp(conversationId);
      return { status: 200, body: { reply: buildGreetingReply(role) } };
    }

    if (!hasAgentIntent && isAcknowledgement(trimmedMessage)) {
      clearPendingFollowUp(conversationId);
      return { status: 200, body: { reply: buildAcknowledgementReply() } };
    }

    if (!hasAgentIntent && isConversationClosure(trimmedMessage)) {
      clearPendingFollowUp(conversationId);
      const reply = await writeConversationClosure({ role, language, message: trimmedMessage, conversationId });
      return { status: 200, body: { reply } };
    }

    // 2. Follow-up Logic
    if (pendingFollowUp && !hasAgentIntent) {
      const selectedChoice = isAffirmative(trimmedMessage) ? pendingFollowUp.domain : inferFollowUpChoice(trimmedMessage);
      if (selectedChoice) {
        clearPendingFollowUp(conversationId);
        const followUpQuestion = buildScopedFollowUpQuestion(role, selectedChoice, pendingFollowUp.timeframe);
        const reply = await tryHandleAgentQuery({ role, question: followUpQuestion, childId, requesterId, language, conversationId, suppressFollowUp: true });
        if (reply) return { status: 200, body: { reply } };
      }
      if (trimmedMessage.length <= 30) {
        return { status: 200, body: { reply: buildDomainSelectionPrompt(role, pendingFollowUp.timeframe) } };
      }
    }

    if (isAffirmative(trimmedMessage)) {
      setPendingFollowUp(conversationId, { kind: "domain_selection", timeframe: "recent", domain: "both" });
      return { status: 200, body: { reply: "Sure. Do you want attendance details, feeding details, or both for your child?" } };
    }

    // 3. Agent Delegation
    const agentReply = await tryHandleAgentQuery({ role, question: trimmedMessage, childId, requesterId, language, conversationId });
    if (agentReply) return { status: 200, body: { reply: agentReply } };

    return { status: 200, body: { reply: "I couldn't process that. Please ask about attendance or feeding." } };

  } catch (error) {
    if (error instanceof AIServiceError && error.code === "quota_exceeded") {
      return { status: 200, body: { reply: buildQuotaFallbackReply(error.retryAfterSeconds) } };
    }
    console.error("AI chat error:", error);
    return { status: error instanceof AIServiceError ? error.status : 500, body: { message: error instanceof Error ? error.message : "AI chat failed" } };
  }
};
