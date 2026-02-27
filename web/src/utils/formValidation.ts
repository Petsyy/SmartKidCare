import { z } from "zod";

type FieldErrors<T extends string> = Partial<Record<T, string>>;

const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCHOOL_YEAR_REGEX = /^(\d{4})-(\d{4})$/;

const PHILIPPINE_PHONE_SCHEMA = z
  .string()
  .trim()
  .refine((value) => value.length > 0, {
    message: "Phone number is required.",
  })
  .refine((value) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (/^09\d{9}$/.test(digitsOnly)) return true;
    if (/^639\d{9}$/.test(digitsOnly)) return true;
    return false;
  }, {
    message: "Phone number must be a valid phone number.",
  });

const trimValue = (value: string) => value.trim();

const parseDateInput = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const validateName = (
  value: string,
  {
    label,
    required = true,
    minLength = 1,
    maxLength = 50,
  }: { label: string; required?: boolean; minLength?: number; maxLength?: number },
) => {
  const cleanValue = trimValue(value);

  if (!cleanValue) {
    return required ? `${label} is required.` : undefined;
  }

  if (cleanValue.length < minLength) {
    return `${label} must be at least ${minLength} character${minLength > 1 ? "s" : ""}.`;
  }

  if (maxLength && cleanValue.length > maxLength) {
    return `${label} must be at most ${maxLength} characters long.`;
  }

  if (!NAME_REGEX.test(cleanValue)) {
    return `${label} can only include letters, spaces, apostrophes, periods, and hyphens.`;
  }

  return undefined;
};

const validateEmail = (
  value: string,
  { label, required = true }: { label: string; required?: boolean },
) => {
  const cleanValue = trimValue(value);

  if (!cleanValue) {
    return required ? `${label} is required.` : undefined;
  }

  if (!EMAIL_REGEX.test(cleanValue)) {
    return `${label} is invalid.`;
  }

  return undefined;
};

const validatePhone = (
  value: string,
  { label, required = true }: { label: string; required?: boolean },
) => {
  const cleanValue = trimValue(value);

  if (!cleanValue) {
    return required ? `${label} is required.` : undefined;
  }

  const result = PHILIPPINE_PHONE_SCHEMA.safeParse(cleanValue);
  if (!result.success) {
    return `${label} must be a valid phone number.`;
  }

  return undefined;
};

export const sanitizePhoneInput = (value: string): string => {
  const digitsOnly = String(value || "").replace(/\D/g, "");
  if (digitsOnly.startsWith("63")) {
    return digitsOnly.slice(0, 12);
  }
  return digitsOnly.slice(0, 11);
};

const validateDateOfBirth = (value: string) => {
  if (!value) return "Date of birth is required.";

  const birthDate = parseDateInput(value);
  if (!birthDate) return "Date of birth is invalid.";

  const today = toStartOfDay(new Date());
  if (toStartOfDay(birthDate) > today) {
    return "Date of birth cannot be in the future.";
  }

  return undefined;
};

const validateEnrollmentDate = (value: string, dateOfBirth?: string) => {
  if (!value) return "Enrollment date is required.";

  const enrollmentDate = parseDateInput(value);
  if (!enrollmentDate) return "Enrollment date is invalid.";

  const today = toStartOfDay(new Date());
  if (toStartOfDay(enrollmentDate) > today) {
    return "Enrollment date cannot be in the future.";
  }

  const birthDate = parseDateInput(dateOfBirth || "");
  if (birthDate && toStartOfDay(enrollmentDate) < toStartOfDay(birthDate)) {
    return "Enrollment date cannot be earlier than date of birth.";
  }

  return undefined;
};

const validateSchoolYear = (value: string, enrollmentDate?: string) => {
  const cleanValue = trimValue(value);
  if (!cleanValue) return "School year is required.";

  const matches = SCHOOL_YEAR_REGEX.exec(cleanValue);
  if (!matches) return "School year must be in YYYY-YYYY format.";

  const startYear = Number(matches[1]);
  const endYear = Number(matches[2]);
  if (endYear !== startYear + 1) {
    return "School year range is invalid.";
  }

  const enrollment = parseDateInput(enrollmentDate || "");
  if (enrollment && startYear !== enrollment.getFullYear()) {
    return "School year must match enrollment date.";
  }

  return undefined;
};

const validateGender = (value: "male" | "female") => {
  if (value !== "male" && value !== "female") {
    return "Please select a valid gender.";
  }
  return undefined;
};

export type AddTeacherFormValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type AddTeacherField = keyof AddTeacherFormValues;
export type AddTeacherFormErrors = FieldErrors<AddTeacherField>;

export const validateAddTeacherField = (
  field: AddTeacherField,
  form: AddTeacherFormValues,
) => {
  switch (field) {
    case "firstName":
      return validateName(form.firstName, {
        label: "First name",
        minLength: 2,
        maxLength: 50,
      });
    case "middleName":
      return validateName(form.middleName, {
        label: "Middle name",
        minLength: 1,
        maxLength: 50,
      });
    case "lastName":
      return validateName(form.lastName, {
        label: "Last name",
        minLength: 2,
        maxLength: 50,
      });
    case "email":
      return validateEmail(form.email, { label: "Email" });
    case "phone":
      return validatePhone(form.phone, { label: "Phone number" });
    default:
      return undefined;
  }
};

