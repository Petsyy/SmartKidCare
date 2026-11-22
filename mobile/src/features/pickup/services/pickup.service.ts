import { apiClient, apiFormDataClient } from "@/src/api/client";
import { File } from "expo-file-system";
import { API_BASE_URL } from "@/src/config/config.api";
import type {
  DocumentAccessResponse,
  Guardian,
  PickupEligibleChild,
  RequestPickupCodeResponse,
  PickupRecordResponse,
  PickupStatusResponse,
  BulkPickupNotificationInput,
  BulkPickupNotificationResult,
} from "@/src/api/api.types";

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

export class PickupService {
  async getParentIdDocumentUrl(childId: string): Promise<string> {
    const access = await apiClient<DocumentAccessResponse>(
      `/api/documents/children/${childId}/parent-id/access`,
    );
    return `${API_BASE_URL}${access.viewPath.startsWith("/") ? "" : "/"}${access.viewPath}`;
  }

  async addGuardian(
    childId: string,
    data: Partial<Guardian>,
    files?: { guardianId?: any },
  ): Promise<Guardian[]> {
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
  }

  async updateGuardian(
    childId: string,
    index: number,
    data: Partial<Guardian>,
    files?: { guardianId?: any },
  ): Promise<Guardian[]> {
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
  }

  async removeGuardian(childId: string, index: number): Promise<void> {
    await apiClient(`/api/children/${childId}/guardians/${index}`, {
      method: "DELETE",
    });
  }

  async getGuardians(childId: string): Promise<Guardian[]> {
    const res = await apiClient<{ success: boolean; data: Guardian[] }>(
      `/api/children/${childId}/guardians`,
    );
    return res.data || [];
  }

  async getPickupEligibleChildren(): Promise<PickupEligibleChild[]> {
    const res = await apiClient<{
      success: boolean;
      data: PickupEligibleChild[];
    }>("/api/pickup/children");
    return res.data || [];
  }

  async sendBulkPickupNotifications(
    payload: BulkPickupNotificationInput,
  ): Promise<BulkPickupNotificationResult> {
    const res = await apiClient<{
      success: boolean;
      data: BulkPickupNotificationResult;
    }>("/api/pickup/notifications", {
      method: "POST",
      body: payload,
    });
    return res.data;
  }

  async requestPickupCode(
    childId: string,
    intendedGuardianIndex: number | null,
  ): Promise<RequestPickupCodeResponse> {
    const res = await apiClient<{
      success: boolean;
      data: RequestPickupCodeResponse;
    }>("/api/pickup/request-code", {
      method: "POST",
      body: { childId, intendedGuardianIndex },
    });
    return res.data;
  }

  async verifyPickupCode(
    childId: string,
    code: string,
    notes?: string,
  ): Promise<PickupRecordResponse> {
    const res = await apiClient<{ success: boolean; data: PickupRecordResponse }>(
      "/api/pickup/verify",
      {
        method: "POST",
        body: { childId, code, notes },
      },
    );
    return res.data;
  }

  async manualRelease(
    childId: string,
    pickedUpByType: "parent" | "guardian",
    guardianIndex: number | null,
    notes: string,
    isVisuallyVerified = false,
  ): Promise<PickupRecordResponse> {
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
  }

  async getPickupStatus(childId: string): Promise<PickupStatusResponse> {
    const res = await apiClient<{ success: boolean; data: PickupStatusResponse }>(
      `/api/pickup/status/${childId}`,
    );
    return res.data;
  }

  async getPickupHistory(
    params?: Record<string, string>,
  ): Promise<PickupRecordResponse[]> {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await apiClient<{
      success: boolean;
      data: PickupRecordResponse[];
    }>(`/api/pickup/history${query}`);
    return res.data || [];
  }
}

export const pickupService = new PickupService();

// Backwards-compatible bound aliases
export const getParentIdDocumentUrl = (childId: string) =>
  pickupService.getParentIdDocumentUrl(childId);

export const addGuardian = (
  childId: string,
  data: Partial<Guardian>,
  files?: { guardianId?: any },
) => pickupService.addGuardian(childId, data, files);

export const updateGuardian = (
  childId: string,
  index: number,
  data: Partial<Guardian>,
  files?: { guardianId?: any },
) => pickupService.updateGuardian(childId, index, data, files);

export const removeGuardian = (childId: string, index: number) =>
  pickupService.removeGuardian(childId, index);

export const getGuardians = (childId: string) =>
  pickupService.getGuardians(childId);

export const getPickupEligibleChildren = () =>
  pickupService.getPickupEligibleChildren();

export const sendBulkPickupNotifications = (
  payload: BulkPickupNotificationInput,
) => pickupService.sendBulkPickupNotifications(payload);

export const requestPickupCode = (
  childId: string,
  intendedGuardianIndex: number | null,
) => pickupService.requestPickupCode(childId, intendedGuardianIndex);

export const verifyPickupCode = (childId: string, code: string, notes?: string) =>
  pickupService.verifyPickupCode(childId, code, notes);

export const manualRelease = (
  childId: string,
  pickedUpByType: "parent" | "guardian",
  guardianIndex: number | null,
  notes: string,
  isVisuallyVerified = false,
) =>
  pickupService.manualRelease(
    childId,
    pickedUpByType,
    guardianIndex,
    notes,
    isVisuallyVerified,
  );

export const getPickupStatus = (childId: string) =>
  pickupService.getPickupStatus(childId);

export const getPickupHistory = (params?: Record<string, string>) =>
  pickupService.getPickupHistory(params);
