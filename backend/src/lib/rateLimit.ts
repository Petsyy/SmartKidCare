import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const otpKeyGenerator = (req: any) =>
  `${ipKeyGenerator(req.ip)}:${String(req.body?.email || "")
    .trim()
    .toLowerCase()}`;

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    message:
      "Too many authentication attempts from this IP, please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyGenerator: otpKeyGenerator,
  message: {
    message:
      "Too many OTP verification attempts. Please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpSendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator: otpKeyGenerator,
  message: {
    message: "Too many OTP requests. Please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpResendCooldownLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  keyGenerator: otpKeyGenerator,
  message: {
    message: "Please wait 1 minute before requesting another OTP.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