export const validateAddTeacherForm = (form: AddTeacherFormValues) => {
  const errors: AddTeacherFormErrors = {};
  const fields: AddTeacherField[] = [
    "firstName",
    "middleName",
    "lastName",
    "email",
    "phone",
  ];

  for (const field of fields) {
    const error = validateAddTeacherField(field, form);
    if (error) errors[field] = error;
  }

  return errors;
};

export type AddChildFormValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  gender: "male" | "female";
  enrollmentDate: string;
  schoolYear: string;
  parentLastName: string;
  parentFirstName: string;
  parentMiddleName: string;
  parentEmail: string;
  parentPhone: string;
};

export type AddChildField = keyof AddChildFormValues;
export type AddChildFormErrors = FieldErrors<AddChildField>;
type AddChildValidationOptions = { requireParentInfo: boolean };

export const validateAddChildField = (
  field: AddChildField,
  form: AddChildFormValues,
  options: AddChildValidationOptions,
) => {
  switch (field) {
    case "firstName":
      return validateName(form.firstName, {
        label: "First name",
        minLength: 2,
        maxLength: 50,
      });
    case "middleName":
      return validateName(form.middleName, {
        label: "Middle name",
        required: false,
        minLength: 1,
        maxLength: 50,
      });
    case "lastName":
      return validateName(form.lastName, {
        label: "Last name",
        minLength: 2,
        maxLength: 50,
      });
    case "dateOfBirth":
      return validateDateOfBirth(form.dateOfBirth);
    case "gender":
      return validateGender(form.gender);
    case "enrollmentDate":
      return validateEnrollmentDate(form.enrollmentDate, form.dateOfBirth);
    case "schoolYear":
      return validateSchoolYear(form.schoolYear, form.enrollmentDate);
    case "parentFirstName":
      return validateName(form.parentFirstName, {
        label: "Parent first name",
        required: options.requireParentInfo,
        minLength: 2,
        maxLength: 50,
      });
    case "parentMiddleName":
      return validateName(form.parentMiddleName, {
        label: "Parent middle name",
        required: false,
        minLength: 1,
        maxLength: 50,
      });
    case "parentLastName":
      return validateName(form.parentLastName, {
        label: "Parent last name",
        required: options.requireParentInfo,
        minLength: 2,
        maxLength: 50,
      });
    case "parentEmail":
      return validateEmail(form.parentEmail, {
        label: "Parent email",
        required: options.requireParentInfo,
      });
    case "parentPhone":
      return validatePhone(form.parentPhone, {
        label: "Parent phone number",
        required: options.requireParentInfo,
      });
    case "age":
      return undefined;
    default:
      return undefined;
  }
};

export const validateAddChildForm = (
  form: AddChildFormValues,
  options: AddChildValidationOptions,
) => {
  const errors: AddChildFormErrors = {};
  const fields: AddChildField[] = [
    "firstName",
    "middleName",
    "lastName",
    "dateOfBirth",
    "gender",
    "enrollmentDate",
    "schoolYear",
    "parentFirstName",
    "parentMiddleName",
    "parentLastName",
    "parentEmail",
    "parentPhone",
  ];

  for (const field of fields) {
    const error = validateAddChildField(field, form, options);
    if (error) errors[field] = error;
  }

  return errors;
};

export type AddChildForParentFormValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  gender: "male" | "female";
  enrollmentDate: string;
  schoolYear: string;
};

export type AddChildForParentField = keyof AddChildForParentFormValues;
export type AddChildForParentFormErrors = FieldErrors<AddChildForParentField>;

export const validateAddChildForParentField = (
  field: AddChildForParentField,
  form: AddChildForParentFormValues,
) => {
  switch (field) {
    case "firstName":
      return validateName(form.firstName, {
        label: "First name",
        minLength: 2,
        maxLength: 50,
      });
    case "middleName":
      return validateName(form.middleName, {
        label: "Middle name",
        required: false,
        minLength: 1,
        maxLength: 50,
      });
    case "lastName":
      return validateName(form.lastName, {
        label: "Last name",
        minLength: 2,
        maxLength: 50,
      });
    case "dateOfBirth":
      return validateDateOfBirth(form.dateOfBirth);
    case "gender":
      return validateGender(form.gender);
    case "enrollmentDate":
      return validateEnrollmentDate(form.enrollmentDate, form.dateOfBirth);
    case "schoolYear":
      return validateSchoolYear(form.schoolYear, form.enrollmentDate);
    case "age":
      return undefined;
    default:
      return undefined;
  }
};

export const validateAddChildForParentForm = (
  form: AddChildForParentFormValues,
) => {
  const errors: AddChildForParentFormErrors = {};
  const fields: AddChildForParentField[] = [
    "firstName",
    "middleName",
    "lastName",
    "dateOfBirth",
    "gender",
    "enrollmentDate",
    "schoolYear",
  ];

  for (const field of fields) {
    const error = validateAddChildForParentField(field, form);
    if (error) errors[field] = error;
  }

  return errors;
};
