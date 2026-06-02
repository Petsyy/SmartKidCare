import bcrypt from "bcryptjs";
import {
  signAuthToken,
  maybeRequireParentPasswordChange,
  maybeRequireTeacherPasswordChange,
} from "./password.controller";
import {
  issueAdminLoginOtp,
  mapOtpDeliveryError,
  maskEmail,
  setAdminAuthCookie,
} from "./admin-login-mfa.service";
import { Response } from "express";
import {
  authUserRepository,
  authChildRepository,
} from "./auth.repository";

interface LoginCredentials {
  identifier: string;
  password: string;
  isAdminRoute: boolean;
}

interface UpdateUserPayload {
  username?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface AdminPreferencesPayload {
  adminMfaEnabled?: boolean;
  adminNotifySecurityEvents?: boolean;
  adminNotifySystemUpdates?: boolean;
}

interface LinkedChild {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId: string;
  source: string;
  status: string;
}

interface UserWithChildren {
  [key: string]: any;
  linkedChildren?: LinkedChild[];
}

/**
 * Find user by email or identifier
 */
export const findUserByIdentifier = async (
  identifier: string,
  isAdminRoute: boolean
): Promise<any> => {
  return authUserRepository.findByIdentifier(identifier, isAdminRoute);
};

/**
 * Validate password against stored hash
 */
export const validatePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(String(password), hashedPassword);
};

/**
 * Sanitize user response (remove password field)
 */
export const sanitizeUserResponse = (user: any): any => {
  const userResponse = user.toObject?.() ?? user;
  delete (userResponse as any).password;
  return userResponse;
};

/**
 * Handle admin login flow with MFA
 */
export const handleAdminLogin = async (user: any, res: Response) => {
  if (user.adminMfaEnabled === false) {
    const token = signAuthToken(String(user._id), user.role);
    setAdminAuthCookie(res, token);
    return { user: sanitizeUserResponse(user) };
  }

  try {
    const mfaToken = await issueAdminLoginOtp(user);
    return {
      requiresMfa: true,
      mfaToken,
      email: maskEmail(user.email),
      message: "OTP sent to your admin email.",
    };
  } catch (error: any) {
    console.error("Admin login OTP send failed:", {
      email: user.email,
      code: error?.code,
      message: error?.message,
    });
    throw new Error(mapOtpDeliveryError(error));
  }
};

/**
 * Handle parent/teacher login flow
 */
export const handleTeacherParentLogin = (user: any) => {
  const token = signAuthToken(String(user._id), user.role);
  return {
    token,
    user: sanitizeUserResponse(user),
  };
};

/**
 * Login with credentials
 */
export const login = async (credentials: LoginCredentials, res: Response) => {
  const { identifier, password, isAdminRoute } = credentials;

  if (!identifier || !password) {
    throw new Error("Username and password are required");
  }

  const user = await findUserByIdentifier(identifier, isAdminRoute);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.isActive === false) {
    throw new Error("Account is deactivated");
  }

  const isValidPassword = await validatePassword(password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid credentials");
  }

  // Check for password change requirement
  if (await maybeRequireTeacherPasswordChange(user, res)) {
    return null;
  }
  if (await maybeRequireParentPasswordChange(user, res)) {
    return null;
  }

  // Handle admin login with MFA
  if (user.role === "admin") {
    return await handleAdminLogin(user, res);
  }

  // Handle parent/teacher login
  return handleTeacherParentLogin(user);
};

/**
 * Get user by ID with populated daycare center
 */
