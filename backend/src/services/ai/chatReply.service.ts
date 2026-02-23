export function isGreeting(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return /^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(
    normalized,
  );
}

export function isAffirmative(text: string): boolean {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "");

  const singleTokenAffirmatives = new Set([
    "yes",
    "y",
    "yeah",
    "yep",
    "sure",
    "ok",
    "okay",
  ]);

  return (
    singleTokenAffirmatives.has(normalized) ||
    normalized === "yes please" ||
    normalized === "sure please" ||
    normalized === "go ahead" ||
    normalized === "proceed"
  );
}

export function isAcknowledgement(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    /\b(thanks|thank you|ty|nice|great|awesome|cool)\b/.test(normalized) ||
    /^(ok|okay|alright)[.!]?$/.test(normalized)
  );
}

export function buildGreetingReply(role: string): string {
  if (role === "teacher") {
    return "Hello! I can help with attendance and feeding summaries. What would you like to check?";
  }
  if (role === "parent") {
    return "Hello! I can help with your child's attendance and feeding records. What would you like to know?";
  }
  return "Hello! I can help with attendance, feeding, and system verification insights. What would you like to check?";
}

export function buildAffirmativeReply(role: string): string {
  if (role === "teacher") {
    return "Sure. Do you want attendance, feeding, or both?";
  }
  if (role === "parent") {
    return "Sure. Do you want attendance details, feeding details, or both for your child?";
  }
  return "Sure. Do you want attendance, feeding, or verification insights?";
}

export function buildAcknowledgementReply(role: string): string {
  if (role === "parent") {
    return "You're welcome. Ask anytime about your child's attendance or feeding.";
  }
  if (role === "teacher") {
    return "You're welcome. Ask anytime about attendance or feeding records.";
  }
  return "You're welcome. Ask anytime about attendance, feeding, or verification.";
}

// Quota fallback now generic, no summaries.
export function buildQuotaFallbackReply(params: {
  role: string;
  retryAfterSeconds?: number;
}): string {
  const { role, retryAfterSeconds } = params;
  const retryText = retryAfterSeconds
    ? ` Please try again in about ${retryAfterSeconds} seconds.`
    : " Please try again shortly.";

  if (role === "parent") {
    return `AI is temporarily rate-limited.${retryText} You can still ask about your child's attendance or feeding once the limit resets.`;
  }

  return `AI is temporarily rate-limited.${retryText} Please retry your attendance/feeding question soon.`;
}
