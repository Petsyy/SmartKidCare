import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAgeInMonths,
  calculateBmi,
  classifyNutritionalStatus,
} from "../src/shared/utils/nutrition.utils";

test("calculates BMI from kilograms and centimeters", () => {
  assert.equal(calculateBmi(15.5, 100), 15.5);
});

test("calculates completed age in months", () => {
  assert.equal(
    calculateAgeInMonths(new Date("2021-08-08"), new Date("2026-09-13")),
    61,
  );
});

test("classifies valid BMI measurements using age and sex inputs", () => {
  assert.equal(classifyNutritionalStatus(15.5, 61, "female"), "Normal");
  assert.equal(classifyNutritionalStatus(12.0, 61, "female"), "Severely Underweight");
  assert.equal(classifyNutritionalStatus(19.0, 61, "male"), "Overweight");
  assert.equal(classifyNutritionalStatus(21.0, 61, "male"), "Obese");
});
