import { apiClient, apiFormDataClient } from "./client";
import { File } from "expo-file-system";
import { API_BASE_URL } from "../config/config.api";
import type {
  DocumentAccessResponse,
  Guardian,
  PickupEligibleChild,
  RequestPickupCodeResponse,
  PickupRecordResponse,
  PickupStatusResponse,
} from "./api.types";

export const getParentIdDocumentUrl = async (
  childId: string,
): Promise<string> => {
  const access = await apiClient<DocumentAccessResponse>(
    `/api/documents/children/${childId}/parent-id/access`,
  );
  return `${API_BASE_URL}${access.viewPath.startsWith("/") ? "" : "/"}${access.viewPath}`;
};

const appendGuardianMultipartData = (
  formData: FormData,
  data: Partial<Guardian>,
  files?: { guardianId?: any },
) => {
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });

  if (files?.guardianId) {
    formData.append(
      "guardianId",
      new File(files.guardianId.uri),
      files.guardianId.name || "guardian-id.jpg",
    );
  }
};

export const addGuardian = async (
  childId: string,
  data: Partial<Guardian>,
  files?: { guardianId?: any },
): Promise<Guardian[]> => {
  if (files?.guardianId) {
    const formData = new FormData();
    appendGuardianMultipartData(formData, data, files);
    const res = await apiFormDataClient<{ success: boolean; data: Guardian[] }>(
      `/api/children/${childId}/guardians`,
      formData,
      "POST",
    );
    return res.data || [];
  }

  const res = await apiClient<{ success: boolean; data: Guardian[] }>(
    `/api/children/${childId}/guardians`,
    {
      method: "POST",
      body: data,
    },
  );
  return res.data || [];
};

export const updateGuardian = async (
  childId: string,
  index: number,
  data: Partial<Guardian>,
  files?: { guardianId?: any },
): Promise<Guardian[]> => {
  if (files?.guardianId) {
    const formData = new FormData();
    appendGuardianMultipartData(formData, data, files);
    const res = await apiFormDataClient<{ success: boolean; data: Guardian[] }>(
      `/api/children/${childId}/guardians/${index}`,
      formData,
      "PUT",
    );
    return res.data || [];
  }

  const res = await apiClient<{ success: boolean; data: Guardian[] }>(
    `/api/children/${childId}/guardians/${index}`,
    {
      method: "PUT",
      body: data,
    },
  );
  return res.data || [];
};

export const removeGuardian = async (
  childId: string,
  index: number,
): Promise<void> => {
  await apiClient(`/api/children/${childId}/guardians/${index}`, {
    method: "DELETE",
  });
};

export const getGuardians = async (childId: string): Promise<Guardian[]> => {
  const res = await apiClient<{ success: boolean; data: Guardian[] }>(
    `/api/children/${childId}/guardians`,
  );
  return res.data || [];
};

export const getPickupEligibleChildren = async (): Promise<
  PickupEligibleChild[]
> => {
  const res = await apiClient<{
    success: boolean;
    data: PickupEligibleChild[];
  }>("/api/pickup/children");
  return res.data || [];
};

export const requestPickupCode = async (
  childId: string,
  intendedGuardianIndex: number | null,
): Promise<RequestPickupCodeResponse> => {
  const res = await apiClient<{
    success: boolean;
    data: RequestPickupCodeResponse;
  }>("/api/pickup/request-code", {
    method: "POST",
    body: { childId, intendedGuardianIndex },
  });
  return res.data;
};

export const verifyPickupCode = async (
  childId: string,
  code: string,
  notes?: string,
): Promise<PickupRecordResponse> => {
  const res = await apiClient<{ success: boolean; data: PickupRecordResponse }>(
    "/api/pickup/verify",
    {
      method: "POST",
      body: { childId, code, notes },
    },
  );
  return res.data;
};

export const manualRelease = async (
  childId: string,
  pickedUpByType: "parent" | "guardian",
  guardianIndex: number | null,
  notes: string,
  isVisuallyVerified = false,
): Promise<PickupRecordResponse> => {
  const res = await apiClient<{ success: boolean; data: PickupRecordResponse }>(
    "/api/pickup/manual-release",
    {
      method: "POST",
      body: {
        childId,
        pickedUpByType,
        guardianIndex,
        notes,
        isVisuallyVerified,
      },
    },
  );
  return res.data;
};

export const getPickupStatus = async (
  childId: string,
): Promise<PickupStatusResponse> => {
  const res = await apiClient<{ success: boolean; data: PickupStatusResponse }>(
    `/api/pickup/status/${childId}`,
  );
  return res.data;
};

export const getPickupHistory = async (
  params?: Record<string, string>,
): Promise<PickupRecordResponse[]> => {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await apiClient<{
    success: boolean;
    data: PickupRecordResponse[];
  }>(`/api/pickup/history${query}`);
  return res.data || [];
};
