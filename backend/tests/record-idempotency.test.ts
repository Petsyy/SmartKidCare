import assert from "node:assert/strict";
import test from "node:test";
import {
  hashAttendancePayload,
  hashFeedingPayload,
} from "../src/shared/utils/record-idempotency";

test("attendance hash is stable across child record ordering", () => {
  const first = hashAttendancePayload({
    date: "2026-09-27T00:00:00.000Z",
    records: [
      { child: "child-b", status: "absent" },
      { child: "child-a", status: "present" },
    ],
  });
  const second = hashAttendancePayload({
    date: "2026-09-27T00:00:00.000Z",
    records: [
      { child: "child-a", status: "present" },
      { child: "child-b", status: "absent" },
    ],
  });
  assert.equal(first, second);
});

test("feeding hash changes when finalized payload changes", () => {
  const first = hashFeedingPayload({
    date: "2026-09-27T00:00:00.000Z",
    foodServed: "Rice",
    records: [{ child: "child-a", status: "completed", notes: "" }],
  });
  const second = hashFeedingPayload({
    date: "2026-09-27T00:00:00.000Z",
    foodServed: "Rice",
    records: [{ child: "child-a", status: "missed", notes: "" }],
  });
  assert.notEqual(first, second);
});
