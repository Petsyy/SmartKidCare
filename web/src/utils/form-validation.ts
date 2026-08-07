import { z } from "zod";

const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;
const SCHOOL_YEAR_REGEX = /^(\d{4})-(\d{4})$/;

export const sanitizePhoneInput = (value: string): string => {
  const digitsOnly = String(value || "").replace(/\D/g, "");
  if (digitsOnly.startsWith("63")) {
    return digitsOnly.slice(0, 12);
  }
  return digitsOnly.slice(0, 11);
};

const nameSchema = (label: string, minLength = 2, maxLength = 50) =>
  z
    .string()
    .trim()
    .refine((val) => val.length > 0, `${label} is required.`)
    .refine((val) => val.length === 0 || val.length >= minLength, `${label} is too short.`)
    .refine((val) => val.length <= maxLength, `${label} is too long.`)
    .refine((value) => value.length === 0 || NAME_REGEX.test(value), {
      message: `${label} contains invalid characters.`,
    });

const emailSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .email(`${label} is invalid.`);

const phoneSchema = (_label: string) =>
  z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => {
      const digitsOnly = value.replace(/\D/g, "");
      return /^09\d{9}$/.test(digitsOnly) || /^639\d{9}$/.test(digitsOnly);
    }, `Invalid phone number.`);

const dateOfBirthSchema = z
  .string()
  .refine((val) => val.length > 0, "Date of birth is required.")
  .refine((val) => !isNaN(new Date(val).getTime()), "Invalid date.")
  .refine((val) => {
    const birthDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    birthDate.setHours(0, 0, 0, 0);
    return birthDate <= today;
  }, "Cannot be in the future.")
  .refine((val) => {
    const birthDate = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 3 && age <= 5;
  }, "Age must be between 3 and 5 years old.");

const enrollmentDateSchema = z
  .string()
  .refine((val) => val.length > 0, "Enrollment date is required.")
  .refine((val) => !isNaN(new Date(val).getTime()), "Invalid date.");

const schoolYearSchema = z
  .string()
  .refine(
    (val) => val.length > 0 && SCHOOL_YEAR_REGEX.test(val),
    "School year is required.",
  );

const genderSchema = z.enum(["male", "female"], {
  message: "Please select a gender.",
});

// AddChildForParent Schema and Types (for parent-only forms)
const createAddChildForParentSchema = () =>
  z
    .object({
      firstName: nameSchema("First name", 2, 50),
      middleName: nameSchema("Middle name", 2, 50),
      lastName: nameSchema("Last name", 2, 50),
      dateOfBirth: dateOfBirthSchema,
      age: z.string(),
      gender: genderSchema,
      enrollmentDate: enrollmentDateSchema,
      schoolYear: schoolYearSchema,
    })
    .superRefine((data, ctx) => {
      const enrollmentDate = new Date(data.enrollmentDate);
      if (!isNaN(enrollmentDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        enrollmentDate.setHours(0, 0, 0, 0);

        if (enrollmentDate > today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Cannot be in the future.",
            path: ["enrollmentDate"],
          });
        }

        const birthDate = new Date(data.dateOfBirth);
        birthDate.setHours(0, 0, 0, 0);
        if (enrollmentDate < birthDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Cannot be before birth date.",
            path: ["enrollmentDate"],
          });
        }

        // Validate school year
        const matches = SCHOOL_YEAR_REGEX.exec(data.schoolYear.trim());
        if (matches) {
          const startYear = Number(matches[1]);
          const endYear = Number(matches[2]);
          if (endYear !== startYear + 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid year range.",
              path: ["schoolYear"],
            });
          } else if (startYear !== enrollmentDate.getFullYear()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Must match enrollment year.",
              path: ["schoolYear"],
            });
          }
        }
      }
    });

export type AddChildForParentFormValues = z.infer<
  ReturnType<typeof createAddChildForParentSchema>
>;
export type AddChildForParentField = keyof AddChildForParentFormValues;
export type AddChildForParentFormErrors = Partial<
  Record<AddChildForParentField, string>
>;

export const validateAddChildForParentField = (
  field: AddChildForParentField,
  values: AddChildForParentFormValues,
): string | undefined => {
  const schema = createAddChildForParentSchema();

  try {
    // For fields that depend on other fields, validate the whole object
    if (field === "enrollmentDate" || field === "schoolYear") {
      schema.parse(values);
      return undefined;
    }

    // For independent fields, validate just that field
    const fieldSchema = schema.shape[field];
    if (fieldSchema) {
      fieldSchema.parse(values[field]);
    }
    return undefined;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.issues.find(
        (err: z.ZodIssue) => err.path[0] === field,
      );
      return fieldError?.message;
    }
    return undefined;
  }
};

export const validateAddChildForParentForm = (
  form: AddChildForParentFormValues,
) => {
  const schema = createAddChildForParentSchema();
  const errors: AddChildForParentFormErrors = {};

  try {
    schema.parse(form);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: z.ZodIssue) => {
        const field = err.path[0] as AddChildForParentField;
        errors[field] = err.message;
      });
    }
  }

  return errors;
};

// AddTeacher Schema and Types
export const addTeacherSchema = z.object({
  firstName: nameSchema("First name", 2, 50),
  middleName: nameSchema("Middle name", 2, 50),
  lastName: nameSchema("Last name", 2, 50),
  email: emailSchema("Email"),
  phone: phoneSchema("Phone"),
  daycareCenterId: z.string().trim().min(1, "Assigned center is required."),
});

const createAddTeacherSchema = () => addTeacherSchema;

export type AddTeacherFormValues = z.infer<
  ReturnType<typeof createAddTeacherSchema>
>;
export type AddTeacherField = keyof AddTeacherFormValues;
export type AddTeacherFormErrors = Partial<Record<AddTeacherField, string>>;

export const validateAddTeacherField = (
  field: AddTeacherField,
  values: AddTeacherFormValues,
): string | undefined => {
  const schema = createAddTeacherSchema();

  try {
    const fieldSchema = schema.shape[field];
    if (fieldSchema) {
      fieldSchema.parse(values[field]);
    }
    return undefined;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.issues[0];
      return fieldError?.message;
    }
    return undefined;
  }
};

export const validateAddTeacherForm = (form: AddTeacherFormValues) => {
  const schema = createAddTeacherSchema();
  const errors: AddTeacherFormErrors = {};

  try {
    schema.parse(form);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: z.ZodIssue) => {
        const field = err.path[0] as AddTeacherField;
        errors[field] = err.message;
      });
    }
  }

  return errors;
};

// EditChild Schema
export const editChildSchema = createAddChildForParentSchema().and(
  z.object({
    teacherId: z.string().optional().nullable(),
    homeAddress: z.string().trim().min(5, "Complete home address is required.").max(300),
    parentRelationship: z.enum(["Mother", "Father", "Guardian", "Grandparent", "Other"]),
    weight: z.string().trim().refine((value) => Number(value) >= 5 && Number(value) <= 50, "Weight must be between 5 and 50 kg."),
    height: z.string().trim().refine((value) => Number(value) >= 60 && Number(value) <= 150, "Height must be between 60 and 150 cm."),
  })
);

export type EditChildFormValues = z.infer<typeof editChildSchema>;

// EditUser Schema
export const editUserSchema = z.object({
  firstName: nameSchema("First name", 2, 50),
  middleName: nameSchema("Middle name", 2, 50),
  lastName: nameSchema("Last name", 2, 50),
  email: emailSchema("Email"),
  phone: phoneSchema("Phone"),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
