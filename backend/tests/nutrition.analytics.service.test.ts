import assert from "node:assert/strict";
import test from "node:test";
import { summarizeNutritionAnalytics } from "../src/modules/nutrition/services/nutrition.service";

test("pairs nutrition assessments by child and school year", () => {
  const summary = summarizeNutritionAnalytics(
    [
      {
        childId: "child-1",
        schoolYear: "2025-2026",
        nutritionalStatus: "Underweight",
      },
      {
        childId: "child-1",
        schoolYear: "2026-2027",
        nutritionalStatus: "Normal",
      },
      {
        childId: "child-without-final",
        schoolYear: "2026-2027",
        nutritionalStatus: "Underweight",
      },
    ],
    [
      {
        childId: "child-1",
        schoolYear: "2025-2026",
        nutritionalStatus: "Normal",
      },
      {
        childId: "child-1",
        schoolYear: "2026-2027",
        nutritionalStatus: "Underweight",
      },
    ],
  );

  assert.deepEqual(summary, {
    totalEvaluated: 2,
    initiallyMalnourished: 1,
    improvedToNormal: 1,
    remainedMalnourished: 0,
    improvementRate: 100,
  });
});

test("returns a zero improvement rate when no initial record is malnourished", () => {
  const summary = summarizeNutritionAnalytics(
    [
      {
        childId: "child-1",
        schoolYear: "2026-2027",
        nutritionalStatus: "Normal",
      },
    ],
    [
      {
        childId: "child-1",
        schoolYear: "2026-2027",
        nutritionalStatus: "Normal",
      },
    ],
  );

  assert.equal(summary.totalEvaluated, 1);
  assert.equal(summary.initiallyMalnourished, 0);
  assert.equal(summary.improvementRate, 0);
});
