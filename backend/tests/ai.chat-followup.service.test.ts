import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDomainSelectionPrompt,
  buildScopedFollowUpQuestion,
  inferFollowUpChoice,
} from "../src/modules/ai/services/core/ai-chat.service";
import {
  clearConversationState,
  clearPendingFollowUp,
  getPendingFollowUp,
  runInConversationScope,
  setPendingFollowUp,
} from "../src/modules/ai/repositories/ai-state.repository";
import { buildConversationId } from "../src/modules/ai/services/generators/ai-writer.service";

const uniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random()}`;

test("set/get/clear pending follow-up state", () => {
  const conversationId = uniqueId("followup");
  setPendingFollowUp(conversationId, {
    type: "domain_selection",
    action: "choose_domain",
    timeframe: "recent",
    domain: "both",
  });
  assert.equal(getPendingFollowUp(conversationId)?.domain, "both");
  clearPendingFollowUp(conversationId);
  assert.equal(getPendingFollowUp(conversationId), undefined);
});

test("inferFollowUpChoice detects English, Filipino, and both", () => {
  assert.equal(inferFollowUpChoice("show attendance details"), "attendance");
  assert.equal(inferFollowUpChoice("ipakita ang pagkain"), "feeding");
  assert.equal(inferFollowUpChoice("ipakita ang pareho"), "both");
  assert.equal(inferFollowUpChoice("hello there"), null);
});

test("follow-up prompts honor language and timeframe", () => {
  assert.match(buildDomainSelectionPrompt("parent", "week", "en"), /this week/i);
  assert.match(
    buildDomainSelectionPrompt("parent", "last_month", "fil"),
    /nakaraang buwan/i,
  );
  assert.match(
    buildScopedFollowUpQuestion("parent", "feeding", "yesterday", "fil"),
    /pagkain.*kahapon/i,
  );
});

test("context ids isolate otherwise identical conversations", () => {
  const first = buildConversationId({
    requesterId: "parent-1",
    role: "parent",
    childId: "child-1",
    language: "fil",
    contextId: "context-one",
  });
  const second = buildConversationId({
    requesterId: "parent-1",
    role: "parent",
    childId: "child-1",
    language: "fil",
    contextId: "context-two",
  });
  assert.notEqual(first, second);
});

test("a queued reset cannot be overwritten by an older scoped operation", async () => {
  const conversationId = uniqueId("queue");
  let releaseFirst!: () => void;
  const firstGate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const first = runInConversationScope(conversationId, false, async () => {
    await firstGate;
    setPendingFollowUp(conversationId, {
      type: "domain_selection",
      action: "choose_domain",
      timeframe: "week",
      domain: "attendance",
    });
  });
  const reset = runInConversationScope(conversationId, true, async () => undefined);
  releaseFirst();
  await Promise.all([first, reset]);
  assert.equal(getPendingFollowUp(conversationId), undefined);
  clearConversationState(conversationId);
});
