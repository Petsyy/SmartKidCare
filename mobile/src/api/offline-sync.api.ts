import { apiClient } from "./client";

export const OFFLINE_RESOURCES = [
  "children",
  "attendance",
  "feeding",
  "nutrition",
  "competencyDefinitions",
  "competencyEvaluations",
] as const;
export type OfflineResource = (typeof OFFLINE_RESOURCES)[number];

export type OfflineSnapshotManifest = {
  snapshotId: string;
  generatedAt: string;
  expiresAt: string;
  resources: {
    resource: OfflineResource;
    itemCount: number;
    pageCount: number;
    checksum: string;
  }[];
};

export const createOfflineSnapshot = async () =>
  (
    await apiClient<{ data: OfflineSnapshotManifest }>(
      "/api/offline-sync/snapshots",
      { method: "POST" },
    )
  ).data;

export const getOfflineSnapshotPage = async (
  snapshotId: string,
  resource: OfflineResource,
  cursor: string | null,
) =>
  (
    await apiClient<{
      data: {
        snapshotId: string;
        resource: OfflineResource;
        items: Record<string, unknown>[];
        nextCursor: string | null;
        complete: boolean;
      };
    }>(
      `/api/offline-sync/snapshots/${snapshotId}/resources/${resource}?cursor=${encodeURIComponent(cursor ?? "0")}`,
    )
  ).data;

export const deleteOfflineSnapshot = (snapshotId: string) =>
  apiClient<void>(`/api/offline-sync/snapshots/${snapshotId}`, {
    method: "DELETE",
  });
