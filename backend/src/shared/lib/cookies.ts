import { CookieOptions } from "express";

const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const isProduction = () => process.env.NODE_ENV === "production";

const getSharedCookieOptions = (httpOnly: boolean): CookieOptions => ({
  httpOnly,
  secure: isProduction(),
  sameSite: isProduction() ? "none" : "lax",
  path: "/",
});

export const getAuthCookieOptions = (): CookieOptions => ({
  ...getSharedCookieOptions(true),
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
});

export const getCsrfCookieOptions = (
  maxAge: number,
): CookieOptions => ({
  ...getSharedCookieOptions(false),
  maxAge,
});

export const getExpiredCookieOptions = (httpOnly: boolean): CookieOptions =>
  getSharedCookieOptions(httpOnly);