import { apiClient } from "@/src/api/client";
import type {
  Child,
  ChildEnrollmentRequestPayload,
} from "@/src/api/api.types";

export type { Child, ChildDocumentIntegrity } from "@/src/api/api.types";

export class ChildrenService {
  async getChildren(
    status: "Active" | "Inactive" = "Active",
  ): Promise<Child[]> {
    const data = await apiClient<Child[] | any>(`/api/children?status=${status}`);
    return Array.isArray(data) ? data : [];
  }

  async getMyChildren(): Promise<Child[]> {
    const data = await apiClient<Child[] | unknown>("/api/children/my-children");
    return Array.isArray(data) ? (data as Child[]) : [];
  }

  async getChildById(childId: string): Promise<Child> {
    return apiClient<Child>(`/api/children/${childId}`);
  }

  async getChildParentCredentials(
    childId: string,
  ): Promise<{ email: string; tempPassword?: string | null }> {
    return apiClient<{ email: string; tempPassword?: string | null }>(
      `/api/children/${childId}/parent-credentials`,
      {
        method: "GET",
      },
    );
  }

  async resetChildParentPassword(
    childId: string,
  ): Promise<{ email: string; tempPassword?: string | null }> {
    return apiClient<{ email: string; tempPassword?: string | null }>(
      `/api/children/${childId}/parent-credentials/reset`,
      {
        method: "POST",
      },
    );
  }

  async updateChild(
    childId: string,
    payload: Partial<ChildEnrollmentRequestPayload> & {
      weight?: number | null;
      height?: number | null;
    },
  ): Promise<Child> {
    return apiClient<Child>(`/api/children/${childId}`, {
      method: "PATCH",
      body: payload,
    });
  }

  async archiveChild(
    childId: string,
    input: { reason: string; note?: string },
  ): Promise<Child> {
    return apiClient<Child>(`/api/children/${childId}/archive`, {
      method: "PATCH",
      body: input,
    });
  }

  async restoreChild(childId: string): Promise<Child> {
    return apiClient<Child>(`/api/children/${childId}/restore`, {
      method: "PATCH",
    });
  }
}

export const childrenService = new ChildrenService();

// Backwards-compatible bound aliases
export const getChildren = (status?: "Active" | "Inactive") =>
  childrenService.getChildren(status);
export const getMyChildren = () => childrenService.getMyChildren();
export const getChildById = (childId: string) =>
  childrenService.getChildById(childId);
export const getChildParentCredentials = (childId: string) =>
  childrenService.getChildParentCredentials(childId);
export const resetChildParentPassword = (childId: string) =>
  childrenService.resetChildParentPassword(childId);
export const updateChild = (
  childId: string,
  payload: Partial<ChildEnrollmentRequestPayload> & {
    weight?: number | null;
    height?: number | null;
  },
) => childrenService.updateChild(childId, payload);
export const archiveChild = (
  childId: string,
  input: { reason: string; note?: string },
) => childrenService.archiveChild(childId, input);
export const restoreChild = (childId: string) =>
  childrenService.restoreChild(childId);
