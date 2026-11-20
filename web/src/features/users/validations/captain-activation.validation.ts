import { z } from "zod";
import { newPasswordSchema, confirmPasswordSchema } from "@/features/auth";

export const captainActivationSchema = z
  .object({
    token: z.string().min(1, "The invitation link is incomplete."),
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type CaptainActivationFormValues = z.infer<typeof captainActivationSchema>;
