import assert from "node:assert/strict";
import test from "node:test";
import { isDateKeyWithinPastDays } from "../src/shared/utils/date.utils";

test("allows today and dates up to seven days in the past", () => {
  assert.equal(isDateKeyWithinPastDays("2026-10-19", "2026-10-19", 7), true);
  assert.equal(isDateKeyWithinPastDays("2026-10-12", "2026-10-19", 7), true);
});

test("rejects dates older than seven days and future dates", () => {
  assert.equal(isDateKeyWithinPastDays("2026-10-11", "2026-10-19", 7), false);
  assert.equal(isDateKeyWithinPastDays("2026-10-20", "2026-10-19", 7), false);
});

test("handles month boundaries and invalid calendar dates", () => {
  assert.equal(isDateKeyWithinPastDays("2026-09-27", "2026-10-04", 7), true);
  assert.equal(isDateKeyWithinPastDays("2026-02-30", "2026-03-01", 7), false);
});
