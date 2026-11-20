import { z } from "zod";

export const systemSettingsSchema = z.object({
  schoolName: z
    .string()
    .trim()
    .min(1, "Daycare / school name is required."),
  address: z
    .string()
    .trim()
    .min(1, "Address is required."),
});

export type SystemSettingsFormValues = z.infer<typeof systemSettingsSchema>;
