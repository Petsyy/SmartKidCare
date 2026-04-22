type LogMeta = Record<string, unknown> | undefined;

const writeLog = (
  method: "info" | "warn" | "error" | "debug",
  message: string,
  meta?: LogMeta,
) => {
  const payload = meta ? [message, meta] : [message];

  if (method === "debug") {
    if (process.env.NODE_ENV !== "production") {
      console.debug(...payload);
    }
    return;
  }

  console[method](...payload);
};

export const logger = {
  info: (message: string, meta?: LogMeta) => writeLog("info", message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog("warn", message, meta),
  error: (message: string, meta?: LogMeta) => writeLog("error", message, meta),
  debug: (message: string, meta?: LogMeta) => writeLog("debug", message, meta),
};
