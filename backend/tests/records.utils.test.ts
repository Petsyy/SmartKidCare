import assert from "node:assert/strict";
import test from "node:test";
import { getDateRangeFromPreset } from "../src/shared/utils/records.utils";

const manilaWednesday = new Date("2026-09-22T20:30:00.000Z");

test("today preset uses Manila day boundaries", () => {
  const range = getDateRangeFromPreset("today", manilaWednesday);

  assert.equal(range?.start.toISOString(), "2026-09-22T16:00:00.000Z");
  assert.equal(range?.end.toISOString(), "2026-09-23T15:59:59.999Z");
});

test("thisWeek preset starts on Monday in Manila", () => {
  const range = getDateRangeFromPreset("thisWeek", manilaWednesday);

  assert.equal(range?.start.toISOString(), "2026-09-20T16:00:00.000Z");
  assert.equal(range?.end.toISOString(), "2026-09-27T15:59:59.999Z");
});

test("thisMonth preset uses Manila month boundaries", () => {
  const range = getDateRangeFromPreset("thisMonth", manilaWednesday);

  assert.equal(range?.start.toISOString(), "2026-08-31T16:00:00.000Z");
  assert.equal(range?.end.toISOString(), "2026-09-30T15:59:59.999Z");
});

test("unknown preset does not create a date range", () => {
  assert.equal(getDateRangeFromPreset("unknown", manilaWednesday), null);
});
