import { Router } from "express";
import { login, getCsrf, getMe, updateMe, updateAdminPreferences, getAllUsers, logout } from "../controllers/session.controller";
import { verifyAdminLoginMfa, resendAdminLoginMfa } from "../controllers/mfa.controller";
import {
  verifyTeacherPasswordOtp,
  resendTeacherPasswordOtp,
  completeTeacherPasswordSetup,
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword,
  requestChangePasswordOtp,
  changePassword,
} from "../controllers/password-otp.controller";
import {
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
} from "../validators/auth.validator";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
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
} from "../../../shared/lib/rate-limit";

const router = Router();

/**
 * Public Authentication Routes
 */
router.post("/login", loginLimiter, validateLogin, login);
router.post("/admin/login", loginLimiter, validateLogin, login);
router.post("/admin/mfa/verify", validateAdminMfaVerify, adminMfaVerifyLimiter, verifyAdminLoginMfa);
router.post("/admin/mfa/resend", validateAdminMfaResend, adminMfaSendLimiter, adminMfaResendCooldownLimiter, resendAdminLoginMfa);
router.post("/password-otp/verify", validateOtpVerify, otpVerifyLimiter, verifyTeacherPasswordOtp);
router.post("/password-otp/resend", validateResendOtp, otpSendLimiter, otpResendCooldownLimiter, resendTeacherPasswordOtp);
router.post("/password/setup", validatePasswordSetup, completeTeacherPasswordSetup);
router.post("/forgot-password/request", validateForgotPasswordRequest, otpSendLimiter, otpResendCooldownLimiter, requestForgotPasswordOtp);
router.post("/forgot-password/verify", validateForgotPasswordVerify, otpVerifyLimiter, verifyForgotPasswordOtp);
router.post("/forgot-password/reset", validateForgotPasswordReset, resetForgotPassword);

/**
 * Authenticated Common User Routes (Admin, Teacher, Parent)
 */
router.post("/change-password/otp/request", authenticateToken, validateChangePasswordOtpRequest, authenticatedOtpSendLimiter, authenticatedOtpResendCooldownLimiter, requestChangePasswordOtp);
router.post("/change-password", authenticateToken, validateChangePassword, changePassword);
router.get("/csrf", authenticateToken, getCsrf);
router.get("/me", authenticateToken, getMe);
router.patch("/me", authenticateToken, validateUpdateMe, updateMe);
router.post("/logout", authenticateToken, logout);

/**
 * Admin-Only Auth Routes
 */
router.patch("/me/preferences", authenticateToken, requireRole("admin"), validateAdminPreferences, updateAdminPreferences);
router.get("/users", authenticateToken, requireRole("admin"), validateGetUsersQuery, getAllUsers);

export default router;
