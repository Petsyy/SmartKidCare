import rateLimit from "express-rate-limit";

export const globalApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  skip: (req) => {
    const method = String(req.method || "").toUpperCase();
    if (method === "OPTIONS") return true;

    const hasSessionCookie = Boolean(req.cookies?.authToken);
    const hasAuthHeader = Boolean(
      req.headers.authorization?.startsWith("Bearer "),
    );

    return method === "GET" && (hasSessionCookie || hasAuthHeader);
  },
  standardHeaders: true,
  legacyHeaders: false,
});
