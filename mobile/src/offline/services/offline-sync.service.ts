import { apiClient } from "@/src/api/client";

export const OFFLINE_RESOURCES = [
  "children",
  "attendance",
  "feeding",
  "nutrition",
  "competencyDefinitions",
  "competencyEvaluations",
  "profiles",
  "guardianSummaries",
  "enrollmentReference",
  "pickupStatuses",
  "pickupHistory",
  "notifications",
] as const;
export type OfflineResource = (typeof OFFLINE_RESOURCES)[number];

export type OfflineSnapshotManifest = {
  snapshotId: string;
  generatedAt: string;
  expiresAt: string;
  resources: {
    resource: OfflineResource;
    required: boolean;
    itemCount: number;
    pageCount: number;
    checksum: string;
  }[];
};

export class OfflineSyncService {
  async createOfflineSnapshot(): Promise<OfflineSnapshotManifest> {
    return (
      await apiClient<{ data: OfflineSnapshotManifest }>(
        "/api/offline-sync/snapshots",
        { method: "POST" },
      )
    ).data;
  }

  async getOfflineSnapshotPage(
    snapshotId: string,
    resource: OfflineResource,
    cursor: string | null,
  ): Promise<{
    snapshotId: string;
    resource: OfflineResource;
    items: Record<string, unknown>[];
    nextCursor: string | null;
    complete: boolean;
  }> {
    return (
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
  }

  async deleteOfflineSnapshot(snapshotId: string): Promise<void> {
    await apiClient<void>(`/api/offline-sync/snapshots/${snapshotId}`, {
      method: "DELETE",
    });
  }
}

export const offlineSyncService = new OfflineSyncService();

// Backwards-compatible bound aliases
export const createOfflineSnapshot = () =>
  offlineSyncService.createOfflineSnapshot();

export const getOfflineSnapshotPage = (
  snapshotId: string,
  resource: OfflineResource,
  cursor: string | null,
) => offlineSyncService.getOfflineSnapshotPage(snapshotId, resource, cursor);

export const deleteOfflineSnapshot = (snapshotId: string) =>
  offlineSyncService.deleteOfflineSnapshot(snapshotId);
