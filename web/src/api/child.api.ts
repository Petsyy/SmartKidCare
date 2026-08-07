import { API_BASE } from "./config";
import { apiRequestOrThrow } from "./api-client";
import type { ChildBlockchainProof } from "@/types/child";

export const getChildren = async () => {
  return apiRequestOrThrow<unknown>("/children", "Failed to fetch children");
};

export const getChildDocumentUrl = async (
  childId: string,
  documentType: "birth-certificate" | "parent-id",
) => {
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
  } as {
    url: string;
    expiresInSeconds: number;
    documentType: "birthCertificate" | "parentId";
  };
};

export const getChildBlockchainProof = async (
  childId: string,
): Promise<ChildBlockchainProof> => {
  return apiRequestOrThrow<ChildBlockchainProof>(
    `/children/${childId}/blockchain-proof`,
    "Failed to fetch blockchain proof",
  );
};

export const updateChild = async (
  childId: string,
  updates: {
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
  },
) => {
  return apiRequestOrThrow<unknown>(`/children/${childId}`, "Failed to update child", {
    method: "PATCH",
    body: updates,
  });
};

export const deleteChild = async (childId: string) => {
  return apiRequestOrThrow<unknown>(`/children/${childId}`, "Failed to delete child", {
    method: "DELETE",
  });
};
