export const AI_INPUT_LIMITS = {
  messageMaxLength: 500,
} as const;

const ZERO_WIDTH_CHARS_REGEX = /[\u200B-\u200D\u2060\uFEFF]/g;
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F-\u009F]/g;
const FULL_SCRIPT_BLOCK_REGEX =
  /<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi;
const SCRIPT_TAG_REGEX = /<\s*\/?\s*script\b[^>]*>/gi;
const HTML_TAG_REGEX = /<\/?[a-z][^>]*>/gi;

export function sanitizeAIMessageInput(
  rawValue: unknown,
  maxLength = AI_INPUT_LIMITS.messageMaxLength,
): string {
  if (typeof rawValue !== "string") return "";

  const safeLimit =
    Number.isFinite(maxLength) && maxLength > 0
      ? Math.floor(maxLength)
      : AI_INPUT_LIMITS.messageMaxLength;

  return rawValue
    .normalize("NFKC")
    .replace(FULL_SCRIPT_BLOCK_REGEX, " ")
    .replace(SCRIPT_TAG_REGEX, " ")
    .replace(HTML_TAG_REGEX, " ")
    .replace(ZERO_WIDTH_CHARS_REGEX, "")
    .replace(CONTROL_CHARS_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, safeLimit);
}

export function sanitizeAIChildId(rawValue: unknown): string | undefined {
  if (typeof rawValue !== "string") return undefined;
  const trimmed = rawValue.trim();
  if (!trimmed) return undefined;

  return /^[a-f0-9]{24}$/i.test(trimmed) ? trimmed : undefined;
}
