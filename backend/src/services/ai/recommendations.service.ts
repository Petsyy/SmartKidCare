import {
  GenerateChildReportResult,
  SummarizeAttendanceResult,
  SummarizeFeedingResult,
} from "./mongoAgentTools.service";
import { askGemini } from "./gemini.service";
import { AIResponseLanguage } from "./language.service";
import {
  ChildReportInsight,
  InsightBlock,
  analyzeAttendanceInsight,
  analyzeFeedingInsight,
} from "./insights.service";

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

const DEFAULT_RECOMMENDATION_TIMEOUT_MS = 1500;

function isAIRecommendationsEnabled(): boolean {
  const normalized = String(process.env.AI_RECOMMENDATIONS_ENABLED ?? "")
    .trim()
    .toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

function recommendationTimeoutMs(): number {
  const parsed = Number(process.env.AI_RECOMMENDATIONS_TIMEOUT_MS ?? "");
  if (!Number.isFinite(parsed) || parsed < 100) {
    return DEFAULT_RECOMMENDATION_TIMEOUT_MS;
  }
  return Math.floor(parsed);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error("recommendation_generation_timeout"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutHandle);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutHandle);
        reject(error);
      });
  });
}

type RecommendationDomain = "attendance" | "feeding";

type RecommendationDirective = {
  readonly key: string;
  readonly goal: string;
  readonly fallbackEn: string;
  readonly fallbackTl: string;
};

const RECOMMENDATION_LIBRARY = {
  attendance_record_daily: {
    key: "attendance_record_daily",
    goal: "Encourage daily attendance logging so trend analysis stays reliable.",
    fallbackEn:
      "Try recording attendance daily so we can generate reliable insights.",
    fallbackTl:
      "Subukang i-record araw-araw ang attendance para makabuo tayo ng mas maaasahang insights.",
  },
  attendance_review_barriers: {
    key: "attendance_review_barriers",
    goal:
      "Recommend reviewing morning routines and practical barriers that may cause absences.",
    fallbackEn:
      "Review morning routines and possible barriers that may affect attendance.",
    fallbackTl:
      "Mainam na suriin ang morning routine at mga posibleng hadlang na nakaaapekto sa attendance.",
  },
  attendance_track_absences: {
    key: "attendance_track_absences",
    goal:
      "Recommend tracking repeated absence dates and following up on patterns.",
    fallbackEn:
      "Track absence patterns and follow up on repeated absence days.",
    fallbackTl:
      "Subaybayan ang pattern ng pagliban at mag-follow up sa mga paulit-ulit na araw ng absent.",
  },
  attendance_excellent: {
    key: "attendance_excellent",
    goal:
      "Recognize excellent attendance and encourage maintaining current routines.",
    fallbackEn:
      "Excellent attendance performance. Overall, attendance is stable and well maintained.",
    fallbackTl:
      "Napakahusay ng attendance performance. Magpatuloy sa kasalukuyang routine para mapanatili ito.",
  },
  attendance_good: {
    key: "attendance_good",
    goal: "Acknowledge strong attendance and suggest maintaining consistency.",
    fallbackEn: "Overall, attendance remains strong and well maintained.",
    fallbackTl: "Maganda ang attendance. Panatilihin ang konsistent na pagpasok.",
  },
  attendance_watch: {
    key: "attendance_watch",
    goal:
      "Suggest closer attendance monitoring and early support planning for the coming days.",
    fallbackEn: "Attendance may need closer monitoring in the coming days.",
    fallbackTl:
      "Maaaring kailangan ng mas malapit na pag-monitor ng attendance sa mga susunod na araw.",
  },
  attendance_support_consistency: {
    key: "attendance_support_consistency",
    goal: "Encourage continuing daily routines that support consistent attendance.",
    fallbackEn: "Continue encouraging consistent attendance this week.",
    fallbackTl:
      "Ipagpatuloy ang mga routine na sumusuporta sa konsistent na attendance ngayong linggo.",
  },
  feeding_record_daily: {
    key: "feeding_record_daily",
    goal: "Encourage daily feeding status logging so trend analysis stays reliable.",
    fallbackEn:
      "Try recording feeding status daily so we can generate reliable insights.",
    fallbackTl:
      "Subukang i-record araw-araw ang feeding status para makabuo tayo ng mas maaasahang insights.",
  },
  feeding_monitor_completion: {
    key: "feeding_monitor_completion",
    goal:
      "Recommend closer meal-completion monitoring and coordination with the daycare center for missed meals.",
    fallbackEn:
      "Monitor meal completion closely and coordinate with the daycare center on missed meals.",
    fallbackTl:
      "Mainam na bantayan nang mas malapitan ang meal completion at makipag-ugnayan sa daycare center tungkol sa missed meals.",
  },
  feeding_review_patterns: {
    key: "feeding_review_patterns",
    goal: "Recommend reviewing recurring missed-meal days for appetite patterns.",
    fallbackEn:
      "Review recurring missed-meal days for possible appetite patterns.",
    fallbackTl:
      "Suriin ang mga paulit-ulit na missed-meal days para makita ang posibleng appetite patterns.",
  },
  feeding_expand_variety: {
    key: "feeding_expand_variety",
    goal: "Suggest adding more food variety across the week when variety is low.",
    fallbackEn: "Consider adding more meal variety across the week.",
    fallbackTl: "Mainam na dagdagan ang meal variety sa loob ng linggo.",
  },
  feeding_excellent: {
    key: "feeding_excellent",
    goal:
      "Recognize excellent feeding consistency and encourage maintaining current routines.",
    fallbackEn:
      "Excellent feeding consistency. Overall, feeding habits are stable and well maintained.",
    fallbackTl:
      "Napakahusay ng feeding consistency. Ipagpatuloy ang kasalukuyang routine.",
  },
  feeding_good: {
    key: "feeding_good",
    goal: "Acknowledge strong feeding consistency and suggest maintaining routines.",
    fallbackEn: "Overall, feeding consistency remains strong.",
    fallbackTl: "Maganda ang feeding consistency. Panatilihin ang kasalukuyang routine.",
  },
  feeding_watch: {
    key: "feeding_watch",
    goal:
      "Suggest closer feeding monitoring and practical support for upcoming days.",
    fallbackEn:
      "Feeding consistency may need closer monitoring in the coming days.",
    fallbackTl:
      "Maaaring kailangan ng mas malapit na pag-monitor ng feeding consistency sa mga susunod na araw.",
  },
  feeding_support_consistency: {
    key: "feeding_support_consistency",
    goal: "Encourage continuing daily routines that support consistent feeding.",
    fallbackEn: "Continue supporting consistent feeding this week.",
    fallbackTl:
      "Ipagpatuloy ang mga routine na sumusuporta sa konsistent na feeding ngayong linggo.",
  },
} as const satisfies Record<string, RecommendationDirective>;

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function extractFirstJsonObject(text: string): string | null {
  const source = stripFences(text);
  const start = source.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      depth += 1;
      continue;
    }

    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return null;
}

