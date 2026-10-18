import test from "node:test";
import assert from "node:assert/strict";

import { getDateRange } from "../src/modules/ai/services/agents/agent-tools.service";
import { writeToolNarrative } from "../src/modules/ai/services/generators/ai-writer.service";
import {
  classifyMessageDeterministically,
  detectInputLanguage,
  resolveDetectedInputLanguage,
} from "../src/modules/ai/services/core/ai-intent-classifier.service";
import { resolveResponseLanguage } from "../src/modules/ai/services/core/ai-chat.service";
import type { AIConversationStateRecord } from "../src/modules/ai/types/core-ai-chat.types";

const context = (overrides: Partial<AIConversationStateRecord> = {}) =>
  ({
    _id: "context",
    parent: "parent",
    child: "child",
    contextId: "550e8400-e29b-41d4-a716-446655440000",
    responseLanguage: "en",
    languageMode: "auto",
    activeDomain: null,
    timeframe: null,
    detailLevel: null,
    lastIntent: null,
    pendingAction: null,
    turns: [],
    generation: 0,
    version: 0,
    expiresAt: new Date(Date.now() + 60_000),
    invalidatedAt: null,
    ...overrides,
  }) as AIConversationStateRecord;

test("input-language rules distinguish English, Filipino, Taglish, and ambiguous replies", () => {
  assert.equal(detectInputLanguage("Was my child present today?"), "en");
  assert.equal(detectInputLanguage("Pumasok ba ang anak ko ngayon?"), "fil");
  assert.equal(detectInputLanguage("Show attendance ng anak ko ngayon"), "mixed");
  assert.equal(
    detectInputLanguage("Ano ang kinain ng anak ko ngayong linggo?"),
    "fil",
  );
  assert.equal(detectInputLanguage("yes"), "unknown");
  assert.equal(detectInputLanguage("oo"), "unknown");
  assert.equal(detectInputLanguage("attendance"), "unknown");
});

test("clear deterministic language overrides an incorrect model language", () => {
  assert.equal(resolveDetectedInputLanguage("en", "fil"), "fil");
  assert.equal(resolveDetectedInputLanguage("en", "mixed"), "mixed");
  assert.equal(resolveDetectedInputLanguage("fil", "unknown"), "fil");
});

test("explicit language instructions coexist with record intents", () => {
  const combined = classifyMessageDeterministically(
    "Sagutin mo sa Filipino. Was my child present today?",
  );
  assert.equal(combined.requestedResponseLanguage, "fil");
  assert.equal(combined.intent, "attendance_summary");
  assert.equal(combined.domain, "attendance");

  const automatic = classifyMessageDeterministically(
    "Automatically follow my language",
  );
  assert.equal(automatic.intent, "language_preference");
  assert.equal(automatic.returnToAutomaticLanguage, true);
});

test("automatic uncertainty preserves context while clear fallback language is used", () => {
  const ambiguous = classifyMessageDeterministically("oo");
  const retained = resolveResponseLanguage({
    context: context({ responseLanguage: "fil" }),
    classification: ambiguous,
    classifierUsedFallback: false,
    submittedMode: "auto",
  });
  assert.deepEqual(retained, { language: "fil", mode: "auto" });

  const filipino = classifyMessageDeterministically(
    "Pumasok ba ang anak ko ngayon?",
  );
  const fallback = resolveResponseLanguage({
    context: context({ responseLanguage: "en" }),
    classification: filipino,
    classifierUsedFallback: true,
    submittedMode: "auto",
  });
  assert.deepEqual(fallback, { language: "fil", mode: "auto" });
});

test("the reported Filipino feeding question resolves to a Filipino reply", () => {
  const filipinoQuestion = classifyMessageDeterministically(
    "Ano ang kinain ng anak ko ngayong linggo?",
  );
  const resolved = resolveResponseLanguage({
    context: context({ responseLanguage: "en" }),
    classification: filipinoQuestion,
    classifierUsedFallback: true,
    submittedMode: "auto",
  });
  assert.deepEqual(resolved, { language: "fil", mode: "auto" });
});

test("stored explicit language is not erased by repeated auto request values", () => {
  const englishQuestion = classifyMessageDeterministically(
    "Was my child present today?",
  );
  const resolved = resolveResponseLanguage({
    context: context({ responseLanguage: "fil", languageMode: "explicit" }),
    classification: englishQuestion,
    classifierUsedFallback: false,
    submittedMode: "auto",
  });
  assert.deepEqual(resolved, { language: "fil", mode: "explicit" });
});

test("supported comparisons carry both periods", () => {
  const classified = classifyMessageDeterministically(
    "Compare attendance this week versus last week",
  );
  assert.equal(classified.intent, "comparison");
  assert.equal(classified.primaryTimeframe, "week");
  assert.equal(classified.comparisonTimeframe, "last_week");
});

test("Filipino deterministic replies preserve risk metadata", async () => {
  const previousMode = process.env.AI_WRITER_MODE;
  process.env.AI_WRITER_MODE = "direct";
  try {
    const result = await writeToolNarrative({
      result: {
        tool: "summarize_attendance",
        timeframe: "today",
        present: 0,
        totalDays: 1,
        attendanceRate: 0,
      },
      role: "parent",
      question: "Pumasok ba ang anak ko ngayon?",
      language: "fil",
      conversationId: `language-${Date.now()}`,
    });
    assert.equal(result.riskLevel, "HIGH");
    assert.match(result.reply, /iyong anak/i);
    assert.match(result.reply, /Antas ng Panganib: HIGH/i);
  } finally {
    if (previousMode === undefined) delete process.env.AI_WRITER_MODE;
    else process.env.AI_WRITER_MODE = previousMode;
  }
});

test("yesterday uses inclusive Manila start and exclusive next-day boundary", async () => {
  const range = await getDateRange(
    "yesterday",
    new Date("2026-01-01T04:00:00.000Z"),
  );
  assert.equal(range.start.toISOString(), "2025-12-30T16:00:00.000Z");
  assert.equal(range.endExclusive.toISOString(), "2025-12-31T16:00:00.000Z");
});

test("last month handles year-end and leap-year transitions", async () => {
  const yearEnd = await getDateRange(
    "last_month",
    new Date("2026-01-01T04:00:00.000Z"),
  );
  assert.equal(yearEnd.start.toISOString(), "2025-11-30T16:00:00.000Z");
  assert.equal(yearEnd.endExclusive.toISOString(), "2025-12-31T16:00:00.000Z");

  const leapYear = await getDateRange(
    "last_month",
    new Date("2024-03-15T04:00:00.000Z"),
  );
  assert.equal(leapYear.start.toISOString(), "2024-01-31T16:00:00.000Z");
  assert.equal(leapYear.endExclusive.toISOString(), "2024-02-29T16:00:00.000Z");
});
