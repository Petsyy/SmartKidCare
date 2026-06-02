import { ForbiddenError } from "../../../shared/errors/app-error";
import { normalizeString } from "../shared";
import {
  enrollmentRequestRepository,
  enrollmentCenterRepository,
  enrollmentUserRepository,
} from "./enrollment.repository";

type AuthUser = {
  id?: string;
  role?: string;
};

export const getEnrollmentCenters = async (user?: AuthUser) => {
  if (!user?.id || user.role !== "teacher") {
    throw new ForbiddenError("Teachers only");
  }

  const teacher = await enrollmentUserRepository.findTeacherById(user.id);
  if (!teacher?.daycareCenter) {
    return { centers: [] };
  }

  const centers = await enrollmentCenterRepository.findByTeacherCenter(
    String(teacher.daycareCenter),
  );

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

  const requests = await enrollmentRequestRepository.findAllWithPopulate(filter);

  return { requests };
};

export const getMyEnrollmentRequests = async (user?: AuthUser) => {
  if (!user?.id || user.role !== "teacher") {
    throw new ForbiddenError("Teachers only");
  }

  const requests = await enrollmentRequestRepository.findByTeacher(user.id);

  const parentEmails = [
    ...new Set(
      (requests as Array<{ parent?: { email?: string } }>)
        .map((row) => String(row.parent?.email || "").trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  const parentUsers = parentEmails.length
    ? await enrollmentUserRepository.findParentsByEmails(parentEmails)
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
