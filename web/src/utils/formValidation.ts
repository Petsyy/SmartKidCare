import { z } from "zod";

// Zod Schemas
const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;
const SCHOOL_YEAR_REGEX = /^(\d{4})-(\d{4})$/;

// Utility function to sanitize phone input
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
    .min(minLength, `${label} is too short.`)
    .max(maxLength, `${label} is too long.`)
    .regex(NAME_REGEX, `${label} contains invalid characters.`);

const optionalNameSchema = (label: string, minLength = 1, maxLength = 50) =>
  z
    .string()
    .trim()
    .refine(
      (val) =>
        val === "" || (val.length >= minLength && val.length <= maxLength),
      { message: `${label} is invalid.` },
    )
    .refine((val) => val === "" || NAME_REGEX.test(val), {
      message: `${label} contains invalid characters.`,
    });

const emailSchema = (label: string) =>
  z.string().trim().email(`${label} is invalid.`);

const phoneSchema = (_label: string) =>
  z
    .string()
    .trim()
    .refine((value) => {
      const digitsOnly = value.replace(/\D/g, "");
      return /^09\d{9}$/.test(digitsOnly) || /^639\d{9}$/.test(digitsOnly);
    }, `Invalid phone number.`);

const dateOfBirthSchema = z
  .string()
  .refine((val) => val.length > 0, "Required.")
  .refine((val) => !isNaN(new Date(val).getTime()), "Invalid date.")
  .refine((val) => {
    const birthDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    birthDate.setHours(0, 0, 0, 0);
    return birthDate <= today;
  }, "Cannot be in the future.");

const enrollmentDateSchema = z
  .string()
  .refine((val) => val.length > 0, "Required.")
  .refine((val) => !isNaN(new Date(val).getTime()), "Invalid date.");

const schoolYearSchema = z
  .string()
  .refine((val) => val.length > 0 && SCHOOL_YEAR_REGEX.test(val), "Required.");

const teacherIdSchema = z
  .string()
  .refine((val) => val.length > 0, "Please select a teacher.");

const genderSchema = z.enum(["male", "female"], {
  message: "Please select a gender.",
});

