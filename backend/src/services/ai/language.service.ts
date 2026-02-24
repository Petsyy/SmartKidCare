export type AIResponseLanguage = "en" | "tl";

const TAGALOG_MARKERS = [
  "ang",
  "mga",
  "para",
  "sa",
  "ng",
  "na",
  "at",
  "po",
  "opo",
  "oo",
  "sige",
  "salamat",
  "kamusta",
  "kumusta",
  "ngayon",
  "linggo",
  "anak",
  "bata",
  "pagkain",
  "kain",
  "kumain",
  "pasok",
  "pagdalo",
  "pagliban",
];

function normalizeMessage(input: string): string {
  return ` ${input.toLowerCase().replace(/\s+/g, " ").trim()} `;
}

function tokenizeMessage(input: string): Set<string> {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return new Set<string>();
  return new Set(cleaned.split(" "));
}

export function detectResponseLanguage(input: string): AIResponseLanguage {
  const normalized = normalizeMessage(input);
  const tokens = tokenizeMessage(input);

  const markerHits = TAGALOG_MARKERS.reduce((count, marker) => {
    return tokens.has(marker) ? count + 1 : count;
  }, 0);

  const hasTagalogQuestionPattern =
    /\b(ano|alin|bakit|paano|sino|ilan|gaano)\b/.test(normalized) &&
    /\b(ang|sa|ng|mo|ko|natin|namin|nila)\b/.test(normalized);

  if (markerHits >= 2 || hasTagalogQuestionPattern) {
    return "tl";
  }

  return "en";
}
