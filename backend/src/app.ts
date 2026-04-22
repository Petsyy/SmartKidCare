import express from "express";
import cors, { CorsOptions } from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import { auditLogMiddleware } from "./shared/middleware/audit-log.middleware";
import { globalErrorHandler } from "./shared/middleware/error-handler.middleware";
import { AppErrorHandler, AppRequestHandler } from "./shared/types/app.types";

import authRoutes from "./modules/auth/auth.routes";
import childRoutes from "./modules/child/child.routes";
import adminRoutes from "./modules/admin/admin.routes";
import recordsRoutes from "./modules/records/records.routes";
import aiRoutes from "./modules/ai/ai.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import documentsRoutes from "./modules/child/documents/documents.routes";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
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

const configuredOrigins = String(process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter((origin) => Boolean(origin) && origin !== "*");

const devOrigins = isProduction
  ? []
  : DEV_DEFAULT_ORIGINS.map((origin) => normalizeOrigin(origin));

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

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(CORS_BLOCKED_ERROR_MESSAGE));
  },
  credentials: true,
};

const sanitizeRequestInput: AppRequestHandler = (req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
};

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  skip: (req) => {
    const method = String(req.method || "").toUpperCase();
    if (method === "OPTIONS") {
      return true;
    }

    const hasSessionCookie = Boolean(req.cookies?.authToken);
    const hasAuthHeader = Boolean(
      req.headers.authorization?.startsWith("Bearer "),
    );

    return method === "GET" && (hasSessionCookie || hasAuthHeader);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const corsErrorHandler: AppErrorHandler = (error, req, res, next) => {
  if (error instanceof Error && error.message === CORS_BLOCKED_ERROR_MESSAGE) {
    res.status(403).json({
      message: "CORS blocked this origin.",
      origin: String(req.get("origin") || ""),
    });
    return;
  }

  next(error);
};

app.disable("x-powered-by");

app.use(cookieParser());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(sanitizeRequestInput);
app.use(auditLogMiddleware);

app.get("/", (_req, res) => {
  res.json({ message: "SmartKidCare API running" });
});

app.use("/api/notifications", notificationRoutes);
app.use(limiter);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/documents", documentsRoutes);

app.use(corsErrorHandler);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Global error handler — must be last
app.use(globalErrorHandler);

export default app;
