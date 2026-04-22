import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDomainSelectionPrompt,
  buildGenericDomainSelectionPrompt,
  buildScopedFollowUpQuestion,
  clearPendingFollowUp,
  getPendingFollowUp,
  inferFollowUpChoice,
  recoverPendingFollowUpFromHistory,
  setPendingFollowUp,
} from "../src/modules/ai/chat-followup.service";
import { remember } from "../src/modules/ai/ai-writer-helpers/writer.memory";

const uniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random()}`;

test("set/get/clear pending follow-up state", () => {
  const conversationId = uniqueId("followup");

  setPendingFollowUp(conversationId, {
    kind: "domain_selection",
    timeframe: "recent",
    domain: "both",
  });

  const state = getPendingFollowUp(conversationId);
  assert.ok(state);
  assert.equal(state?.kind, "domain_selection");
  assert.equal(state?.timeframe, "recent");
  assert.equal(state?.domain, "both");

  clearPendingFollowUp(conversationId);
  assert.equal(getPendingFollowUp(conversationId), undefined);
});

test("inferFollowUpChoice detects attendance, feeding, both", () => {
  assert.equal(inferFollowUpChoice("show attendance details"), "attendance");
  assert.equal(inferFollowUpChoice("feeding update please"), "feeding");
  assert.equal(inferFollowUpChoice("show both attendance and feeding"), "both");
  assert.equal(inferFollowUpChoice("hello there"), null);
});

test("buildDomainSelectionPrompt includes scoped timeframe", () => {
  const english = buildDomainSelectionPrompt({
    role: "parent",
    timeframe: "week",
  });

  assert.match(english, /attendance details/i);
  assert.match(english, /this week/i);
});

test("buildGenericDomainSelectionPrompt and buildScopedFollowUpQuestion", () => {
  const generic = buildGenericDomainSelectionPrompt({
    role: "parent",
  });
  const scoped = buildScopedFollowUpQuestion("parent", "feeding", "month");

  assert.match(generic, /feeding details/i);
  assert.match(scoped, /feeding details/i);
  assert.match(scoped, /this month/i);
});

test("recoverPendingFollowUpFromHistory infers timeframe and domain", () => {
  const conversationId = uniqueId("history");
  remember(conversationId, {
    role: "user",
    content: "Can you show attendance and feeding for last week?",
  });
  remember(conversationId, {
    role: "assistant",
    content: "Sure, I can summarize attendance and feeding records.",
  });

  const state = recoverPendingFollowUpFromHistory(conversationId);

  assert.ok(state);
  assert.equal(state?.kind, "detailed_review_confirmation");
  assert.equal(state?.timeframe, "last_week");
  assert.equal(state?.domain, "both");
});
