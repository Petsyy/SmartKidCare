import { API_BASE } from "@/api/config";
import { apiRequestOrThrow } from "@/api/api-client";
import type { ChildBlockchainProof } from "@/types/child";

export type UpdateChildInput = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  homeAddress?: string;
  parentRelationship?: string;
  weight?: number;
  height?: number;
  enrollmentDate?: string;
  schoolYear?: string;
  status?: string;
  regenerateLinkCode?: boolean;
  unlinkParent?: boolean;
  teacherId?: string | null;
  unlinkTeacher?: boolean;
};

export class ChildrenService {
  async getChildren(): Promise<unknown> {
    return apiRequestOrThrow<unknown>("/children", "Failed to fetch children");
  }

  async getChildDocumentUrl(
    childId: string,
    documentType: "birth-certificate" | "parent-id",
  ): Promise<{
    url: string;
    expiresInSeconds: number;
    documentType: "birthCertificate" | "parentId";
  }> {
    const tokenData = await apiRequestOrThrow<{
      token?: string;
      expiresInSeconds: number;
      documentType: "birthCertificate" | "parentId";
    }>(
      `/children/${childId}/documents/${documentType}/url`,
      "Failed to fetch document token",
    );

    const { token, expiresInSeconds } = tokenData;
    if (!token) throw new Error("No access token was returned");

    return {
      url: `${API_BASE}/documents/view?token=${token}`,
      expiresInSeconds,
      documentType: tokenData.documentType,
    };
  }

  async getChildBlockchainProof(
    childId: string,
  ): Promise<ChildBlockchainProof> {
    return apiRequestOrThrow<ChildBlockchainProof>(
      `/children/${childId}/blockchain-proof`,
      "Failed to fetch blockchain proof",
    );
  }

  async updateChild(
    childId: string,
    updates: UpdateChildInput,
  ): Promise<unknown> {
    return apiRequestOrThrow<unknown>(
      `/children/${childId}`,
      "Failed to update child",
      {
        method: "PATCH",
        body: updates,
      },
    );
  }

  async deleteChild(childId: string): Promise<unknown> {
    return apiRequestOrThrow<unknown>(
      `/children/${childId}`,
      "Failed to delete child",
      {
        method: "DELETE",
      },
    );
  }
}

export const childrenService = new ChildrenService();

// Bound method aliases for backwards compatibility
export const getChildren = () => childrenService.getChildren();
export const getChildDocumentUrl = (
  childId: string,
  documentType: "birth-certificate" | "parent-id",
) => childrenService.getChildDocumentUrl(childId, documentType);
export const getChildBlockchainProof = (childId: string) =>
  childrenService.getChildBlockchainProof(childId);
export const updateChild = (childId: string, updates: UpdateChildInput) =>
  childrenService.updateChild(childId, updates);
export const deleteChild = (childId: string) =>
  childrenService.deleteChild(childId);
