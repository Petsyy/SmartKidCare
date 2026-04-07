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

// ---------------------------------------------------------------------------
// Gibberish / keyboard-mash guard
// Rejects inputs where a significant share of tokens look like random keys.
// Applied at every AI entry point so no tool ever processes mash input.
// ---------------------------------------------------------------------------

// Common keyboard-row prefixes that appear in key-mashing (not real words).
const KEYBOARD_MASH_RE =
  /^(qwer|asdf|zxcv|hjkl|uiop|bnmk|asd|qwe|zxc|sdf|wer|xcv|dfg|ert|cvb|fgh|rty|vbn|ghj|tyu|hjk|yui|jkl|uio)/;

function looksLikeKeyboardMash(raw: string): boolean {
  const token = raw.replace(/[^a-z]/g, "").toLowerCase();
  if (token.length < 4) return false;

  if (KEYBOARD_MASH_RE.test(token)) return true;

  // Very low character diversity in a long token is typically random typing.
  const uniqueChars = new Set(token).size;
  if (token.length >= 10 && uniqueChars <= 3) return true;

  // One character dominating most of a token is another mash pattern.
  const counts = new Map<string, number>();
  for (const ch of token) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  const maxCharCount = Math.max(...counts.values());
  if (token.length >= 8 && maxCharCount / token.length >= 0.55) return true;

  // 5+ consecutive consonants are impossible in real English/Tagalog words.
  if (/[^aeiou]{5,}/.test(token)) return true;

  // Repeating 2–3 char pattern covers "asdasdas", "qwqwqw", etc.
  for (let len = 2; len <= 3; len++) {
    const sub = token.slice(0, len);
    const repeated = sub.repeat(Math.floor(token.length / len));
    if (token.startsWith(repeated) && repeated.length >= 4) return true;
  }

  return false;
}

/**
 * Returns true when ≥50 % of the meaningful tokens (length ≥ 3) look like
 * keyboard mashing. A single garbage token alongside one intent keyword is
 * still blocked because the intent keyword alone is not a real question.
 *
 * Examples blocked:  "asdasdas attedance", "asdf attendance", "qwqwqw zxzxzx"
 * Examples allowed:  "attendance", "show feeding today", "How many absences?"
 */
export function inputIsGibberish(text: string): boolean {
  const tokens = text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 3);
  if (tokens.length === 0) return false;
  const mashCount = tokens.filter(looksLikeKeyboardMash).length;
  return mashCount > 0 && mashCount >= Math.ceil(tokens.length * 0.5);
}
