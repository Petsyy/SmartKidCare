import { AIResponseLanguage } from "./language.service";

type NormalizedRole = "parent" | "teacher" | "admin";

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
    teacher:
      "Hello! I can help with attendance and feeding summaries. What would you like to check?",
    admin:
      "Hello! I can help with attendance, feeding, and system verification insights. What would you like to check?",
  },
  tl: {
    parent:
      "Kumusta! Matutulungan kita sa attendance at feeding records ng anak mo. Ano ang gusto mong malaman?",
    teacher:
      "Kumusta! Matutulungan kita sa buod ng attendance at feeding. Ano ang gusto mong i-check?",
    admin:
      "Kumusta! Matutulungan kita sa attendance, feeding, at verification insights. Ano ang gusto mong i-check?",
  },
};

const AFFIRMATIVE_REPLIES: RoleReplyTable = {
  en: {
    parent:
      "Sure. Do you want attendance details, feeding details, or both for your child?",
    teacher: "Sure. Do you want attendance, feeding, or both?",
    admin: "Sure. Do you want attendance, feeding, or verification insights?",
  },
  tl: {
    parent:
      "Sige. Attendance details, feeding details, o pareho para sa anak mo?",
    teacher: "Sige. Attendance, feeding, o pareho ba ang gusto mong makita?",
    admin:
      "Sige. Attendance, feeding, o verification insights ang gusto mong makita?",
  },
};

const ACKNOWLEDGEMENT_REPLIES: RoleReplyTable = {
  en: {
    parent:
      "You're welcome. Ask anytime about your child's attendance or feeding.",
    teacher: "You're welcome. Ask anytime about attendance or feeding records.",
    admin:
      "You're welcome. Ask anytime about attendance, feeding, or verification.",
  },
  tl: {
    parent:
      "Walang anuman. Magtanong ka lang anumang oras tungkol sa attendance o feeding ng anak mo.",
    teacher:
      "Walang anuman. Magtanong ka lang anumang oras tungkol sa attendance o feeding records.",
    admin:
      "Walang anuman. Magtanong ka lang anumang oras tungkol sa attendance, feeding, o verification.",
  },
};

const CLOSURE_REPLIES: RoleReplyTable = {
  en: {
    parent:
      "No problem. Thanks for asking. Ask me anytime about your child's attendance or feeding.",
    teacher:
      "No problem. Thanks for asking. Ask me anytime about attendance or feeding records.",
    admin:
      "No problem. Thanks for asking. Ask me anytime about attendance, feeding, or verification insights.",
  },
  tl: {
    parent:
      "Walang problema. Salamat sa pagtatanong. Magtanong ka lang anumang oras tungkol sa attendance o feeding ng anak mo.",
    teacher:
      "Walang problema. Salamat sa pagtatanong. Magtanong ka lang anumang oras tungkol sa attendance o feeding records.",
    admin:
      "Walang problema. Salamat sa pagtatanong. Magtanong ka lang anumang oras tungkol sa attendance, feeding, o verification insights.",
  },
};

const LOW_SIGNAL_REPLIES: RoleReplyTable = {
  en: {
    parent:
      "I can help with attendance or feeding. What would you like to check for your child?",
    teacher:
      "I can help with attendance or feeding summaries. What would you like to check?",
    admin:
      "I can help with attendance, feeding, or verification insights. What would you like to check?",
  },
  tl: {
    parent:
      "Matutulungan kita sa attendance o feeding. Ano ang gusto mong i-check para sa anak mo?",
    teacher:
      "Matutulungan kita sa buod ng attendance o feeding. Ano ang gusto mong i-check?",
    admin:
      "Matutulungan kita sa attendance, feeding, o verification insights. Ano ang gusto mong i-check?",
  },
};

function normalizeMessage(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeRole(role: string): NormalizedRole {
  const normalized = String(role).trim().toLowerCase();
  if (normalized === "parent") return "parent";
  if (normalized === "teacher") return "teacher";
  return "admin";
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
  const { role, retryAfterSeconds, language = "en" } = params;
  const normalizedRole = normalizeRole(role);
  const retryText = retryAfterSeconds
    ? ` Please try again in about ${retryAfterSeconds} seconds.`
    : " Please try again shortly.";

  if (language === "tl") {
    const retryTextTl = retryAfterSeconds
      ? ` Pakisubukan muli pagkalipas ng humigit-kumulang ${retryAfterSeconds} segundo.`
      : " Pakisubukan muli maya-maya.";

    if (normalizedRole === "parent") {
      return `Pansamantalang na-rate limit ang AI.${retryTextTl} Maaari ka pa ring magtanong tungkol sa attendance o feeding ng anak mo kapag reset na ang limit.`;
    }
    return `Pansamantalang na-rate limit ang AI.${retryTextTl} Pakisubukang muli ang tanong mo tungkol sa attendance/feeding.`;
  }

  if (normalizedRole === "parent") {
    return `AI is temporarily rate-limited.${retryText} You can still ask about your child's attendance or feeding once the limit resets.`;
  }

  return `AI is temporarily rate-limited.${retryText} Please retry your attendance/feeding question soon.`;
}
