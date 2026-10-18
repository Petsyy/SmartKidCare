import { z } from "zod";
import { askGemini } from "./gemini.service";
import type {
  AIConversationStateRecord,
  AIMessageClassification,
  AIResponseLanguage,
  FollowUpChoice,
  PendingTimeframe,
} from "../../types/core-ai-chat.types";

const IntentSchema = z
  .object({
    intent: z.enum([
      "greeting",
      "acknowledgement",
      "closure",
      "confirmation",
      "rejection",
      "language_preference",
      "attendance_summary",
      "attendance_details",
      "feeding_summary",
      "feeding_details",
      "combined_summary",
      "combined_details",
      "comparison",
      "trend",
      "clarification",
      "unsupported",
    ]),
    inputLanguage: z.enum(["en", "fil", "mixed", "unknown"]),
    requestedResponseLanguage: z.enum(["en", "fil"]).nullable(),
    returnToAutomaticLanguage: z.boolean(),
    domain: z.enum(["attendance", "feeding", "both"]).nullable(),
    primaryTimeframe: z
      .enum([
        "today",
        "yesterday",
        "week",
        "last_week",
        "month",
        "last_month",
        "recent",
      ])
      .nullable(),
    comparisonTimeframe: z
      .enum([
        "today",
        "yesterday",
        "week",
        "last_week",
        "month",
        "last_month",
        "recent",
      ])
      .nullable(),
    detailLevel: z.enum(["summary", "detailed"]).nullable(),
    confidence: z.number().min(0).max(1),
  })
  .strict();

const normalize = (message: string) =>
  message.normalize("NFKC").trim().toLocaleLowerCase("en-PH").replace(/\s+/g, " ");

const SHORT_AMBIGUOUS = new Set([
  "yes",
  "no",
  "oo",
  "opo",
  "okay",
  "ok",
  "sige",
  "attendance",
]);

const FILIPINO_MARKERS = /\b(ako|aking|anak|ano|ba|bakit|buwan|gusto|ilan|iyong|kahapon|kamusta|kain|kinain|kumain|linggo|magandang|mga|nakaraang|ng|ngayon|ni|noong|pagkain|pakita|paki|po|pumasok|pwede|siya|tungkol|wala)\b/g;
const ENGLISH_MARKERS = /\b(about|absent|attendance|ate|can|child|did|eat|feeding|food|how|last|meal|month|my|present|records|show|summary|tell|today|was|week|what|yesterday)\b/g;

export const detectInputLanguage = (
  message: string,
): AIMessageClassification["inputLanguage"] => {
  const value = normalize(message);
  if (!value || SHORT_AMBIGUOUS.has(value)) return "unknown";
  const filipino = value.match(FILIPINO_MARKERS)?.length ?? 0;
  const english = value.match(ENGLISH_MARKERS)?.length ?? 0;
  if (filipino > 0 && english > 0) return "mixed";
  if (filipino > 0) return "fil";
  if (english >= 2 || /^(hello|hi|good morning|good afternoon)\b/.test(value)) {
    return "en";
  }
  return "unknown";
};

export const resolveDetectedInputLanguage = (
  modelLanguage: AIMessageClassification["inputLanguage"],
  deterministicLanguage: AIMessageClassification["inputLanguage"],
): AIMessageClassification["inputLanguage"] =>
  deterministicLanguage === "unknown"
    ? modelLanguage
    : deterministicLanguage;

const timeframeFrom = (value: string): PendingTimeframe | null => {
  if (/\b(last month|nakaraang buwan)\b/.test(value)) return "last_month";
  if (/\b(this month|buwang ito|ngayong buwan)\b/.test(value)) return "month";
  if (/\b(last week|previous week|nakaraang linggo)\b/.test(value)) return "last_week";
  if (/\b(yesterday|kahapon)\b/.test(value)) return "yesterday";
  if (/\b(today|ngayon|ngayong araw)\b/.test(value)) return "today";
  if (/\b(this week|linggong ito|ngayong linggo)\b/.test(value)) return "week";
  if (/\b(30 days|recent|kamakailan)\b/.test(value)) return "recent";
  return null;
};

