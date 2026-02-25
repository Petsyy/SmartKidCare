const DEFAULT_AI_INPUT_MAX_LENGTH = 500;

// Remove characters that are invisible but can alter parsing or prompt interpretation.
const ZERO_WIDTH_CHARS_REGEX = /[\u200B-\u200D\u2060\uFEFF]/g;
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F-\u009F]/g;
const FULL_SCRIPT_BLOCK_REGEX =
  /<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi;
const SCRIPT_TAG_REGEX = /<\s*\/?\s*script\b[^>]*>/gi;
const HTML_TAG_REGEX = /<\/?[a-z][^>]*>/gi;

export function sanitizeAIMessageInput(
  rawValue: unknown,
  maxLength = DEFAULT_AI_INPUT_MAX_LENGTH,
): string {
  if (typeof rawValue !== "string") return "";

  const safeLimit =
    Number.isFinite(maxLength) && maxLength > 0
      ? Math.floor(maxLength)
      : DEFAULT_AI_INPUT_MAX_LENGTH;

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

export const AI_INPUT_LIMITS = {
  messageMaxLength: DEFAULT_AI_INPUT_MAX_LENGTH,
} as const;
