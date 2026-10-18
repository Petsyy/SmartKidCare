import test from "node:test";
import assert from "node:assert/strict";

import {
  parseAiChatRequest,
  sanitizeAiChatFallbackMessage,
} from "../src/modules/ai/services/core/ai-chat.service";
import { shouldUseAIAgent } from "../src/modules/ai/services/agents/agent.service";

test("parseAiChatRequest accepts valid parent payload", () => {
  const result = parseAiChatRequest(
    {
      message: "Show attendance details today",
      childId: "507f1f77bcf86cd799439011",
    },
    {
      id: "parent-1",
      role: "parent",
    },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.data);

  assert.equal(result.data?.role, "parent");
  assert.equal(result.data?.requesterId, "parent-1");
  assert.equal(result.data?.childId, "507f1f77bcf86cd799439011");
  assert.equal(result.data?.message, "Show attendance details today");
  assert.equal(result.data?.language, undefined);
  assert.equal(result.data?.resetContext, false);
});

test("parseAiChatRequest accepts and ignores a legacy body role", () => {
  const result = parseAiChatRequest(
    {
      role: "teacher",
      message: "Show attendance details today",
      childId: "507f1f77bcf86cd799439011",
      language: "fil",
      resetContext: true,
      contextId: "550e8400-e29b-41d4-a716-446655440000",
    },
    { id: "parent-1", role: "parent" },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.role, "parent");
  assert.equal(result.data.language, "fil");
  assert.equal(result.data.resetContext, true);
});

test("parseAiChatRequest rejects invalid language and resetContext values", () => {
  const invalidLanguage = parseAiChatRequest(
    { message: "Hello", language: "tl" },
    { id: "parent-1", role: "parent" },
  );
  const invalidReset = parseAiChatRequest(
    { message: "Hello", resetContext: "true" },
    { id: "parent-1", role: "parent" },
  );
  assert.equal(invalidLanguage.ok, false);
  assert.equal(invalidReset.ok, false);
  if (!invalidLanguage.ok) assert.equal(invalidLanguage.status, 400);
  if (!invalidReset.ok) assert.equal(invalidReset.status, 400);
});

test("parseAiChatRequest rejects non-parent role", () => {
  const result = parseAiChatRequest(
    { message: "Show attendance details" },
    { id: "teacher-1", role: "teacher" },
  );

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.equal(result.status, 403);
  assert.match(result.message, /parent accounts/i);
});

test("parseAiChatRequest rejects invalid childId format", () => {
  const result = parseAiChatRequest(
    {
      message: "Show feeding details",
      childId: "not-a-valid-object-id",
    },
    { id: "parent-1", role: "parent" },
  );

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.equal(result.status, 400);
  assert.match(result.message, /childId/i);
});

test("parseAiChatRequest rejects gibberish input", () => {
  const result = parseAiChatRequest(
    {
      message: "asdasdas qweqwe zxcvzx",
    },
    { id: "parent-1", role: "parent" },
  );

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.equal(result.status, 400);
  assert.match(result.message, /couldn't understand/i);
});

test("sanitizeAiChatFallbackMessage strips script tags", () => {
  const message = sanitizeAiChatFallbackMessage(
    "<script>alert('x')</script>   Hello\n\nthere",
  );

  assert.equal(message.includes("script"), false);
  assert.equal(message, "Hello there");
});

test("attendance routing recognizes parent questions using absence nouns", () => {
  assert.equal(
    shouldUseAIAgent("How many absences does my child have?"),
    true,
  );
  assert.equal(
    shouldUseAIAgent("How many absences did my child have?"),
    true,
  );
  assert.equal(shouldUseAIAgent("Was my child absent today?"), true);
});

test("agent routing recognizes Filipino and Taglish attendance and feeding", () => {
  assert.equal(shouldUseAIAgent("Pumasok ba ang anak ko ngayon?"), true);
  assert.equal(shouldUseAIAgent("Ano ang kinain niya kahapon?"), true);
  assert.equal(
    shouldUseAIAgent("Ibigay ang buod ng attendance at pagkain"),
    true,
  );
});