const domainFrom = (value: string): FollowUpChoice | null => {
  const attendance = /\b(attendance|attend|present|absent|absence|absences|pasok|pumasok|liban|lumiban|pagpasok)\b/.test(value);
  const feeding = /\b(feeding|feed|food|meal|meals|eat|ate|eaten|pagkain|kain|kinain|pinakain|ulam)\b/.test(value);
  if (/\b(both|all|pareho|lahat)\b/.test(value) || (attendance && feeding)) return "both";
  if (attendance) return "attendance";
  if (feeding) return "feeding";
  return null;
};

const languageInstructionFrom = (value: string) => {
  const returnToAutomaticLanguage =
    /\b(automatically follow my language|follow my language|automatic language|sundan mo ulit ang wika ko|awtomatikong sundan ang wika ko)\b/.test(
      value,
    );
  let requestedResponseLanguage: AIResponseLanguage | null = null;
  if (
    /\b(answer|reply|respond|use|speak|write|sagutin|sumagot|magsalita|gamitin|mag)\b[^.!?]{0,30}\b(english|ingles)\b/.test(
      value,
    ) || /\bmag-?english\b/.test(value)
  ) {
    requestedResponseLanguage = "en";
  } else if (
    /\b(answer|reply|respond|use|speak|write|sagutin|sumagot|magsalita|gamitin)\b[^.!?]{0,30}\b(filipino|tagalog)\b/.test(
      value,
    ) || /\bmag-?(filipino|tagalog)\b/.test(value)
  ) {
    requestedResponseLanguage = "fil";
  }
  return { requestedResponseLanguage, returnToAutomaticLanguage };
};

export const classifyMessageDeterministically = (
  message: string,
): AIMessageClassification => {
  const value = normalize(message);
  const inputLanguage = detectInputLanguage(value);
  const languageInstruction = languageInstructionFrom(value);
  const domain = domainFrom(value);
  const primaryTimeframe = timeframeFrom(value);
  const details = /\b(detail|details|detailed|list|entries|detalye|isa-isa)\b/.test(value);
  const comparison = /\b(compare|comparison|versus|vs|kumpara|ihambing)\b/.test(value);
  const trend = /\b(trend|30 days|takbo|pagbabago)\b/.test(value);

  let intent: AIMessageClassification["intent"] = "unsupported";
  if (/^(hi|hello|hey|kumusta|kamusta|magandang (umaga|hapon|gabi))[.!?]*$/.test(value)) {
    intent = "greeting";
  } else if (/^(yes|y|yeah|yep|sure|oo|opo|sige|go ahead|proceed)[.!?]*$/.test(value)) {
    intent = "confirmation";
  } else if (/^(no|nope|hindi|ayoko|huwag|wag)[.!?]*$/.test(value)) {
    intent = "rejection";
  } else if (/^(thanks|thank you|salamat|maraming salamat)[.!?]*$/.test(value)) {
    intent = "acknowledgement";
  } else if (/^(bye|goodbye|wala na|hindi na muna)[.!?]*$/.test(value)) {
    intent = "closure";
  } else if (comparison && domain) {
    intent = "comparison";
  } else if (trend) {
    intent = "trend";
  } else if (domain === "attendance") {
    intent = details ? "attendance_details" : "attendance_summary";
  } else if (domain === "feeding") {
    intent = details ? "feeding_details" : "feeding_summary";
  } else if (domain === "both") {
    intent = details ? "combined_details" : "combined_summary";
  } else if (
    languageInstruction.requestedResponseLanguage ||
    languageInstruction.returnToAutomaticLanguage
  ) {
    intent = "language_preference";
  } else if (value.length <= 30) {
    intent = "clarification";
  }

  let comparisonPeriods: [PendingTimeframe | null, PendingTimeframe | null] = [
    primaryTimeframe,
    null,
  ];
  if (comparison) {
    if (/\b(today|ngayon)\b/.test(value) && /\b(yesterday|kahapon)\b/.test(value)) {
      comparisonPeriods = ["today", "yesterday"];
    } else if (
      /\b(this week|ngayong linggo|linggong ito)\b/.test(value) &&
      /\b(last week|nakaraang linggo)\b/.test(value)
    ) {
      comparisonPeriods = ["week", "last_week"];
    } else if (
      /\b(this month|ngayong buwan|buwang ito)\b/.test(value) &&
      /\b(last month|nakaraang buwan)\b/.test(value)
    ) {
      comparisonPeriods = ["month", "last_month"];
    }
  }

  return {
    intent,
    inputLanguage,
    requestedResponseLanguage: languageInstruction.requestedResponseLanguage,
    returnToAutomaticLanguage: languageInstruction.returnToAutomaticLanguage,
    domain,
    primaryTimeframe: comparisonPeriods[0],
    comparisonTimeframe: comparisonPeriods[1],
    detailLevel: domain ? (details ? "detailed" : "summary") : null,
    confidence: domain || languageInstruction.requestedResponseLanguage ? 0.9 : 0.65,
  };
};

