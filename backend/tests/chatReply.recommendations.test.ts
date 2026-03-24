import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldUseAIAgent } from "../src/services/ai/agent.service";
import {
  buildAcknowledgementReply,
  buildConversationClosureReply,
  buildGreetingReply,
  buildQuotaFallbackReply,
  isAcknowledgement,
  isConversationClosure,
  isGreeting,
} from "../src/services/ai/chatReply.service";
import {
  SummarizeAttendanceResult,
  SummarizeFeedingResult,
} from "../src/services/ai/mongoAgentTools.service";
import {
  recommendForAttendance,
  recommendForFeeding,
} from "../src/services/ai/recommendations.service";

const geminiService = require("../src/services/ai/gemini.service") as {
  askGemini: (prompt: string) => Promise<string>;
};

function makeAttendanceResult(
  overrides: Partial<SummarizeAttendanceResult>,
): SummarizeAttendanceResult {
  return {
    tool: "summarize_attendance",
    timeframe: "week",
    present: 0,
    absent: 0,
    totalDays: 0,
    attendanceRate: 0,
    absentDates: [],
    ...overrides,
  };
}

function makeFeedingResult(
  overrides: Partial<SummarizeFeedingResult>,
): SummarizeFeedingResult {
  return {
    tool: "summarize_feeding",
    timeframe: "week",
    completed: 0,
    missed: 0,
    totalMeals: 0,
    feedingRate: 0,
    foods: [],
    ...overrides,
  };
}

test("greeting/acknowledgement detection does not swallow mixed intent", () => {
  assert.equal(isGreeting("Hi"), true);
  assert.equal(isGreeting("Hi, show attendance this week."), false);
  assert.equal(isAcknowledgement("Thanks!"), true);
  assert.equal(isAcknowledgement("Thanks, show feeding today."), false);
  assert.equal(shouldUseAIAgent("Hi, show attendance this week."), true);
});

test("reply builders normalize role casing", () => {
  assert.equal(
    buildGreetingReply("Parent", "en"),
    "Hello! I can help with your child's attendance and feeding records. What would you like to know?",
  );
  assert.equal(
    buildGreetingReply("unknown-role", "en"),
    "Hello! I can help with your child's attendance and feeding records. What would you like to know?",
  );
  assert.equal(
    buildAcknowledgementReply("unknown-role", "en"),
    "You're welcome. Ask anytime about your child's attendance or feeding.",
  );
  assert.match(
    buildQuotaFallbackReply({ role: "PaReNt", language: "en" }),
    /your child's attendance or feeding/i,
  );
});

test("conversation closure handles no-thanks variants", () => {
  assert.equal(isConversationClosure("No, thank you!"), true);
  assert.equal(isConversationClosure("No thanks"), true);
  assert.equal(isConversationClosure("hindi na, salamat"), true);
  assert.equal(isConversationClosure("Not now, thanks."), true);
  assert.equal(isConversationClosure("No, show attendance"), false);

  assert.match(
    buildConversationClosureReply("PARENT", "en"),
    /ask me anytime/i,
  );
});

test("recommendations default to deterministic fallback when AI is disabled", async () => {
  const originalAskGemini = geminiService.askGemini;
  const originalEnabled = process.env.AI_RECOMMENDATIONS_ENABLED;

  try {
    let called = false;
    process.env.AI_RECOMMENDATIONS_ENABLED = "false";
    geminiService.askGemini = async () => {
      called = true;
      return '{"recommendations":["Generated"]}';
    };

    const recommendations = await recommendForAttendance(
      makeAttendanceResult({
        present: 10,
        absent: 0,
        totalDays: 10,
        attendanceRate: 100,
      }),
      undefined,
      "en",
    );

    assert.equal(called, false);
    assert.deepEqual(recommendations, [
      "Excellent attendance performance. Overall, attendance is stable and well maintained.",
    ]);
  } finally {
    geminiService.askGemini = originalAskGemini;
    if (originalEnabled === undefined) {
      delete process.env.AI_RECOMMENDATIONS_ENABLED;
    } else {
      process.env.AI_RECOMMENDATIONS_ENABLED = originalEnabled;
    }
  }
});

test("recommendations fall back when AI call throws", async () => {
  const originalAskGemini = geminiService.askGemini;
  const originalEnabled = process.env.AI_RECOMMENDATIONS_ENABLED;

  try {
    process.env.AI_RECOMMENDATIONS_ENABLED = "true";
    geminiService.askGemini = async () => {
      throw new Error("simulated_ai_failure");
    };

    const recommendations = await recommendForAttendance(
      makeAttendanceResult({
        present: 1,
        absent: 3,
        totalDays: 4,
        attendanceRate: 25,
        absentDates: ["2026-02-01", "2026-02-05", "2026-02-07"],
      }),
      undefined,
      "en",
    );

    assert.deepEqual(recommendations, [
      "Review morning routines and possible barriers that may affect attendance.",
      "Track absence patterns and follow up on repeated absence days.",
    ]);
  } finally {
    geminiService.askGemini = originalAskGemini;
    if (originalEnabled === undefined) {
      delete process.env.AI_RECOMMENDATIONS_ENABLED;
    } else {
      process.env.AI_RECOMMENDATIONS_ENABLED = originalEnabled;
    }
  }
});

test("recommendations fall back quickly on timeout", async () => {
  const originalAskGemini = geminiService.askGemini;
  const originalEnabled = process.env.AI_RECOMMENDATIONS_ENABLED;
  const originalTimeout = process.env.AI_RECOMMENDATIONS_TIMEOUT_MS;

  try {
    process.env.AI_RECOMMENDATIONS_ENABLED = "true";
    process.env.AI_RECOMMENDATIONS_TIMEOUT_MS = "120";
    geminiService.askGemini = async () => {
      return new Promise<string>(() => {
        // Intentionally unresolved to trigger timeout fallback.
      });
    };

    const startedAt = Date.now();
    const recommendations = await recommendForFeeding(
      makeFeedingResult({
        totalMeals: 0,
      }),
      undefined,
      "en",
    );
    const elapsedMs = Date.now() - startedAt;

    assert.deepEqual(recommendations, [
      "Try recording feeding status daily so we can generate reliable insights.",
    ]);
    assert.ok(elapsedMs >= 100 && elapsedMs < 1000);
  } finally {
    geminiService.askGemini = originalAskGemini;
    if (originalEnabled === undefined) {
      delete process.env.AI_RECOMMENDATIONS_ENABLED;
    } else {
      process.env.AI_RECOMMENDATIONS_ENABLED = originalEnabled;
    }
    if (originalTimeout === undefined) {
      delete process.env.AI_RECOMMENDATIONS_TIMEOUT_MS;
    } else {
      process.env.AI_RECOMMENDATIONS_TIMEOUT_MS = originalTimeout;
    }
  }
});
