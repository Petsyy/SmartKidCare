import { apiRequestOrThrow } from "@/api/api-client";
import { formatConfidentialName, maskCompositeName } from "@/utils/name-privacy";
import type {
  ChildRef,
  FeedingApiResponse,
  FeedingQueryResult,
  FeedingRow,
  PaginatedFeedingResponse,
  UpdateFeedingRecordPayload,
} from "../types";

export class FeedingService {
  formatChildName(child?: ChildRef | null): string {
    if (!child) return "Unknown";
    return (
      formatConfidentialName({
        lastName: child.lastName,
        firstName: child.firstName,
        middleName: child.middleName ?? child.middle ?? child.middle_name,
      }) || "Unknown"
    );
  }

  flattenFeedingRecords(data: FeedingApiResponse[]): FeedingRow[] {
    return data.flatMap((entry) =>
      entry.records.map((record, index) => {
        const child = typeof record.child === "object" ? record.child : null;
        return {
          id: `${entry._id}-${child?._id ?? record.child ?? index}`,
          date: entry.date,
          studentId: child?.studentId ?? "—",
          childName: this.formatChildName(child),
          foodServed: entry.foodServed,
          status: record.status,
          notes: String(record.notes ?? "").trim(),
          teacherName: entry.teacher
            ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
            : "—",
          submittedAt: entry.updatedAt || entry.createdAt || entry.date,
          blockchainVerified: record.blockchainVerified ?? false,
        };
      }),
    );
  }

  async getFeedingRecords(queryString: string): Promise<FeedingQueryResult> {
    const payload = await apiRequestOrThrow<
      FeedingApiResponse[] | PaginatedFeedingResponse
    >(
      `/records/feeding${queryString ? `?${queryString}` : ""}`,
      "Failed to fetch feeding records",
    );

    if (Array.isArray(payload)) {
      const rows = this.flattenFeedingRecords(payload);
      return {
        rows,
        foodOptions: [
          ...new Set(rows.map((row) => row.foodServed).filter(Boolean)),
        ],
        total: rows.length,
        totalPages: rows.length > 0 ? 1 : 0,
      };
    }

    const paginated = payload as PaginatedFeedingResponse;
    const rowsFromApi = Array.isArray(paginated.data) ? paginated.data : [];
    return {
      rows: rowsFromApi.map((row) => ({
        ...row,
        notes: String(row.notes ?? "").trim(),
        childName:
          maskCompositeName(row.childName) || row.childName || "Unknown",
      })),
      foodOptions: Array.isArray(paginated.foodOptions)
        ? paginated.foodOptions
        : [],
      total: Number(paginated.pagination?.total ?? 0),
      totalPages: Number(paginated.pagination?.totalPages ?? 0),
    };
  }

  async updateFeedingRecord(
    id: string,
    payload: UpdateFeedingRecordPayload,
  ): Promise<void> {
    await apiRequestOrThrow<void>(
      `/records/feeding/${id}`,
      "Failed to update feeding record",
      {
        method: "PATCH",
        body: payload,
      },
    );
  }

  async deleteFeedingRecord(id: string): Promise<void> {
    await apiRequestOrThrow<void>(
      `/records/feeding/${id}`,
      "Failed to delete feeding record",
      {
        method: "DELETE",
      },
    );
  }
}

export const feedingService = new FeedingService();

// Bound method aliases for backwards compatibility
export const formatChildName = (child?: ChildRef | null) =>
  feedingService.formatChildName(child);
export const flattenFeedingRecords = (data: FeedingApiResponse[]) =>
  feedingService.flattenFeedingRecords(data);
export const getFeedingRecords = (queryString: string) =>
  feedingService.getFeedingRecords(queryString);
export const updateFeedingRecord = (
  id: string,
  payload: UpdateFeedingRecordPayload,
) => feedingService.updateFeedingRecord(id, payload);
export const deleteFeedingRecord = (id: string) =>
  feedingService.deleteFeedingRecord(id);