// Full Child Schema with Parent Info
const createAddChildSchema = (requireParentInfo: boolean) =>
  z
    .object({
      firstName: nameSchema("First name", 2, 50),
      middleName: optionalNameSchema("Middle name", 1, 50),
      lastName: nameSchema("Last name", 2, 50),
      dateOfBirth: dateOfBirthSchema,
      age: z.string(),
      gender: genderSchema,
      enrollmentDate: enrollmentDateSchema,
      schoolYear: schoolYearSchema,
      teacherId: teacherIdSchema,
      parentFirstName: requireParentInfo
        ? nameSchema("Parent first name", 2, 50)
        : optionalNameSchema("Parent first name", 2, 50),
      parentMiddleName: optionalNameSchema("Parent middle name", 1, 50),
      parentLastName: requireParentInfo
        ? nameSchema("Parent last name", 2, 50)
        : optionalNameSchema("Parent last name", 2, 50),
      parentEmail: requireParentInfo
        ? emailSchema("Parent email")
        : z
            .string()
            .trim()
            .refine(
              (val) => val === "" || z.string().email().safeParse(val).success,
              "Invalid email.",
            ),
      parentPhone: requireParentInfo
        ? phoneSchema("Parent phone number")
        : z
            .string()
            .trim()
            .refine((val) => {
              if (val === "") return true;
              const digitsOnly = val.replace(/\D/g, "");
              return (
                /^09\d{9}$/.test(digitsOnly) || /^639\d{9}$/.test(digitsOnly)
              );
            }, "Invalid phone number."),
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

// Types
export type AddChildFormValues = z.infer<
  ReturnType<typeof createAddChildSchema>
>;
export type AddChildFormErrors = Partial<
  Record<keyof AddChildFormValues, string>
>;
type RequireParentOption = { requireParentInfo: boolean };

// Normalize modal form data into the AddChildFormValues shape
type AddChildValuesInput = Omit<AddChildFormValues, "teacherId"> & {
  teacherId?: string;
};

export const buildAddChildValuesFromForm = (
  data: AddChildValuesInput,
): AddChildFormValues => ({
  firstName: data.firstName,
  middleName: data.middleName,
  lastName: data.lastName,
  dateOfBirth: data.dateOfBirth,
  age: data.age,
  gender: data.gender,
  enrollmentDate: data.enrollmentDate,
  schoolYear: data.schoolYear,
  teacherId: data.teacherId ?? "",
  parentLastName: data.parentLastName,
  parentFirstName: data.parentFirstName,
  parentMiddleName: data.parentMiddleName,
  parentEmail: data.parentEmail,
  parentPhone: data.parentPhone,
});

// Field-level validation using Zod
export const validateChildField = (
  field: keyof AddChildFormValues,
  values: AddChildFormValues,
  options: RequireParentOption,
): string | undefined => {
  const schema = createAddChildSchema(options.requireParentInfo);

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

// Step validation using Zod
export const validateChildStep = (
  step: number,
  values: AddChildFormValues,
  dateErrors: { dateOfBirth?: string; enrollmentDate?: string },
  options: RequireParentOption,
  existingErrors: AddChildFormErrors = {},
) => {
  const stepFields: (keyof AddChildFormValues)[] =
    step === 1
      ? ["firstName", "middleName", "lastName", "dateOfBirth", "gender"]
      : step === 2
        ? ["enrollmentDate", "schoolYear", "teacherId"]
        : [
            "parentFirstName",
            "parentMiddleName",
            "parentLastName",
            "parentEmail",
            "parentPhone",
          ];

  const schema = createAddChildSchema(options.requireParentInfo);
  const nextFieldErrors: AddChildFormErrors = { ...existingErrors };

  try {
    schema.parse(values);
    // If parse succeeds, clear errors for step fields
    stepFields.forEach((field) => {
      delete nextFieldErrors[field];
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: z.ZodIssue) => {
        const field = err.path[0] as keyof AddChildFormValues;
        if (stepFields.includes(field)) {
          nextFieldErrors[field] = err.message;
        }
      });
    }
  }

  const hasStepFieldErrors = stepFields.some((field) =>
    Boolean(nextFieldErrors[field]),
  );

  if (step === 1 && dateErrors.dateOfBirth)
    return { isValid: false, errors: nextFieldErrors };
  if (step === 2 && dateErrors.enrollmentDate)
    return { isValid: false, errors: nextFieldErrors };

  return { isValid: !hasStepFieldErrors, errors: nextFieldErrors };
};

// Full form validation
export const validateAddChildForm = (
  form: AddChildFormValues,
  options: RequireParentOption,
) => {
  const schema = createAddChildSchema(options.requireParentInfo);
  const errors: AddChildFormErrors = {};

  try {
    schema.parse(form);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: z.ZodIssue) => {
        const field = err.path[0] as keyof AddChildFormValues;
        errors[field] = err.message;
      });
    }
  }

  return errors;
};

// Date field validation
export const validateDateFields = (data: {
  dateOfBirth: string;
  enrollmentDate: string;
}): { dateOfBirth?: string; enrollmentDate?: string } => {
  const errors: { dateOfBirth?: string; enrollmentDate?: string } = {};

  try {
    dateOfBirthSchema.parse(data.dateOfBirth);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.issues[0];
      errors.dateOfBirth = fieldError?.message;
    }
  }

  try {
    enrollmentDateSchema.parse(data.enrollmentDate);
    const enrollmentDate = new Date(data.enrollmentDate);
    if (!isNaN(enrollmentDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      enrollmentDate.setHours(0, 0, 0, 0);

      if (enrollmentDate > today) {
        errors.enrollmentDate = "Cannot be in the future.";
      }

      const birthDate = new Date(data.dateOfBirth);
      birthDate.setHours(0, 0, 0, 0);
      if (enrollmentDate < birthDate) {
        errors.enrollmentDate = "Cannot be before birth date.";
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.issues[0];
      errors.enrollmentDate = fieldError?.message;
    }
  }

  return errors;
};

// AddChildForParent Schema and Types (for parent-only forms)
const createAddChildForParentSchema = () =>
  z
    .object({
      firstName: nameSchema("First name", 2, 50),
      middleName: optionalNameSchema("Middle name", 1, 50),
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
const createAddTeacherSchema = () =>
  z.object({
    firstName: nameSchema("First name", 2, 50),
    middleName: nameSchema("Middle name", 2, 50),
    lastName: nameSchema("Last name", 2, 50),
    email: emailSchema("Email"),
    phone: phoneSchema("Phone"),
  });

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