export const getUserById = async (userId: string): Promise<any> => {
  const user = await authUserRepository.findByIdWithPopulate(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Update user profile information
 */
export const updateUserProfile = async (
  userId: string,
  payload: UpdateUserPayload
): Promise<any> => {
  const user = await authUserRepository.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Update username (admin only)
  if (payload.username !== undefined) {
    if (user.role !== "admin") {
      throw new Error("Only admin accounts can update username.");
    }

    const normalizedUsername = String(payload.username).trim();
    const existingByUsername = await authUserRepository.findByUsernameExcluding(
      normalizedUsername,
      userId,
    );

    if (existingByUsername) {
      throw new Error("Username already in use.");
    }

    user.username = normalizedUsername;
  }

  // Update email
  if (payload.email !== undefined) {
    const normalizedEmail = String(payload.email).trim().toLowerCase();
    const existingByEmail = await authUserRepository.findByEmailExcluding(
      normalizedEmail,
      userId,
    );

    if (existingByEmail) {
      throw new Error("Email already in use.");
    }

    user.email = normalizedEmail;
  }

  // Update name fields
  if (payload.firstName !== undefined) {
    user.firstName = String(payload.firstName).trim();
  }

  if (payload.middleName !== undefined) {
    const normalizedMiddleName = String(payload.middleName).trim();
    user.middleName = normalizedMiddleName || undefined;
  }

  if (payload.lastName !== undefined) {
    user.lastName = String(payload.lastName).trim();
  }

  // Update phone
  if (payload.phone !== undefined) {
    const normalizedPhone = String(payload.phone).trim();
    user.phone = normalizedPhone || undefined;
  }

  await user.save();

  return sanitizeUserResponse(user);
};

/**
 * Update admin preferences
 */
export const updateAdminPreferences = async (
  userId: string,
  payload: AdminPreferencesPayload
): Promise<any> => {
  const user = await authUserRepository.findById(userId);

  if (!user || user.role !== "admin") {
    throw new Error("Admin account not found.");
  }

  if (typeof payload.adminMfaEnabled === "boolean") {
    user.adminMfaEnabled = payload.adminMfaEnabled;
  }

  if (typeof payload.adminNotifySecurityEvents === "boolean") {
    user.adminNotifySecurityEvents = payload.adminNotifySecurityEvents;
  }

  if (typeof payload.adminNotifySystemUpdates === "boolean") {
    user.adminNotifySystemUpdates = payload.adminNotifySystemUpdates;
  }

  await user.save();

  return {
    adminMfaEnabled: user.adminMfaEnabled !== false,
    adminNotifySecurityEvents: user.adminNotifySecurityEvents !== false,
    adminNotifySystemUpdates: user.adminNotifySystemUpdates !== false,
  };
};

/**
 * Get all users with optional role filter
 */
export const getAllUsers = async (role?: string): Promise<UserWithChildren[]> => {
  if (role === "parent") {
    const enrolledParentIds = await authChildRepository.findEnrolledParentIds();
    const users = await authUserRepository.findParentsByIds(enrolledParentIds);
    if (users.length > 0) {
      return await attachLinkedChildren(users);
    }
    return users;
  }

  return authUserRepository.findAllByRole(role);
};

/**
 * Attach linked children to parent users
 */
export const attachLinkedChildren = async (
  parentUsers: any[]
): Promise<UserWithChildren[]> => {
  const parentIds = parentUsers
    .map((user: any) => user._id)
    .filter(Boolean);

  const linkedChildren = await authChildRepository.findByParentIds(parentIds);

  const childrenByParentId = new Map<string, LinkedChild[]>();

  linkedChildren.forEach((child: any) => {
    const parentId = String(child.parent || "");
    if (!parentId) return;

    const list = childrenByParentId.get(parentId) ?? [];
    list.push({
      _id: String(child._id),
      firstName: child.firstName,
      middleName: child.middleName,
      lastName: child.lastName,
      studentId: child.studentId,
      source: "child",
      status: "linked",
    });
    childrenByParentId.set(parentId, list);
  });

  parentUsers.forEach((user: any) => {
    const parentId = String(user._id || "");
    user.linkedChildren = childrenByParentId.get(parentId) ?? [];
  });

  return parentUsers;
};
