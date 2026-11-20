import { z } from "zod";
import {
  AUTH_USERNAME_MAX_LENGTH,
  AUTH_LOGIN_IDENTIFIER_MAX_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
  noWhitespaceString,
} from "./auth-fields.validation";
import { captainPasswordSetupSchema } from "./password-setup.validation";

export const usernameSchema = noWhitespaceString(
  "Username",
  AUTH_USERNAME_MAX_LENGTH,
)
  .min(3, "Username must be at least 3 characters.")
  .regex(/^[A-Za-z]/, "Username must start with a letter.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Username may contain only letters, numbers, periods, underscores, and hyphens.",
  );

export const adminLoginIdentifierSchema = noWhitespaceString(
  "Username or email",
  AUTH_LOGIN_IDENTIFIER_MAX_LENGTH,
).superRefine((value, context) => {
  const isUsername = usernameSchema.safeParse(value).success;
  const isEmail = z.string().email().safeParse(value).success;

  if (!isUsername && !isEmail) {
    context.addIssue({
      code: "custom",
      message: "Enter a valid username or email address.",
    });
  }
});

export const loginPasswordSchema = noWhitespaceString(
  "Password",
  AUTH_PASSWORD_MAX_LENGTH,
);

export const loginCredentialsSchema = z.object({
  username: adminLoginIdentifierSchema,
  password: loginPasswordSchema,
});

export const adminLoginFormSchema = z
  .object({
    flowMode: z.enum(["credentials", "passwordSetup"]),
    username: z.string(),
    password: z.string(),
    otp: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const result =
      values.flowMode === "credentials"
        ? loginCredentialsSchema.safeParse(values)
        : captainPasswordSetupSchema.safeParse(values);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        context.addIssue({
          code: "custom",
          path: issue.path,
          message: issue.message,
        });
      });
    }
  });

export type AdminLoginFormValues = z.infer<typeof adminLoginFormSchema>;
