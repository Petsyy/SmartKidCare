import type { OfflineResource } from "@/src/api/offline-sync.api";
import { readActiveOfflineRecords } from "./offline-record-store";
import { toManilaDateKey } from "@/src/utils/manila-date";

export const readOfflineResource = <T>(userId: string, resource: OfflineResource) =>
  readActiveOfflineRecords<T>(userId, resource);

export const readOfflineRecordForDate = async <T extends { date: string }>(
  userId: string,
  resource: "attendance" | "feeding",
  dateKey: string,
) => {
  const records = await readOfflineResource<T>(userId, resource);
  return (
    records.find((record) => toManilaDateKey(record.date) === dateKey) ?? null
  );
};

export const readOfflineMonth = async <T extends { date: string }>(
  userId: string,
  resource: "attendance" | "feeding",
  monthKey: string,
) => {
  const records = await readOfflineResource<T>(userId, resource);
  return records.filter(
    (record) => toManilaDateKey(record.date)?.slice(0, 7) === monthKey,
  );
};

export const onlineWithOfflineFallback = async <T>(
  offline: boolean,
  onlineRead: () => Promise<T>,
  offlineRead: () => Promise<T>,
) => {
  if (offline) return offlineRead();
  try {
    return await onlineRead();
  } catch {
    return offlineRead();
  }
};