function uniqueDirectives(
  directives: RecommendationDirective[],
): RecommendationDirective[] {
  const seen = new Set<string>();
  return directives.filter((directive) => {
    if (seen.has(directive.key)) return false;
    seen.add(directive.key);
    return true;
  });
}

function normalizeRecommendation(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/^[\d\s\-.)]+/, "")
    .trim();
}

function parseAIRecommendations(rawText: string): string[] | null {
  const direct = stripFences(rawText);
  const candidates = [direct, extractFirstJsonObject(rawText)].filter(
    (item): item is string => Boolean(item),
  );

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as { recommendations?: unknown };
      if (!Array.isArray(parsed.recommendations)) continue;

      const cleaned = parsed.recommendations
        .map((entry) =>
          typeof entry === "string" ? normalizeRecommendation(entry) : "",
        )
        .filter(Boolean);

      if (cleaned.length) return cleaned;
    } catch {
      // no-op
    }
  }

  return null;
}

function buildRecommendationPrompt(params: {
  domain: RecommendationDomain;
  language: AIResponseLanguage;
  insight: InsightBlock;
  metrics: string;
  directives: RecommendationDirective[];
}): string {
  const { domain, language, insight, metrics, directives } = params;
  const directiveLines = directives
    .map((directive, index) => `${index + 1}. ${directive.goal}`)
    .join("\n");

  return `
You write recommendation wording for SmartKidCare.
Return ONLY one valid JSON object with this exact shape:
{"recommendations":["sentence 1","sentence 2"]}

Rules:
- Output exactly ${directives.length} recommendation sentence(s), in the same order as the goals.
- Use ${language === "tl" ? "Tagalog" : "English"}.
- Keep each recommendation to one concise sentence.
- Use plain text only, no markdown and no numbering.
- Be practical and supportive for parents.
- Do not invent facts, counts, dates, or outcomes.

Context:
- Domain: ${domain}
- Insight level: ${insight.level}
- Risk flags: ${insight.riskFlags.join(", ") || "none"}
- Metrics: ${metrics}
- Recommendation goals:
${directiveLines}
`.trim();
}

function directiveFallback(
  directive: RecommendationDirective,
  language: AIResponseLanguage,
): string {
  return language === "tl" ? directive.fallbackTl : directive.fallbackEn;
}

async function generateRecommendationWording(params: {
  domain: RecommendationDomain;
  language: AIResponseLanguage;
  insight: InsightBlock;
  metrics: string;
  directives: RecommendationDirective[];
  deterministic?: boolean;
}): Promise<string[]> {
  const { domain, language, insight, metrics, deterministic = false } = params;
  const directives = uniqueDirectives(params.directives);
  if (!directives.length) return [];

  const fallbackRecommendations = directives.map((directive) =>
    directiveFallback(directive, language),
  );
  if (deterministic || !isAIRecommendationsEnabled()) {
    return unique(fallbackRecommendations);
  }

  const prompt = buildRecommendationPrompt({
    domain,
    language,
    insight,
    metrics,
    directives,
  });

  try {
    const raw = await withTimeout(
      askGemini(prompt, { mode: "json" }),
      recommendationTimeoutMs(),
    );
    const aiRecommendations = parseAIRecommendations(raw);
    if (!aiRecommendations?.length) return unique(fallbackRecommendations);

    const stitched = directives.map((directive, index) => {
      const generated = aiRecommendations[index] ?? "";
      return generated || directiveFallback(directive, language);
    });

    return unique(stitched);
  } catch {
    return unique(fallbackRecommendations);
  }
}

