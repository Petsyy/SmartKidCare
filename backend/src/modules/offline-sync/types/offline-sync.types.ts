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

export type SnapshotResourceManifest = {
  resource: OfflineResource;
  required: boolean;
  itemCount: number;
  pageCount: number;
  checksum: string;
};
