import assert from "node:assert/strict";
import test from "node:test";
import {
  selectLatestNutritionRecords,
  summarizeNutritionAnalytics,
} from "../src/modules/nutrition/services/nutrition.service";
import { getManilaMeasurementDateKey } from "../src/shared/utils/nutrition.utils";

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

test("uses the latest repeated quarterly assessment for each child and school year", () => {
  const latest = selectLatestNutritionRecords([
    {
      childId: "child-1",
      schoolYear: "2026-2027",
      nutritionalStatus: "Underweight",
      measurementDate: new Date("2026-08-01T04:00:00.000Z"),
    },
    {
      childId: "child-1",
      schoolYear: "2026-2027",
      nutritionalStatus: "Normal",
      measurementDate: new Date("2026-09-01T04:00:00.000Z"),
    },
  ]);

  assert.equal(latest.length, 1);
  assert.equal(latest[0].nutritionalStatus, "Normal");
});

test("creates measurement date keys using the Manila calendar date", () => {
  assert.equal(
    getManilaMeasurementDateKey(new Date("2026-10-18T16:30:00.000Z")),
    "2026-10-19",
  );
});
