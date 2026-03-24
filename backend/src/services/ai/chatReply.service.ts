import { AIResponseLanguage } from "./language.service";

type NormalizedRole = "parent";

const GREETING_PATTERN =
  /^(hi|hello|hey|good morning|good afternoon|good evening|kumusta|kamusta|magandang umaga|magandang hapon|magandang gabi)[.!?]*$/;

const ACKNOWLEDGEMENT_PATTERN =
  /^(thanks|thanks a lot|thank you|thank you so much|ty|salamat|salamat po|ok|okay|alright|got it|noted|sige|sige po)[.!?]*$/;

const CONVERSATION_CLOSURE_PATTERN =
  /^(no(?:pe)?\s*(?:,)?\s*(?:thank\s*you|thanks)|not now(?:\s*(?:,)?\s*(?:thank\s*you|thanks))?|hindi na(?:\s*(?:,)?\s*salamat)?|ayoko na(?:\s*(?:,)?\s*salamat)?)\s*[.!?]*$/;

const TRAILING_PUNCTUATION_PATTERN = /[.!?]+$/g;

const SINGLE_TOKEN_AFFIRMATIVES = new Set([
  "yes",
  "y",
  "yeah",
  "yep",
  "sure",
  "ok",
  "okay",
  "oo",
  "opo",
  "sige",
]);

const MULTI_TOKEN_AFFIRMATIVES = new Set([
  "yes please",
  "sure please",
  "go ahead",
  "proceed",
  "sige po",
]);

type RoleReplyTable = Record<
  AIResponseLanguage,
  Record<NormalizedRole, string>
>;

const GREETING_REPLIES: RoleReplyTable = {
  en: {
    parent:
      "Hello! I can help with your child's attendance and feeding records. What would you like to know?",
  },
  tl: {
    parent:
      "Kumusta! Matutulungan kita sa attendance at feeding records ng anak mo. Ano ang gusto mong malaman?",
  },
};

const AFFIRMATIVE_REPLIES: RoleReplyTable = {
  en: {
    parent:
      "Sure. Do you want attendance details, feeding details, or both for your child?",
  },
  tl: {
    parent:
      "Sige. Attendance details, feeding details, o pareho para sa anak mo?",
  },
};

const ACKNOWLEDGEMENT_REPLIES: RoleReplyTable = {
  en: {
    parent:
      "You're welcome. Ask anytime about your child's attendance or feeding.",
  },
  tl: {
    parent:
      "Walang anuman. Magtanong ka lang anumang oras tungkol sa attendance o feeding ng anak mo.",
  },
};

const CLOSURE_REPLIES: RoleReplyTable = {
  en: {
    parent:
      "No problem. Thanks for asking. Ask me anytime about your child's attendance or feeding.",
  },
  tl: {
    parent:
      "Walang problema. Salamat sa pagtatanong. Magtanong ka lang anumang oras tungkol sa attendance o feeding ng anak mo.",
  },
};

const LOW_SIGNAL_REPLIES: RoleReplyTable = {
  en: {
    parent:
      "I can help with attendance or feeding. What would you like to check for your child?",
  },
  tl: {
    parent:
      "Matutulungan kita sa attendance o feeding. Ano ang gusto mong i-check para sa anak mo?",
  },
};

function normalizeMessage(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeRole(role: string): NormalizedRole {
  return "parent";
}

function normalizeLanguage(language: AIResponseLanguage): AIResponseLanguage {
  return language === "tl" ? "tl" : "en";
}

function pickReply(
  table: RoleReplyTable,
  role: string,
  language: AIResponseLanguage,
): string {
  const normalizedRole = normalizeRole(role);
  const normalizedLanguage = normalizeLanguage(language);
  return table[normalizedLanguage][normalizedRole];
}

export function isGreeting(text: string): boolean {
  const normalized = normalizeMessage(text);
  return GREETING_PATTERN.test(normalized);
}

export function isAffirmative(text: string): boolean {
  const normalized = normalizeMessage(text).replace(
    TRAILING_PUNCTUATION_PATTERN,
    "",
  );
  return (
    SINGLE_TOKEN_AFFIRMATIVES.has(normalized) ||
    MULTI_TOKEN_AFFIRMATIVES.has(normalized)
  );
}

export function isAcknowledgement(text: string): boolean {
  const normalized = normalizeMessage(text);
  return ACKNOWLEDGEMENT_PATTERN.test(normalized);
}

export function isConversationClosure(text: string): boolean {
  const normalized = normalizeMessage(text);
  return CONVERSATION_CLOSURE_PATTERN.test(normalized);
}

export function buildGreetingReply(
  role: string,
  language: AIResponseLanguage = "en",
): string {
  return pickReply(GREETING_REPLIES, role, language);
}

export function buildAffirmativeReply(
  role: string,
  language: AIResponseLanguage = "en",
): string {
  return pickReply(AFFIRMATIVE_REPLIES, role, language);
}

export function buildAcknowledgementReply(
  role: string,
  language: AIResponseLanguage = "en",
): string {
  return pickReply(ACKNOWLEDGEMENT_REPLIES, role, language);
}

export function buildConversationClosureReply(
  role: string,
  language: AIResponseLanguage = "en",
): string {
  return pickReply(CLOSURE_REPLIES, role, language);
}

export function buildLowSignalReply(
  role: string,
  language: AIResponseLanguage = "en",
): string {
  return pickReply(LOW_SIGNAL_REPLIES, role, language);
}

// Quota fallback now generic, no summaries.
export function buildQuotaFallbackReply(params: {
  role: string;
  retryAfterSeconds?: number;
  language?: AIResponseLanguage;
}): string {
  const { retryAfterSeconds, language = "en" } = params;
  const retryText = retryAfterSeconds
    ? ` Please try again in about ${retryAfterSeconds} seconds.`
    : " Please try again shortly.";

  if (language === "tl") {
    const retryTextTl = retryAfterSeconds
      ? ` Pakisubukan muli pagkalipas ng humigit-kumulang ${retryAfterSeconds} segundo.`
      : " Pakisubukan muli maya-maya.";

    return `Pansamantalang na-rate limit ang AI.${retryTextTl} Maaari ka pa ring magtanong tungkol sa attendance o feeding ng anak mo kapag reset na ang limit.`;
  }

  return `AI is temporarily rate-limited.${retryText} You can still ask about your child's attendance or feeding once the limit resets.`;
}
