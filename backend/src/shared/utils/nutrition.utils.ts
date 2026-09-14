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

export type NutritionalStatus =
  | "Normal"
  | "Underweight"
  | "Severely Underweight"
  | "Overweight"
  | "Obese";

export const calculateAgeInMonths = (
  dateOfBirth: Date,
  measurementDate: Date = new Date(),
): number => {
  let months =
    (measurementDate.getFullYear() - dateOfBirth.getFullYear()) * 12 +
    (measurementDate.getMonth() - dateOfBirth.getMonth());

  if (measurementDate.getDate() < dateOfBirth.getDate()) months -= 1;
  return Math.max(0, months);
};

type BmiReference = {
  min: number;
  normal: number;
  overweight: number;
  obese: number;
};

// WHO BMI-for-age boundary points for the supported 3-5 year age range.
// Values are linearly interpolated between the published age points.
const bmiReferences: Record<"male" | "female", Array<BmiReference>> = {
  male: [
    { min: 12.9, normal: 17.0, overweight: 18.2, obese: 20.0 },
    { min: 13.0, normal: 16.9, overweight: 18.0, obese: 19.8 },
    { min: 13.1, normal: 16.8, overweight: 17.9, obese: 19.6 },
  ],
  female: [
    { min: 12.8, normal: 17.1, overweight: 18.3, obese: 20.2 },
    { min: 12.9, normal: 17.0, overweight: 18.1, obese: 20.0 },
    { min: 13.0, normal: 16.9, overweight: 18.0, obese: 19.8 },
  ],
};

const interpolateReference = (
  sex: "male" | "female",
  ageInMonths: number,
): BmiReference => {
  const references = bmiReferences[sex];
  const position = Math.min(Math.max(ageInMonths - 36, 0), 35) / 17;
  const lowerIndex = Math.min(Math.floor(position), references.length - 2);
  const fraction = position - lowerIndex;
  const lower = references[lowerIndex];
  const upper = references[lowerIndex + 1];

  return {
    min: lower.min + (upper.min - lower.min) * fraction,
    normal: lower.normal + (upper.normal - lower.normal) * fraction,
    overweight: lower.overweight + (upper.overweight - lower.overweight) * fraction,
    obese: lower.obese + (upper.obese - lower.obese) * fraction,
  };
};

export const classifyNutritionalStatus = (
  bmi: number,
  ageInMonths: number,
  sex: "male" | "female" = "male",
): NutritionalStatus | null => {
  if (bmi <= 0) return null;

  const reference = interpolateReference(sex, ageInMonths);
  if (bmi < reference.min - 0.5) return "Severely Underweight";
  if (bmi < reference.min) return "Underweight";
  if (bmi < reference.overweight) return "Normal";
  if (bmi < reference.obese) return "Overweight";
  return "Obese";

};
