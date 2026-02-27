import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { Response } from "express";

export const CSRF_COOKIE_NAME = "csrfToken";
export const CSRF_HEADER_NAME = "x-csrf-token";

const CSRF_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const getCsrfSecret = () => {
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("CSRF_SECRET or JWT_SECRET must be configured");
  }
  return secret;
};

const computeSignature = (authToken: string, nonce: string): string =>
  createHmac("sha256", getCsrfSecret())
    .update(`${authToken}:${nonce}`)
    .digest("hex");

const isValidHex = (value: string) => /^[a-f0-9]+$/i.test(value);

export const createCsrfToken = (authToken: string): string => {
  const nonce = randomBytes(16).toString("hex");
  const signature = computeSignature(authToken, nonce);
  return `${nonce}.${signature}`;
};

export const verifyCsrfToken = (
  authToken: string,
  token: string,
): boolean => {
  const [nonce, signature, extra] = String(token || "").split(".");
  if (!nonce || !signature || extra) {
    return false;
  }

  if (!isValidHex(signature)) {
    return false;
  }

  const expectedSignature = computeSignature(authToken, nonce);
  const receivedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
};

export const setCsrfCookie = (res: Response, authToken: string): string => {
  const csrfToken = createCsrfToken(authToken);

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: false, // true in production
    sameSite: "lax",
    maxAge: CSRF_TOKEN_MAX_AGE_MS,
  });

  return csrfToken;
};

export const clearCsrfCookie = (res: Response) => {
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: false, // true in production
    sameSite: "lax",
  });
};
