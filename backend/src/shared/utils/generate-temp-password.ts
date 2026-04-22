import { randomInt } from "crypto";

const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateTempPassword = (length = 10): string =>
  Array.from(
    { length },
    () => TEMP_PASSWORD_ALPHABET[randomInt(0, TEMP_PASSWORD_ALPHABET.length)],
  ).join("");
