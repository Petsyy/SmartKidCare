import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectToolForQuestion,
  tryHandleAgentQuery,
} from "../src/services/ai/agent.service";

test("routes attendance intent to summarize_attendance", () => {
  assert.equal(
    detectToolForQuestion("How many absences does my child have this week?"),
    "summarize_attendance",
  );
  assert.equal(
    detectToolForQuestion("Was my child present today?"),
    "summarize_attendance",
  );
  assert.equal(
    detectToolForQuestion("Show attendance records for this week"),
    "summarize_attendance",
  );
  assert.equal(
    detectToolForQuestion("How is my child's attendance?"),
    "summarize_attendance",
  );
  assert.equal(
    detectToolForQuestion("On which dates was my child absent this month?"),
    "summarize_attendance",
  );
});

test("routes feeding intent to summarize_feeding", () => {
  assert.equal(
    detectToolForQuestion("What did my child eat today?"),
    "summarize_feeding",
  );
  assert.equal(
    detectToolForQuestion("Did my child miss any meals this week?"),
    "summarize_feeding",
  );
  assert.equal(
    detectToolForQuestion("Show feeding records for recent days"),
    "summarize_feeding",
  );
  assert.equal(
    detectToolForQuestion("How is my child's feeding this week?"),
    "summarize_feeding",
  );
});

test("routes mixed/report intent to generate_child_report", () => {
  assert.equal(
    detectToolForQuestion(
      "How is my child doing this week in attendance and feeding?",
    ),
    "generate_child_report",
  );
  assert.equal(
    detectToolForQuestion("Give me an overall status of my child"),
    "generate_child_report",
  );
  assert.equal(
    detectToolForQuestion("What is my child's current risk level, and why?"),
    "generate_child_report",
  );
  assert.equal(
    detectToolForQuestion(
      "Can you show a short trend for my child over the last 30 days?",
    ),
    "generate_child_report",
  );
  assert.equal(
    detectToolForQuestion(
      "Is my child's attendance improving compared to last week?",
    ),
    "summarize_attendance",
  );
  assert.equal(
    detectToolForQuestion(
      "Summarize my child's attendance and feeding last week.",
    ),
    "generate_child_report",
  );
});

test("returns null for unrelated prompts", () => {
  assert.equal(detectToolForQuestion("Tell me a joke"), null);
  assert.equal(detectToolForQuestion("Hello"), null);
});

test("rejects gibberish / keyboard-mash inputs", () => {
  // gibberish prefix + typo keyword → still rejected (not a real question)
  assert.equal(detectToolForQuestion("asdasdas attedance"), null);
  // half of tokens are mash → rejected
  assert.equal(detectToolForQuestion("asdf attendance"), null);
  // all mash → rejected
  assert.equal(detectToolForQuestion("asdasdas qwqwqw zxzxzx"), null);
  // pure mash token → rejected
  assert.equal(detectToolForQuestion("asdfghj"), null);
});

test("does NOT reject legitimate questions with no mash tokens", () => {
  assert.equal(
    detectToolForQuestion("How many absences does my child have this week?"),
    "summarize_attendance",
  );
  assert.equal(
    detectToolForQuestion("What did my child eat today?"),
    "summarize_feeding",
  );
});

test("handles typos in intent keywords (fuzzy normalization)", () => {
  // typo: "attedance" → "attendance"
  assert.equal(
    detectToolForQuestion("attedance"),
    "summarize_attendance",
  );
  // typo with junk prefix — junk is ignored, typo keyword is corrected
  assert.equal(
    detectToolForQuestion("asdasdas attedance"),
    "summarize_attendance",
  );
  // typo: "absenses" → "absences"
  assert.equal(
    detectToolForQuestion("How many absenses does my child have?"),
    "summarize_attendance",
  );
  // typo: "feedng" → "feeding"
  assert.equal(
    detectToolForQuestion("feedng records for my child"),
    "summarize_feeding",
  );
  // pure gibberish with no recognizable keyword → null
  assert.equal(detectToolForQuestion("asdasdas qwqwqw zxzxzx"), null);
});

test("teacher aggregate class questions require teacher session context", async () => {
  const reply = await tryHandleAgentQuery({
    role: "teacher",
    question: "How many children were present today?",
    language: "en",
  });

  assert.ok(reply);
  assert.match(String(reply), /teacher session|sign in again/i);

  const genericTeacherReply = await tryHandleAgentQuery({
    role: "teacher",
    question: "Summarize last week feeding and attendance",
    language: "en",
  });

  assert.ok(genericTeacherReply);
  assert.match(String(genericTeacherReply), /teacher session|sign in again/i);
});
