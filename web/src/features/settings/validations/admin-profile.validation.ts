import { z } from "zod";

export const adminProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required."),
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required."),
  middleName: z
    .string()
    .trim()
    .min(1, "Middle name is required."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Email is invalid."),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required."),
});

export type AdminProfileFormValues = z.infer<typeof adminProfileSchema>;
