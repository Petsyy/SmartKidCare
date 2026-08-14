import type { CorsOptions } from "cors";

import type { AppErrorHandler } from "../types/app.types";

const CORS_BLOCKED_ERROR_MESSAGE = "Not allowed by CORS";

const DEV_DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
];

const normalizeOrigin = (value: string): string => {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  try {
    return new URL(trimmed).origin.toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
};

const isProduction = process.env.NODE_ENV === "production";
const configuredOrigins = String(process.env.FRONTEND_URL || "")
  .split(",")
  .map(normalizeOrigin)
  .filter((origin) => Boolean(origin) && origin !== "*");
const devOrigins = isProduction ? [] : DEV_DEFAULT_ORIGINS.map(normalizeOrigin);
const allowedOrigins = Array.from(new Set([...configuredOrigins, ...devOrigins]));

const allowAllOriginsInDev =
  !isProduction &&
  String(process.env.CORS_DEV_ALLOW_ALL_ORIGINS ?? "true")
    .trim()
    .toLowerCase() !== "false";

const isOriginAllowed = (origin: string): boolean => {
  if (allowAllOriginsInDev) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin);
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(CORS_BLOCKED_ERROR_MESSAGE));
  },
  credentials: true,
};

export const corsErrorHandler: AppErrorHandler = (error, req, res, next) => {
  if (error instanceof Error && error.message === CORS_BLOCKED_ERROR_MESSAGE) {
    res.status(403).json({
      message: "CORS blocked this origin.",
      origin: String(req.get("origin") || ""),
    });
    return;
  }

  next(error);
};
