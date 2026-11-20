import { z } from "zod";

export const AUTH_USERNAME_MAX_LENGTH = 64;
export const AUTH_LOGIN_IDENTIFIER_MAX_LENGTH = 254;
export const AUTH_PASSWORD_MAX_LENGTH = 128;
export const AUTH_OTP_LENGTH = 6;

export const sanitizeNoWhitespace = (value: string): string =>
  value.replace(/\s/g, "");

export const sanitizeOtp = (value: string): string =>
  value.replace(/\D/g, "").slice(0, AUTH_OTP_LENGTH);

export const noWhitespaceString = (label: string, maximumLength: number) =>
  z
    .string()
    .min(1, `${label} is required.`)
    .max(maximumLength, `${label} must not exceed ${maximumLength} characters.`)
    .refine((value) => !/\s/.test(value), `${label} cannot contain spaces.`);
