import { apiClient, apiFormDataClient } from "./client";
import type {
  Child,
  ChildEnrollmentRequestPayload,
  ChildEnrollmentRequestFiles,
  EnrollmentCenterOption,
  ChildEnrollmentSubmissionResponse,
  TeacherEnrollmentRequest,
} from "./api.types";

export type {
  ChildEnrollmentRequestPayload,
  ChildEnrollmentRequestFiles,
  EnrollmentCenterOption,
  ChildEnrollmentSubmissionResponse,
  TeacherEnrollmentRequest,
};

export const getEnrollmentCenters = async (): Promise<EnrollmentCenterOption[]> => {
  const data = await apiClient<{ centers?: EnrollmentCenterOption[] }>(
    "/api/enrollment/centers",
  );
  return Array.isArray(data.centers) ? data.centers : [];
};

export const submitChildEnrollmentRequest = async (
  payload: ChildEnrollmentRequestPayload,
  files?: ChildEnrollmentRequestFiles,
): Promise<ChildEnrollmentSubmissionResponse> => {
  const formData = new FormData();

  (Object.entries(payload) as [keyof ChildEnrollmentRequestPayload, any][])
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).length > 0) {
        formData.append(key, String(value));
      }
    });

  if (files?.birthCertificate?.uri) {
    formData.append("birthCertificate", {
      uri: files.birthCertificate.uri,
      name: files.birthCertificate.name,
      type: files.birthCertificate.mimeType || "application/octet-stream",
    } as any);
  }

  if (files?.parentId?.uri) {
    formData.append("parentId", {
      uri: files.parentId.uri,
      name: files.parentId.name,
      type: files.parentId.mimeType || "application/octet-stream",
    } as any);
  }

  return apiFormDataClient<ChildEnrollmentSubmissionResponse>(
    "/api/enrollment/requests",
    formData,
  );
};

export const getMyEnrollmentRequests = async (): Promise<TeacherEnrollmentRequest[]> => {
  const data = await apiClient<{ requests?: TeacherEnrollmentRequest[] }>(
    "/api/enrollment/requests/mine",
  );
  return Array.isArray(data.requests) ? data.requests : [];
};

export const getChildren = async (): Promise<Child[]> => {
  const data = await apiClient<Child[] | any>("/api/children");
  return Array.isArray(data) ? data : [];
};
