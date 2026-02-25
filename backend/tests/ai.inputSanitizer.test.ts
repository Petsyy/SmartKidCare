import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AI_INPUT_LIMITS,
  sanitizeAIChildId,
  sanitizeAIMessageInput,
} from "../src/utils/aiInputSanitizer";

test("sanitizeAIMessageInput removes scripts, tags, and hidden characters", () => {
  const sanitized = sanitizeAIMessageInput(
    "  Hello\u0000 <script>alert(1)</script> <b>world</b>\u200B  ",
  );

  assert.equal(sanitized, "Hello world");
});

test("sanitizeAIMessageInput enforces max length", () => {
  const longInput = "A".repeat(AI_INPUT_LIMITS.messageMaxLength + 100);
  const sanitized = sanitizeAIMessageInput(longInput);

  assert.equal(sanitized.length, AI_INPUT_LIMITS.messageMaxLength);
});

test("sanitizeAIMessageInput returns empty for non-string values", () => {
  assert.equal(sanitizeAIMessageInput(undefined), "");
  assert.equal(sanitizeAIMessageInput(null), "");
  assert.equal(sanitizeAIMessageInput(12345), "");
});

test("sanitizeAIChildId accepts only valid 24-char hex id", () => {
  const validId = "507f1f77bcf86cd799439011";
  assert.equal(sanitizeAIChildId(validId), validId);
  assert.equal(sanitizeAIChildId(` ${validId} `), validId);
  assert.equal(sanitizeAIChildId("507f1f77bcf86cd79943901Z"), undefined);
  assert.equal(sanitizeAIChildId("not-an-object-id"), undefined);
  assert.equal(sanitizeAIChildId(""), undefined);
});
