import { ForbiddenError } from "../../../shared/errors/app-error";
import { normalizeString } from "../../../shared/utils/string.utils";
import { enrollmentRequestRepository, enrollmentCenterRepository, enrollmentUserRepository, } from "../repositories/enrollment.repository";
import type { AuthUser } from "../types/enrollment-query.types";

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
  return { requests };
};
