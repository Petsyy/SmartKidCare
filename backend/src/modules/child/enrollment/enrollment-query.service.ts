import ChildEnrollmentRequest from "../../../models/ChildEnrollmentRequest";
import ChildDevelopmentCenter from "../../../models/ChildDevelopmentCenter";
import User from "../../../models/Users";
import { ForbiddenError } from "../../../shared/errors/app-error";
import { normalizeString } from "../shared";

type AuthUser = {
  id?: string;
  role?: string;
};

export const getEnrollmentCenters = async (user?: AuthUser) => {
  if (!user?.id || user.role !== "teacher") {
    throw new ForbiddenError("Teachers only");
  }

  const teacher = await User.findById(user.id).select("daycareCenter").lean();
  if (!teacher?.daycareCenter) {
    return { centers: [] };
  }

  const centers = await ChildDevelopmentCenter.find({
    _id: teacher.daycareCenter,
    isActive: true,
  })
    .select("_id name barangay code isActive")
    .sort({ barangay: 1, name: 1 })
    .lean();

  return { centers };
};

export const getEnrollmentRequests = async (user?: AuthUser, query?: Record<string, unknown>) => {
  if (!user?.id || user.role !== "admin") {
    throw new ForbiddenError("Admins only");
  }

  const status = normalizeString(query?.status).toLowerCase();
  const filter: Record<string, unknown> = {};
  if (status === "pending" || status === "approved" || status === "rejected") {
    filter.status = status;
  }

  const requests = await ChildEnrollmentRequest.find(filter)
    .populate("requestedBy", "firstName middleName lastName email")
    .populate("daycareCenter", "name barangay code isActive")
    .populate("review.reviewedBy", "firstName middleName lastName email")
    .populate(
      "createdChild",
      "firstName middleName lastName studentId documentIntegrity",
    )
    .sort({ createdAt: -1 })
    .lean();

  return { requests };
};

export const getMyEnrollmentRequests = async (user?: AuthUser) => {
  if (!user?.id || user.role !== "teacher") {
    throw new ForbiddenError("Teachers only");
  }

  const requests = await ChildEnrollmentRequest.find({
    requestedBy: user.id,
  })
    .populate("daycareCenter", "name barangay code isActive")
    .populate("review.reviewedBy", "firstName middleName lastName email")
    .populate(
      "createdChild",
      "firstName middleName lastName studentId documentIntegrity",
    )
    .sort({ createdAt: -1 })
    .lean();

  const parentEmails = [
    ...new Set(
      (requests as Array<{ parent?: { email?: string } }>)
        .map((row) => String(row.parent?.email || "").trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  const parentUsers = parentEmails.length
    ? await User.find({
        role: "parent",
        email: { $in: parentEmails },
      })
        .select("email mustChangePassword")
        .lean()
    : [];

  const mustChangeByEmail = new Map<string, boolean>();
  for (const parentUser of parentUsers as Array<{
    email?: string;
    mustChangePassword?: boolean;
  }>) {
    mustChangeByEmail.set(
      String(parentUser.email || "").toLowerCase(),
      Boolean(parentUser.mustChangePassword),
    );
  }

  return {
    requests: (requests as Array<Record<string, unknown>>).map((row) => {
      const email = String(
        (row as { parent?: { email?: string } }).parent?.email || "",
      )
        .trim()
        .toLowerCase();

      return {
        ...row,
        showResetParentPassword: email
          ? mustChangeByEmail.get(email) === true
          : false,
      };
    }),
  };
};
