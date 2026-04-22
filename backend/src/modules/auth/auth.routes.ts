import { Router } from "express";
import {
  login,
  getCsrf,
  getMe,
  updateMe,
  updateAdminPreferences,
  getAllUsers,
  logout,
  verifyAdminLoginMfa,
  resendAdminLoginMfa,
  verifyTeacherPasswordOtp,
  resendTeacherPasswordOtp,
  completeTeacherPasswordSetup,
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword,
  requestChangePasswordOtp,
  changePassword,
  validateAdminMfaResend,
  validateAdminMfaVerify,
  validateChangePassword,
  validateChangePasswordOtpRequest,
  validateUpdateMe,
  validateAdminPreferences,
  validateForgotPasswordRequest,
  validateForgotPasswordReset,
  validateForgotPasswordVerify,
  validateGetUsersQuery,
  validateLogin,
  validateOtpVerify,
  validatePasswordSetup,
  validateResendOtp,
} from "./index";
import { authenticateToken } from "../../shared/middleware/auth.middleware";
import {
  adminMfaResendCooldownLimiter,
  adminMfaSendLimiter,
  adminMfaVerifyLimiter,
  authenticatedOtpResendCooldownLimiter,
  authenticatedOtpSendLimiter,
  loginLimiter,
  otpResendCooldownLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
} from "../../shared/lib/rateLimit";

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
  "/change-password/otp/request",
  authenticateToken,
  validateChangePasswordOtpRequest,
  authenticatedOtpSendLimiter,
  authenticatedOtpResendCooldownLimiter,
  requestChangePasswordOtp,
);
router.post(
  "/change-password",
  authenticateToken,
  validateChangePassword,
  changePassword,
);
router.get("/csrf", authenticateToken, getCsrf);
router.get("/me", authenticateToken, getMe);
router.patch("/me", authenticateToken, validateUpdateMe, updateMe);
router.patch(
  "/me/preferences",
  authenticateToken,
  validateAdminPreferences,
  updateAdminPreferences,
);
router.post("/logout", authenticateToken, logout);

/**
 * Admin-only
 */
router.get("/users", authenticateToken, validateGetUsersQuery, getAllUsers);

export default router;

