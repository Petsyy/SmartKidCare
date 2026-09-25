import { apiClient } from "./client";
import type {
  ConcernCategory,
  ConcernDetailResponse,
  ConcernListResponse,
  ConcernStatus,
} from "./api.types";

export type CreateConcernPayload = {
  childId: string;
  category: ConcernCategory;
  subject: string;
  message: string;
};

export const getConcerns = (params?: {
  page?: number;
  limit?: number;
  status?: ConcernStatus;
  category?: ConcernCategory;
}) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  const suffix = query.toString();
  return apiClient<ConcernListResponse>(`/api/concerns${suffix ? `?${suffix}` : ""}`);
};

export const getConcern = (id: string) =>
  apiClient<ConcernDetailResponse>(`/api/concerns/${id}`);

export const createConcern = (payload: CreateConcernPayload) =>
  apiClient<ConcernDetailResponse>("/api/concerns", {
    method: "POST",
    body: payload,
  });

export const addConcernMessage = (id: string, message: string) =>
  apiClient<ConcernDetailResponse>(`/api/concerns/${id}/messages`, {
    method: "POST",
    body: { message },
  });
