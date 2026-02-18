import { Router } from "express";
import {
  login,
  getMe,
  getAllUsers,
  logout,
} from "../controllers/auth/auth.controller";
import {
  verifyAdminLoginMfa,
  resendAdminLoginMfa,
} from "../controllers/auth/adminMfa.controller";
import {
  verifyTeacherPasswordOtp,
  resendTeacherPasswordOtp,
  completeTeacherPasswordSetup,
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword,
  changePassword,
} from "../controllers/auth/password.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  adminMfaResendCooldownLimiter,
  adminMfaSendLimiter,
  adminMfaVerifyLimiter,
  loginLimiter,
  otpResendCooldownLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
} from "../lib/rateLimit";
import {
  validateAdminMfaResend,
  validateAdminMfaVerify,
  validateChangePassword,
  validateForgotPasswordRequest,
  validateForgotPasswordReset,
  validateForgotPasswordVerify,
  validateGetUsersQuery,
  validateLogin,
  validateOtpVerify,
  validatePasswordSetup,
  validateResendOtp,
} from "../validators/auth.validator";

const router = Router();

/**
 * Auth
 */
router.post("/login", loginLimiter, validateLogin, login);
router.post("/admin/login", loginLimiter, validateLogin, login);
router.post(
  "/admin/mfa/verify",
  validateAdminMfaVerify,
  adminMfaVerifyLimiter,
  verifyAdminLoginMfa,
);
router.post(
  "/admin/mfa/resend",
  validateAdminMfaResend,
  adminMfaSendLimiter,
  adminMfaResendCooldownLimiter,
  resendAdminLoginMfa,
);
router.post(
  "/password-otp/verify",
  validateOtpVerify,
  otpVerifyLimiter,
  verifyTeacherPasswordOtp,
);
router.post(
  "/password-otp/resend",
  validateResendOtp,
  otpSendLimiter,
  otpResendCooldownLimiter,
  resendTeacherPasswordOtp,
);
router.post(
  "/password/setup",
  validatePasswordSetup,
  completeTeacherPasswordSetup,
);
router.post(
  "/forgot-password/request",
  validateForgotPasswordRequest,
  otpSendLimiter,
  otpResendCooldownLimiter,
  requestForgotPasswordOtp,
);
router.post(
  "/forgot-password/verify",
  validateForgotPasswordVerify,
  otpVerifyLimiter,
  verifyForgotPasswordOtp,
);
router.post(
  "/forgot-password/reset",
  validateForgotPasswordReset,
  resetForgotPassword,
);
router.post(
  "/change-password",
  authenticateToken,
  validateChangePassword,
  changePassword,
);
router.get("/me", authenticateToken, getMe);
router.post("/logout", logout);

/**
 * Admin-only
 */
router.get("/users", authenticateToken, validateGetUsersQuery, getAllUsers);

export default router;
