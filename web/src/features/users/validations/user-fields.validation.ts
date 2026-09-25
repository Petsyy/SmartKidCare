import { z } from "zod";

const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;
const STRICT_EMAIL_REGEX = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const ACCEPTED_EMAIL_DOMAINS = [
  "aol.com",
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "rocketmail.com",
  "yahoo.com",
  "ymail.com",
  "zoho.com",
];

const usesAcceptedEmailDomain = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";

  return ACCEPTED_EMAIL_DOMAINS.includes(domain);
};

export const userNameSchema = (label: string, minLength = 2, maxLength = 50) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .min(minLength, `${label} is too short.`)
    .max(maxLength, `${label} is too long.`)
    .regex(NAME_REGEX, `${label} contains invalid characters.`);

export const optionalUserNameSchema = (label: string, maxLength = 50) =>
  z
    .string()
    .trim()
    .max(maxLength, `${label} is too long.`)
    .refine(
      (value) => value.length === 0 || NAME_REGEX.test(value),
      `${label} contains invalid characters.`,
    );

export const userEmailSchema = (label = "Email") =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(254, `${label} is too long.`)
    .email(`${label} is invalid.`)
    .refine((value) => !/\s/.test(value), `${label} cannot contain spaces.`)
    .refine(
      (value) => (value.split("@")[0]?.length ?? 0) <= 64,
      `${label} address before @ is too long.`,
    )
    .regex(
      STRICT_EMAIL_REGEX,
      `${label} must include a valid domain, such as name@gmail.com.`,
    )
    .refine(
      (value) => usesAcceptedEmailDomain(value),
      `${label} must use a supported email provider such as Gmail, Yahoo, Outlook, Hotmail, iCloud, Proton, or Zoho.`,
    );

export const userPhoneSchema = (label = "Phone") =>
  z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => {
      const digitsOnly = value.replace(/\D/g, "");
      return /^09\d{9}$/.test(digitsOnly) || /^639\d{9}$/.test(digitsOnly);
    }, `${label} is invalid.`);