export async function recommendForAttendance(
  result: SummarizeAttendanceResult,
  insight?: InsightBlock,
  language: AIResponseLanguage = "en",
  options?: { deterministic?: boolean },
): Promise<string[]> {
  const evaluated = insight ?? analyzeAttendanceInsight(result);
  const directives: RecommendationDirective[] = [];
  const metrics = `timeframe=${result.timeframe}, present=${result.present}, absent=${result.absent}, totalDays=${result.totalDays}, attendanceRate=${result.attendanceRate}`;

  if (result.totalDays === 0) {
    directives.push(RECOMMENDATION_LIBRARY.attendance_record_daily);
    return generateRecommendationWording({
      domain: "attendance",
      language,
      insight: evaluated,
      metrics,
      directives,
      deterministic: options?.deterministic,
    });
  }

  if (evaluated.riskFlags.includes("low_attendance_rate")) {
    directives.push(RECOMMENDATION_LIBRARY.attendance_review_barriers);
  }
  if (evaluated.riskFlags.includes("repeated_absence")) {
    directives.push(RECOMMENDATION_LIBRARY.attendance_track_absences);
  }

  if (!directives.length && result.attendanceRate >= 95) {
    directives.push(RECOMMENDATION_LIBRARY.attendance_excellent);
  } else if (!directives.length && result.attendanceRate >= 85) {
    directives.push(RECOMMENDATION_LIBRARY.attendance_good);
  } else if (!directives.length && result.attendanceRate < 80) {
    directives.push(RECOMMENDATION_LIBRARY.attendance_watch);
  } else if (!directives.length) {
    directives.push(RECOMMENDATION_LIBRARY.attendance_support_consistency);
  }

  return generateRecommendationWording({
    domain: "attendance",
    language,
    insight: evaluated,
    metrics,
    directives,
    deterministic: options?.deterministic,
  });
}

export async function recommendForFeeding(
  result: SummarizeFeedingResult,
  insight?: InsightBlock,
  language: AIResponseLanguage = "en",
  options?: { deterministic?: boolean },
): Promise<string[]> {
  const evaluated = insight ?? analyzeFeedingInsight(result);
  const directives: RecommendationDirective[] = [];
  const metrics = `timeframe=${result.timeframe}, completed=${result.completed}, missed=${result.missed}, totalMeals=${result.totalMeals}, feedingRate=${result.feedingRate}, foods=${result.foods.join("|") || "none"}`;

  if (result.totalMeals === 0) {
    directives.push(RECOMMENDATION_LIBRARY.feeding_record_daily);
    return generateRecommendationWording({
      domain: "feeding",
      language,
      insight: evaluated,
      metrics,
      directives,
      deterministic: options?.deterministic,
    });
  }

  if (evaluated.riskFlags.includes("low_feeding_rate")) {
    directives.push(RECOMMENDATION_LIBRARY.feeding_monitor_completion);
  }
  if (evaluated.riskFlags.includes("repeated_missed_meals")) {
    directives.push(RECOMMENDATION_LIBRARY.feeding_review_patterns);
  }
  if (result.totalMeals >= 5 && result.foods.length <= 2) {
    directives.push(RECOMMENDATION_LIBRARY.feeding_expand_variety);
  }

  if (!directives.length && result.feedingRate >= 95) {
    directives.push(RECOMMENDATION_LIBRARY.feeding_excellent);
  } else if (!directives.length && result.feedingRate >= 85) {
    directives.push(RECOMMENDATION_LIBRARY.feeding_good);
  } else if (!directives.length && result.feedingRate < 80) {
    directives.push(RECOMMENDATION_LIBRARY.feeding_watch);
  } else if (!directives.length) {
    directives.push(RECOMMENDATION_LIBRARY.feeding_support_consistency);
  }

  return generateRecommendationWording({
    domain: "feeding",
    language,
    insight: evaluated,
    metrics,
    directives,
    deterministic: options?.deterministic,
  });
}

export async function recommendForChildReport(
  result: GenerateChildReportResult,
  insight: ChildReportInsight,
  language: AIResponseLanguage = "en",
  options?: { deterministic?: boolean },
): Promise<string[]> {
  const [attendanceRecommendations, feedingRecommendations] = await Promise.all([
    recommendForAttendance(result.attendance, insight.attendance, language, {
      deterministic: options?.deterministic,
    }),
    recommendForFeeding(result.feeding, insight.feeding, language, {
      deterministic: options?.deterministic,
    }),
  ]);

  return unique([...attendanceRecommendations, ...feedingRecommendations]);
}
