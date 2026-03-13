import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AI_INPUT_LIMITS,
  inputIsGibberish,
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

test("inputIsGibberish blocks noisy keyword stuffing", () => {
  assert.equal(inputIsGibberish("asdasdas attedance"), true);
  assert.equal(inputIsGibberish("asdf attendance"), true);
  assert.equal(inputIsGibberish("asdasdas qwqwqw zxzxzx"), true);
  assert.equal(inputIsGibberish("gagagagag feeding"), true);
  assert.equal(inputIsGibberish("kahakagjsgd feeding"), true);
  assert.equal(inputIsGibberish("jkjajjajajaj feeding"), true);
});

test("inputIsGibberish allows meaningful attendance/feeding prompts", () => {
  assert.equal(inputIsGibberish("attendance"), false);
  assert.equal(inputIsGibberish("feeding"), false);
  assert.equal(inputIsGibberish("show attendance today"), false);
  assert.equal(
    inputIsGibberish("How many absences does my child have this week?"),
    false,
  );
});
