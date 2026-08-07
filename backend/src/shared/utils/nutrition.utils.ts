/**
 * Calculates Body Mass Index (BMI).
 * Formula: weight (kg) / [height (m)]^2
 */
export const calculateBmi = (weightKg: number, heightCm: number): number => {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number(bmi.toFixed(2));
};

/**
 * Classifies nutritional status based on BMI for children aged 3-5.
 * Note: These are simplified WHO BMI-for-age placeholders.
 * They should be refined according to specific DSWD/DepEd standards if required.
 */
export const classifyNutritionalStatus = (
  bmi: number,
  _ageYears: number, // Reserved for future exact age-based lookups
): "Normal" | "Underweight" | "Severely Underweight" | "Overweight" | null => {
  if (bmi <= 0) return null;

  // Simplified WHO BMI-for-age placeholders for 3-5 years old
  if (bmi < 13.0) return "Severely Underweight";
  if (bmi >= 13.0 && bmi < 14.0) return "Underweight";
  if (bmi >= 14.0 && bmi < 18.0) return "Normal";
  if (bmi >= 18.0) return "Overweight";

  return null;
};
