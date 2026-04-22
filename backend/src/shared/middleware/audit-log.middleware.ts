import { NextFunction, Request as ExpressRequest, Response } from "express";
import mongoose from "mongoose";

interface Request extends ExpressRequest {
  user?: {
    id: string;
    role: string;
  };
}
import mongoSanitize from "express-mongo-sanitize";
import AuditLog from "../../models/AuditLog";

const AUDITED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "authtoken",
  "refreshtoken",
  "accesstoken",
  "otp",
  "code",
  "secret",
  "authorization",
]);
const MAX_STRING_LENGTH = 1000;
const MAX_ARRAY_LENGTH = 50;
const MAX_OBJECT_KEYS = 50;

type AuditResourceType =
  | "user"
  | "child"
  | "document"
  | "attendance"
  | "feeding"
  | "blockchain";

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const looksLikeJwt =
      /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9._-]+)?$/.test(trimmed);
    const looksLikeOpaqueToken =
      /^[A-Za-z0-9_\-]{40,}$/.test(trimmed) && !trimmed.includes(" ");
    if (looksLikeJwt || looksLikeOpaqueToken) return "[REDACTED]";
    if (value.length > MAX_STRING_LENGTH) {
      return `${value.slice(0, MAX_STRING_LENGTH)}...[TRUNCATED]`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    const limited = value.slice(0, MAX_ARRAY_LENGTH).map((item) => sanitizeValue(item));
    if (value.length > MAX_ARRAY_LENGTH) limited.push("[TRUNCATED_ARRAY_ITEMS]");
    return limited;
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    const entries = Object.entries(input).slice(0, MAX_OBJECT_KEYS);

    for (const [key, nestedValue] of entries) {
      const normalizedKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(normalizedKey)) {
        output[key] = "[REDACTED]";
        continue;
      }
      output[key] = sanitizeValue(nestedValue);
    }
    if (Object.keys(input).length > MAX_OBJECT_KEYS) {
      output.__truncated__ = true;
    }

    return output;
  }

  return value;
}

function safeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const cloned = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  mongoSanitize.sanitize(cloned);

  return sanitizeValue(cloned) as Record<string, unknown>;
}

function resolveResourceId(req: Request): string | undefined {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const bodyRecord = body as Record<string, unknown>;
  const candidate =
    req.params?.id ??
    req.params?.childId ??
    req.params?.parentId ??
    req.params?.teacherId ??
    req.params?.userId ??
    bodyRecord.childId ??
    bodyRecord.userId ??
    bodyRecord.parentId ??
    bodyRecord.teacherId ??
    bodyRecord.attendanceId ??
    bodyRecord.feedingId;

  const normalized =
    typeof candidate === "string" || typeof candidate === "number"
      ? String(candidate).trim()
      : "";
  return normalized.length > 0 ? normalized : undefined;
}

function resolveResourceType(path: string): AuditResourceType | undefined {
  const normalized = path.toLowerCase();

  if (normalized.includes("/records/attendance")) return "attendance";
  if (normalized.includes("/records/feeding")) return "feeding";
  if (normalized.includes("/documents")) return "document";
  if (normalized.includes("/blockchain")) return "blockchain";
  if (normalized.includes("/children")) return "child";
  if (normalized.includes("/users")) return "user";

  return undefined;
}

function resolveAction(params: {
  method: string;
  path: string;
  resourceType?: AuditResourceType;
}): string {
  const { method, path, resourceType } = params;
  const baseAction =
    method === "POST"
      ? "create"
      : method === "PATCH" || method === "PUT"
        ? "update"
        : method === "DELETE"
          ? "delete"
          : "write";

  return resourceType ? `${resourceType}.${baseAction}` : `${baseAction}:${path}`;
}

function resolveDescription(params: {
  actorRole: "admin" | "teacher" | "parent" | "unknown";
  method: string;
  path: string;
  resourceType?: AuditResourceType;
}): string {
  const { actorRole, method, path, resourceType } = params;
  return resourceType
    ? `${actorRole} performed ${method} on ${resourceType}.`
    : `${actorRole} performed ${method} on ${path}.`;
}

function parseActorId(req: Request): mongoose.Types.ObjectId | undefined {
  const actorId = String(req.user?.id ?? "").trim();
  if (!actorId || !mongoose.Types.ObjectId.isValid(actorId)) return undefined;
  return new mongoose.Types.ObjectId(actorId);
}

export const auditLogMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const method = String(req.method || "").toUpperCase();
    const baseUrl = String(req.baseUrl || "");
    const routePath = String(req.path || "");
    const path = `${baseUrl}${routePath}` || String(req.originalUrl || "");

    // Keep logging focused on authenticated write actions.
    if (!AUDITED_METHODS.has(method)) return;
    if (!path.startsWith("/api/")) return;
    if (!req.user?.id) return;

    const actorId = parseActorId(req);
    const actorRole =
      req.user?.role === "admin" ||
      req.user?.role === "teacher" ||
      req.user?.role === "parent"
        ? req.user.role
        : "unknown";
    const statusCode = Number(res.statusCode || 0);
    const success = statusCode >= 200 && statusCode < 400;
    const resourceType = resolveResourceType(path);
    const action = resolveAction({ method, path, resourceType });
    const description = resolveDescription({
      actorRole,
      method,
      path,
      resourceType,
    });
    const logPayload = {
      actorId,
      actorRole,
      method,
      path,
      action,
      description,
      statusCode,
      success,
      resourceType,
      resourceId: resolveResourceId(req),
      ip: req.ip ?? undefined,
      userAgent: String(req.get("user-agent") || ""),
      durationMs: Date.now() - startedAt,
      errorMessage: success ? undefined : `Request failed with status ${statusCode}.`,
      request: {
        params: safeObject(req.params),
        query: safeObject(req.query),
        body: safeObject(req.body),
      },
    };

    void AuditLog.create(logPayload).catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "unknown audit log error";
      console.error("Failed to write audit log:", message);
    });
  });

  next();
};
