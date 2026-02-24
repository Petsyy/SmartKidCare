import assert from "node:assert/strict";
import { test } from "node:test";
import { detectResponseLanguage } from "../src/services/ai/language.service";

test("keeps English for attendance/feeding week summaries", () => {
  assert.equal(
    detectResponseLanguage("Summarize the attendance and feeding records last week"),
    "en",
  );
  assert.equal(
    detectResponseLanguage("Summarize attendance for this week"),
    "en",
  );
  assert.equal(
    detectResponseLanguage("How many children were present today?"),
    "en",
  );
});

test("detects Tagalog and Taglish prompts as Tagalog", () => {
  assert.equal(
    detectResponseLanguage("Ilang bata ang present ngayong linggo?"),
    "tl",
  );
  assert.equal(
    detectResponseLanguage("Ano ang attendance ng anak ko this week?"),
    "tl",
  );
  assert.equal(
    detectResponseLanguage("Paano ang feeding records ng anak ko?"),
    "tl",
  );
});
