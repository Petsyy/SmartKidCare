import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  concernListQuerySchema,
  concernMessageSchema,
  concernStatusSchema,
  createConcernSchema,
} from "../src/modules/concerns/validators/concern.validator";

describe("Concern validators", () => {
  it("should accept the complete creation payload", () => {
    const result = createConcernSchema.safeParse({
      childId: "64b000000000000000000004",
      category: "feeding_nutrition",
      subject: "Meal program feedback",
      message: "I would like to ask about this week's meal program.",
    });
    assert.equal(result.success, true);
  });

  it("should reject short subjects and empty messages", () => {
    const result = createConcernSchema.safeParse({
      childId: "64b000000000000000000004",
      category: "attendance",
      subject: "No",
      message: "",
    });
    assert.equal(result.success, false);
  });

  it("should coerce and limit pagination", () => {
    const valid = concernListQuerySchema.safeParse({ page: "2", limit: "50" });
    const invalid = concernListQuerySchema.safeParse({ page: "1", limit: "51" });
    assert.equal(valid.success, true);
    assert.equal(valid.success && valid.data.page, 2);
    assert.equal(invalid.success, false);
  });

  it("should enforce message and status values", () => {
    assert.equal(concernMessageSchema.safeParse({ message: "A reply" }).success, true);
    assert.equal(concernMessageSchema.safeParse({ message: "" }).success, false);
    assert.equal(concernStatusSchema.safeParse({ status: "resolved" }).success, true);
    assert.equal(concernStatusSchema.safeParse({ status: "deleted" }).success, false);
  });
});
