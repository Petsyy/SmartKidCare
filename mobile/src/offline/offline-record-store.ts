import { getOfflineDatabase } from "./offline-database";
import type { OfflineResource } from "@/src/api/offline-sync.api";

const TABLES: Record<OfflineResource, string> = {
  children: "offline_children",
  attendance: "offline_attendance",
  feeding: "offline_feeding",
  nutrition: "offline_nutrition",
  competencyDefinitions: "offline_competency_definitions",
  competencyEvaluations: "offline_competency_evaluations",
};

const text = (value: unknown) => (value == null ? null : String(value));
const dateKey = (value: unknown) => text(value)?.slice(0, 10) ?? null;

export const beginRecordSnapshot = async (userId: string) => {
  const database = await getOfflineDatabase();
  await database.runAsync(
    `INSERT INTO offline_sync_metadata (user_id, sync_status)
     VALUES (?, 'downloading')
     ON CONFLICT(user_id) DO UPDATE SET sync_status = 'downloading', last_error_code = NULL`,
    userId,
  );
};

export const writeRecordSnapshotPage = async (
  userId: string,
  snapshotId: string,
  resource: OfflineResource,
  items: Record<string, unknown>[],
) => {
  const database = await getOfflineDatabase();
  const table = TABLES[resource];
  await database.withTransactionAsync(async () => {
    for (const item of items) {
      const serverId = text(item._id);
      if (!serverId)
        throw new Error(`Offline ${resource} record is missing its server ID.`);
      const common = [userId, serverId, snapshotId];
      if (resource === "children") {
        await database.runAsync(
          `INSERT OR REPLACE INTO ${table} (user_id, server_id, snapshot_id, child_id, server_updated_at, data_json) VALUES (?, ?, ?, ?, ?, ?)`,
          ...common,
          serverId,
          text(item.updatedAt),
          JSON.stringify(item),
        );
      } else if (resource === "attendance" || resource === "feeding") {
        await database.runAsync(
          `INSERT OR REPLACE INTO ${table} (user_id, server_id, snapshot_id, date_key, server_updated_at, data_json) VALUES (?, ?, ?, ?, ?, ?)`,
          ...common,
          dateKey(item.date),
          text(item.updatedAt),
          JSON.stringify(item),
        );
      } else if (resource === "nutrition") {
        await database.runAsync(
          `INSERT OR REPLACE INTO ${table} (user_id, server_id, snapshot_id, child_id, school_year, period, date_key, server_updated_at, data_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ...common,
          text(item.childId),
          text(item.schoolYear),
          text(item.period),
          dateKey(item.measurementDate),
          text(item.updatedAt),
          JSON.stringify(item),
        );
      } else if (resource === "competencyEvaluations") {
        await database.runAsync(
          `INSERT OR REPLACE INTO ${table} (user_id, server_id, snapshot_id, child_id, school_year, period, date_key, server_updated_at, data_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ...common,
          text(item.child),
          text(item.schoolYear),
          text(item.period),
          dateKey(item.evaluationDate),
          text(item.updatedAt),
          JSON.stringify(item),
        );
      } else {
        await database.runAsync(
          `INSERT OR REPLACE INTO ${table} (user_id, server_id, snapshot_id, server_updated_at, data_json) VALUES (?, ?, ?, ?, ?)`,
          ...common,
          text(item.updatedAt),
          JSON.stringify(item),
        );
      }
    }
  });
};

export const activateRecordSnapshot = async (
  userId: string,
  snapshotId: string,
) => {
  const database = await getOfflineDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO offline_sync_metadata (user_id, active_snapshot_id, sync_status, last_complete_sync_at)
       VALUES (?, ?, 'ready', ?)
       ON CONFLICT(user_id) DO UPDATE SET active_snapshot_id = excluded.active_snapshot_id,
       sync_status = 'ready', last_complete_sync_at = excluded.last_complete_sync_at, last_error_code = NULL`,
      userId,
      snapshotId,
      new Date().toISOString(),
    );
    for (const table of Object.values(TABLES)) {
      await database.runAsync(
        `DELETE FROM ${table} WHERE user_id = ? AND snapshot_id <> ?`,
        userId,
        snapshotId,
      );
    }
  });
};

export const failRecordSnapshot = async (
  userId: string,
  snapshotId: string | null,
  errorCode: string,
) => {
  const database = await getOfflineDatabase();
  await database.withTransactionAsync(async () => {
    if (snapshotId)
      for (const table of Object.values(TABLES))
        await database.runAsync(
          `DELETE FROM ${table} WHERE user_id = ? AND snapshot_id = ?`,
          userId,
          snapshotId,
        );
    await database.runAsync(
      "UPDATE offline_sync_metadata SET sync_status = CASE WHEN active_snapshot_id IS NULL THEN 'failed' ELSE 'ready' END, last_error_code = ? WHERE user_id = ?",
      errorCode,
      userId,
    );
  });
};

export const getRecordSyncMetadata = async (userId: string) => {
  const database = await getOfflineDatabase();
  return database.getFirstAsync<{
    active_snapshot_id: string | null;
    sync_status: string;
    last_complete_sync_at: string | null;
    last_error_code: string | null;
  }>(
    "SELECT active_snapshot_id, sync_status, last_complete_sync_at, last_error_code FROM offline_sync_metadata WHERE user_id = ?",
    userId,
  );
};

export const readActiveOfflineRecords = async <T>(
  userId: string,
  resource: OfflineResource,
): Promise<T[]> => {
  const database = await getOfflineDatabase();
  const rows = await database.getAllAsync<{ data_json: string }>(
    `SELECT data_json FROM ${TABLES[resource]} WHERE user_id = ? AND snapshot_id = (SELECT active_snapshot_id FROM offline_sync_metadata WHERE user_id = ?)`,
    userId,
    userId,
  );
  return rows.map((row) => JSON.parse(row.data_json) as T);
};
