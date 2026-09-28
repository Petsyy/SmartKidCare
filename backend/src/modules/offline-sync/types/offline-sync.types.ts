export const OFFLINE_RESOURCES = [
  "children",
  "attendance",
  "feeding",
  "nutrition",
  "competencyDefinitions",
  "competencyEvaluations",
] as const;

export type OfflineResource = (typeof OFFLINE_RESOURCES)[number];

export type SnapshotResourceManifest = {
  resource: OfflineResource;
  itemCount: number;
  pageCount: number;
  checksum: string;
};
