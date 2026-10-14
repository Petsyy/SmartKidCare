type LogMeta = Record<string, unknown> | undefined;

const levelIcon = {
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
  debug: "🔎",
} as const;

const serializeMeta = (meta: LogMeta): string => {
  if (!meta) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " {\"logMeta\":\"unserializable\"}";
  }
};

const writeLog = (
  method: "info" | "warn" | "error" | "debug",
  message: string,
  meta?: LogMeta,
) => {
  const payload = `${new Date().toISOString()} ${levelIcon[method]} ${message}${serializeMeta(meta)}`;

  if (method === "debug") {
    if (process.env.NODE_ENV !== "production") {
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