const isConsistent = (value: AIMessageClassification) => {
  if (value.intent === "comparison") {
    return Boolean(
      value.domain &&
        value.primaryTimeframe &&
        value.comparisonTimeframe &&
        value.primaryTimeframe !== value.comparisonTimeframe,
    );
  }
  if (
    value.intent.startsWith("attendance") &&
    value.domain !== "attendance"
  ) return false;
  if (value.intent.startsWith("feeding") && value.domain !== "feeding") {
    return false;
  }
  if (value.intent.startsWith("combined") && value.domain !== "both") {
    return false;
  }
  if (
    value.returnToAutomaticLanguage &&
    value.requestedResponseLanguage !== null
  ) return false;
  return true;
};

export const classifyParentMessage = async (params: {
  message: string;
  context?: Pick<
    AIConversationStateRecord,
    "responseLanguage" | "languageMode" | "activeDomain" | "timeframe" | "pendingAction" | "turns"
  > | null;
}): Promise<{ classification: AIMessageClassification; usedFallback: boolean }> => {
  const fallback = classifyMessageDeterministically(params.message);
  const prompt = `Classify this parent-chat message as JSON only. The bot supports only child attendance and feeding records. Detect English, Filipino, mixed Taglish, or unknown input. A language instruction may coexist with a record intent. Confirmation/rejection only describes the message; the server validates pending state. Never invent a child or facts. Allowed timeframes: today, yesterday, week, last_week, month, last_month, recent. Context: ${JSON.stringify(params.context ?? null)}. Message: ${JSON.stringify(params.message)}`;
  try {
    const raw = await askGemini(prompt, {
      mode: "json",
      temperature: 0,
      maxOutputTokens: 384,
    });
    const parsed = IntentSchema.parse(JSON.parse(raw)) as AIMessageClassification;
    if (!isConsistent(parsed)) throw new Error("Inconsistent classifier output");
    // Clear local language signals are stable and must not be overridden by a
    // model classification. The model remains useful for genuinely ambiguous
    // input and for structured intent extraction.
    parsed.inputLanguage = resolveDetectedInputLanguage(
      parsed.inputLanguage,
      fallback.inputLanguage,
    );
    // Deterministic language directives are security-neutral and more reliable
    // than allowing a model to silently drop an explicit user preference.
    if (fallback.requestedResponseLanguage || fallback.returnToAutomaticLanguage) {
      parsed.requestedResponseLanguage = fallback.requestedResponseLanguage;
      parsed.returnToAutomaticLanguage = fallback.returnToAutomaticLanguage;
      if (!fallback.domain) parsed.intent = "language_preference";
    }
    return { classification: parsed, usedFallback: false };
  } catch {
    return { classification: fallback, usedFallback: true };
  }
};
