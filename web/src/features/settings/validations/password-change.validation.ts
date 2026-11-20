import { z } from "zod";
import {
  newPasswordSchema,
  confirmPasswordSchema,
  otpSchema,
  AUTH_PASSWORD_MAX_LENGTH,
  noWhitespaceString,
} from "@/features/auth";

export const currentPasswordSchema = noWhitespaceString(
  "Current password",
  AUTH_PASSWORD_MAX_LENGTH,
);

export const passwordChangeRequestSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .superRefine((values, context) => {
    if (values.currentPassword === values.newPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "New password must be different from current password.",
      });
    }
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "New password and confirmation do not match.",
      });
    }
  });

export const passwordChangeFormSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
    otp: otpSchema,
  })
  .superRefine((values, context) => {
    if (values.currentPassword === values.newPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "New password must be different from current password.",
      });
    }
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "New password and confirmation do not match.",
      });
    }
  });

export type PasswordChangeFormValues = z.infer<typeof passwordChangeFormSchema>;
