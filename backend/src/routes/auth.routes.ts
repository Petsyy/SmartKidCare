import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, getMe, getAllUsers } from "../controllers/auth.controller";
import {
  verifyTeacherPasswordOtp,
  resendTeacherPasswordOtp,
  completeTeacherPasswordSetup,
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword,
  changePassword,
} from "../controllers/auth.password.controller";
import { authenticateToken } from "../middlewares/auth.middleware";


const router = Router();

// Stricter rate limiter for auth endpoints (e.g., login): 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    message: "Too many authentication attempts from this IP, please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth
 */
router.post("/login", authLimiter, login);
router.post("/admin/login", authLimiter, login);
router.post("/password-otp/verify", verifyTeacherPasswordOtp);
router.post("/password-otp/resend", resendTeacherPasswordOtp);
router.post("/password/setup", completeTeacherPasswordSetup);
router.post("/forgot-password/request", requestForgotPasswordOtp);
router.post("/forgot-password/verify", verifyForgotPasswordOtp);
router.post("/forgot-password/reset", resetForgotPassword);
router.post("/change-password", authenticateToken, changePassword);
router.get("/me", authenticateToken, getMe);

/**
 * Admin-only
 */
router.get("/users", authenticateToken, getAllUsers);

export default router;
