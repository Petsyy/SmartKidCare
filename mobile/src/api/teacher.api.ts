import { apiClient, apiFormDataClient } from "./client";
import { File } from "expo-file-system";
import type {
  Child,
  ChildEnrollmentRequestPayload,
  ChildEnrollmentRequestFiles,
  EnrollmentCenterOption,
  ChildEnrollmentSubmissionResponse,
} from "./api.types";

export type {
  ChildEnrollmentRequestPayload,
  ChildEnrollmentRequestFiles,
  EnrollmentCenterOption,
  ChildEnrollmentSubmissionResponse,
};

export const getEnrollmentCenters = async (): Promise<EnrollmentCenterOption[]> => {
  const data = await apiClient<{ centers?: EnrollmentCenterOption[] }>(
    "/api/enrollment/centers",
  );
  return Array.isArray(data.centers) ? data.centers : [];
};

export const submitChildEnrollment = async (
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
    formData.append(
      "birthCertificate",
      new File(files.birthCertificate.uri),
      files.birthCertificate.name,
    );
  }

  if (files?.parentId?.uri) {
    formData.append(
      "parentId",
      new File(files.parentId.uri),
      files.parentId.name,
    );
  }

  return apiFormDataClient<ChildEnrollmentSubmissionResponse>(
    "/api/enrollment",
    formData,
  );
};



export const getChildren = async (): Promise<Child[]> => {
  const data = await apiClient<Child[] | any>("/api/children");
  return Array.isArray(data) ? data : [];
};

export const getChildParentCredentials = async (
  childId: string,
): Promise<{ email: string; tempPassword?: string | null }> => {
  return apiClient<{ email: string; tempPassword?: string | null }>(
    `/api/children/${childId}/parent-credentials`,
    {
      method: "GET",
    },
  );
};

export const resetChildParentPassword = async (
  childId: string,
): Promise<{ email: string; tempPassword?: string | null }> => {
  return apiClient<{ email: string; tempPassword?: string | null }>(
    `/api/children/${childId}/parent-credentials/reset`,
    {
      method: "POST",
    },
  );
};

export const updateChild = async (
  childId: string,
  payload: Partial<ChildEnrollmentRequestPayload> & { weight?: number | null; height?: number | null },
): Promise<Child> => {
  return apiClient<Child>(`/api/children/${childId}`, {
    method: "PATCH",
    body: payload,
  });
};

export const updateChildStatus = async (
  childId: string,
  status: "Active" | "Inactive",
): Promise<Child> => {
  return apiClient<Child>(`/api/children/${childId}`, {
    method: "PATCH",
    body: { status },
  });
};
