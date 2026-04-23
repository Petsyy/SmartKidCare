import { apiClient } from "./client";

export type { Child, ChildDocumentIntegrity } from "./api.types";
import type { Child } from "./api.types";

export const getMyChildren = async (): Promise<Child[]> => {
  const data = await apiClient<Child[] | any>("/api/children/my-children");
  return Array.isArray(data) ? data : [];
};

export const getChildById = async (childId: string): Promise<Child> => {
  return apiClient<Child>(`/api/children/${childId}`);
};
