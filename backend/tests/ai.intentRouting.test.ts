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
});

test("returns null for unrelated prompts", () => {
  assert.equal(detectToolForQuestion("Tell me a joke"), null);
  assert.equal(detectToolForQuestion("Hello"), null);
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
