import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(1)
  .max(150)
  .refine(
    (value) => /[\p{L}\p{N}]/u.test(value),
    "Name must contain letters or numbers.",
  );
const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must use YYYY-MM-DD.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      date <= new Date()
    );
  }, "Date of birth must be a valid non-future date.");

const parentIdBody = z
  .object({
    documentType: z.literal("parentId"),
    parentFirstName: name.optional(),
    parentMiddleName: name.optional(),
    parentLastName: name.optional(),
    parentFullName: name.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasComponents = Boolean(
      value.parentFirstName && value.parentLastName,
    );
    if (!hasComponents && !value.parentFullName) {
      context.addIssue({
        code: "custom",
        message: "Parent first and last names are required.",
      });
    }
    if (
      (value.parentFirstName && !value.parentLastName) ||
      (!value.parentFirstName && value.parentLastName)
    ) {
      context.addIssue({
        code: "custom",
        message: "Parent first and last names must be provided together.",
      });
    }
  });

export const verifyDocumentBodySchema = z.union([
  z
    .object({
      documentType: z.literal("birthCertificate"),
      childFullName: name,
      dateOfBirth: ymd,
    })
    .strict(),
  parentIdBody,
]);

export const confirmationParamsSchema = z.object({
  verificationId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid verification ID."),
});
