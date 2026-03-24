export type Step = 1 | 2 | 3 | 4;

export type DateFieldKey = "dateOfBirth" | "enrollmentDate";

export type ProgramType =
  | "4Ps Beneficiary"
  | "Regular Enrollee (Non-beneficiary)";

export type EnrollmentStatusColors = {
  badgeBackgroundColor: string;
  textColor: string;
  label: string;
};
