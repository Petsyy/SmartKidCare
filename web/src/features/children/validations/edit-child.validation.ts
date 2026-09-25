import { z } from "zod";

const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;
const SCHOOL_YEAR_REGEX = /^(\d{4})-(\d{4})$/;

const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .min(2, `${label} is too short.`)
    .max(50, `${label} is too long.`)
    .regex(NAME_REGEX, `${label} contains invalid characters.`);

const childBaseSchema = z
  .object({
    firstName: nameSchema("First name"),
    middleName: nameSchema("Middle name"),
    lastName: nameSchema("Last name"),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required.")
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "Invalid date.",
      )
      .refine((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        birthDate.setHours(0, 0, 0, 0);
        return birthDate <= today;
      }, "Cannot be in the future.")
      .refine((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (
          monthDifference < 0 ||
          (monthDifference === 0 && today.getDate() < birthDate.getDate())
        )
          age -= 1;
        return age >= 3 && age <= 5;
      }, "Age must be between 3 and 5 years old."),
    age: z.string(),
    gender: z.enum(["male", "female"], { message: "Please select a gender." }),
    enrollmentDate: z
      .string()
      .min(1, "Enrollment date is required.")
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "Invalid date.",
      ),
    schoolYear: z.string().regex(SCHOOL_YEAR_REGEX, "School year is required."),
  })
  .superRefine((data, context) => {
    const enrollmentDate = new Date(data.enrollmentDate);
    if (Number.isNaN(enrollmentDate.getTime())) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    enrollmentDate.setHours(0, 0, 0, 0);
    if (enrollmentDate > today)
      context.addIssue({
        code: "custom",
        message: "Cannot be in the future.",
        path: ["enrollmentDate"],
      });

    const birthDate = new Date(data.dateOfBirth);
    birthDate.setHours(0, 0, 0, 0);
    if (enrollmentDate < birthDate)
      context.addIssue({
        code: "custom",
        message: "Cannot be before birth date.",
        path: ["enrollmentDate"],
      });

    const match = SCHOOL_YEAR_REGEX.exec(data.schoolYear.trim());
    if (!match) return;
    const startYear = Number(match[1]);
    const endYear = Number(match[2]);
    if (endYear !== startYear + 1)
      context.addIssue({
        code: "custom",
        message: "Invalid year range.",
        path: ["schoolYear"],
      });
    else if (startYear !== enrollmentDate.getFullYear())
      context.addIssue({
        code: "custom",
        message: "Must match enrollment year.",
        path: ["schoolYear"],
      });
  });

export const editChildSchema = childBaseSchema.and(
  z.object({
    teacherId: z.string().optional().nullable(),
    homeAddress: z
      .string()
      .trim()
      .min(5, "Complete home address is required.")
      .max(300),
    parentRelationship: z.enum([
      "Mother",
      "Father",
      "Guardian",
      "Grandparent",
      "Other",
    ]),
    weight: z
      .string()
      .trim()
      .refine(
        (value) => Number(value) >= 5 && Number(value) <= 50,
        "Weight must be between 5 and 50 kg.",
      ),
    height: z
      .string()
      .trim()
      .refine(
        (value) => Number(value) >= 60 && Number(value) <= 150,
        "Height must be between 60 and 150 cm.",
      ),
  }),
);

export type EditChildFormValues = z.infer<typeof editChildSchema>;
