import test from "node:test";
import assert from "node:assert/strict";

import {
  parseAiChatRequest,
  sanitizeAiChatFallbackMessage,
} from "../src/modules/ai/chat-intent.service";

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

  assert.equal(result.data.role, "parent");
  assert.equal(result.data.requesterId, "parent-1");
  assert.equal(result.data.childId, "507f1f77bcf86cd799439011");
  assert.equal(result.data.message, "Show attendance details today");
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
