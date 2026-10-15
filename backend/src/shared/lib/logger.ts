type LogMeta = Record<string, unknown> | undefined;

const levelIcon = {
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
  debug: "🔎",
} as const;

const formatLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

const formatValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(
        ([key, nestedValue]) =>
          `${formatLabel(key)}=${formatValue(nestedValue)}`,
      )
      .join(", ");
  }
  return String(value);
};

const formatMeta = (meta: LogMeta): string => {
  if (!meta) return "";
  try {
    const details = Object.entries(meta)
      .map(([key, value]) => `${formatLabel(key)}: ${formatValue(value)}`)
      .join(" | ");
    return details ? ` | ${details}` : "";
  } catch {
    return " | Details unavailable";
  }
};

const writeLog = (
  method: "info" | "warn" | "error" | "debug",
  message: string,
  meta?: LogMeta,
) => {
  const payload = `${levelIcon[method]} ${message}${formatMeta(meta)}`;

  if (method === "debug") {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.LOG_LEVEL?.toLowerCase() === "debug"
    ) {
      console.debug(payload);
    }
    return;
  }

  console[method](payload);
};

export const logger = {
  info: (message: string, meta?: LogMeta) => writeLog("info", message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog("warn", message, meta),
  error: (message: string, meta?: LogMeta) => writeLog("error", message, meta),
  debug: (message: string, meta?: LogMeta) => writeLog("debug", message, meta),
};
