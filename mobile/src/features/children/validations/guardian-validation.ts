import { z } from "zod";

const NAME_REGEX = /^[a-zA-Z\s\-']+$/;
const PH_PHONE_REGEX = /^09\d{9}$/;

const nameSchema = (label: string) =>
  z
    .string({ required_error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .min(2, `${label} is too short.`)
    .max(30, `${label} must be at most 30 characters.`)
    .regex(/^(?!.*\s{2,})/, `${label} cannot contain consecutive spaces.`)
    .regex(NAME_REGEX, `${label} contains invalid characters.`)
    .refine((val) => {
      const words = val.toLowerCase().split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        if (words[i] === words[i + 1]) return false;
      }
      return true;
    }, `${label} cannot contain the same word twice in a row.`);

export const guardianSchema = z
  .object({
    firstName: nameSchema("First name"),
    lastName: nameSchema("Last name"),
    relationship: z.enum(
      ["Mother", "Father", "Guardian", "Grandparent", "Other"],
      { required_error: "Relationship is required." },
    ),
    customRelationship: z.string().nullable().optional(),
    phone: z
      .string({ required_error: "Phone number is required." })
      .trim()
      .min(1, "Phone number is required.")
      .length(11, "Phone number must be exactly 11 digits.")
      .regex(PH_PHONE_REGEX, "Phone must start with 09 and be 11 digits."),
  })
  .superRefine((data, ctx) => {
    if (
      data.relationship === "Other" &&
      (!data.customRelationship || !data.customRelationship.trim())
    ) {
      ctx.addIssue({
        path: ["customRelationship"],
        message: "Please specify the relationship",
        code: z.ZodIssueCode.custom,
      });
    }
  });

export type GuardianFormValues = z.infer<typeof guardianSchema>;
