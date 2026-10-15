import test from "node:test";
import assert from "node:assert/strict";
import { archiveChildSchema, updateChildSchema } from "../src/modules/child/validators/child.validator";

test("archive validation requires a supported reason", () => {
  assert.equal(archiveChildSchema.safeParse({}).success, false);
  assert.equal(archiveChildSchema.safeParse({ reason: "Unknown" }).success, false);
  assert.equal(archiveChildSchema.safeParse({ reason: "Transferred" }).success, true);
});

test("archive validation limits optional notes to 300 characters", () => {
  assert.equal(archiveChildSchema.safeParse({ reason: "Other", note: "a".repeat(300) }).success, true);
  assert.equal(archiveChildSchema.safeParse({ reason: "Other", note: "a".repeat(301) }).success, false);
});

test("generic child updates no longer accept status changes", () => {
  const result = updateChildSchema.safeParse({ status: "Inactive" });
  assert.equal(result.success, false);
});
