import { apiRequestOrThrow } from "./api-client";
import type {
  ConcernCategory,
  ConcernDetail,
  ConcernPagination,
  ConcernStatus,
  ConcernSummary,
} from "@/features/concerns/types";

type ConcernListResponse = {
  success: true;
  data: ConcernSummary[];
  pagination: ConcernPagination;
};

type ConcernDetailResponse = { success: true; data: ConcernDetail };

export const getCaptainConcerns = (params: {
  page: number;
  limit: number;
  status?: ConcernStatus;
  category?: ConcernCategory;
}) => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.status) query.set("status", params.status);
  if (params.category) query.set("category", params.category);
  return apiRequestOrThrow<ConcernListResponse>(
    `/concerns?${query.toString()}`,
    "Unable to load parent concerns",
  );
};

export const getCaptainConcern = (id: string) =>
  apiRequestOrThrow<ConcernDetailResponse>(
    `/concerns/${id}`,
    "Unable to load concern details",
  );

export const replyToConcern = (id: string, message: string) =>
  apiRequestOrThrow<ConcernDetailResponse>(
    `/concerns/${id}/messages`,
    "Unable to send reply",
    { method: "POST", body: { message } },
  );

export const updateConcernStatus = (
  id: string,
  status: ConcernStatus,
  note?: string,
) =>
  apiRequestOrThrow<ConcernDetailResponse>(
    `/concerns/${id}/status`,
    "Unable to update concern status",
    { method: "PATCH", body: { status, note: note?.trim() || undefined } },
  );
