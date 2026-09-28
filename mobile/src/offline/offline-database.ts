import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "smartkidcare-offline.db";
const DATABASE_KEY = "offlineDatabaseKey.v1";
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDatabaseKey = async () => {
  const existing = await SecureStore.getItemAsync(DATABASE_KEY);
  if (existing) return existing;

  const key = Array.from(Crypto.getRandomBytes(32))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  await SecureStore.setItemAsync(DATABASE_KEY, key);
  return key;
};

const initializeDatabase = async () => {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  const key = await getDatabaseKey();
  await database.execAsync(`PRAGMA key = '${key}';`);
  await database.execAsync("PRAGMA foreign_keys = ON;");

  const draftColumns = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(offline_drafts)",
  );
  const hasLegacyDraftTable =
    draftColumns.length > 0 &&
    !draftColumns.some((column) => column.name === "draft_scope_key");

  if (hasLegacyDraftTable) {
    await database.withTransactionAsync(async () => {
      await database.execAsync("DROP TABLE IF EXISTS offline_drafts_legacy;");
      await database.execAsync(
        "ALTER TABLE offline_drafts RENAME TO offline_drafts_legacy;",
      );
      await database.execAsync(`
        CREATE TABLE offline_drafts (
          draft_id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          record_type TEXT NOT NULL,
          date_key TEXT NOT NULL,
          draft_scope_key TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(user_id, record_type, draft_scope_key)
        );
      `);
      await database.execAsync(`
        INSERT OR REPLACE INTO offline_drafts
          (draft_id, user_id, record_type, date_key, draft_scope_key, payload_json, created_at, updated_at)
        SELECT draft_id, user_id, record_type, date_key, date_key, payload_json, created_at, updated_at
        FROM offline_drafts_legacy;
      `);
      await database.execAsync("DROP TABLE offline_drafts_legacy;");
    });
  }

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_drafts (
      draft_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      date_key TEXT NOT NULL,
      draft_scope_key TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, record_type, draft_scope_key)
    );
    CREATE TABLE IF NOT EXISTS offline_outbox (
      operation_id TEXT PRIMARY KEY NOT NULL,
      source_draft_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      date_key TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      status TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      first_attempted_at TEXT,
      last_attempted_at TEXT,
      last_error_code TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, operation_type, date_key)
    );
    CREATE TABLE IF NOT EXISTS offline_query_cache (
      user_id TEXT PRIMARY KEY NOT NULL,
      cache_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS offline_sync_metadata (
      user_id TEXT PRIMARY KEY NOT NULL,
      active_snapshot_id TEXT,
      pending_snapshot_id TEXT,
      sync_status TEXT NOT NULL DEFAULT 'notDownloaded',
      last_complete_sync_at TEXT,
      generated_at TEXT,
      pending_generated_at TEXT,
      last_error_code TEXT
    );
    CREATE TABLE IF NOT EXISTS offline_sync_resources (
      user_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, resource TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 1, expected_items INTEGER NOT NULL DEFAULT 0,
      downloaded_items INTEGER NOT NULL DEFAULT 0, verified INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, snapshot_id, resource)
    );
    CREATE TABLE IF NOT EXISTS offline_children (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      child_id TEXT NOT NULL, server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_attendance (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      date_key TEXT, server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_feeding (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      date_key TEXT, server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_nutrition (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      child_id TEXT, school_year TEXT, period TEXT, date_key TEXT,
      server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_competency_definitions (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_competency_evaluations (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      child_id TEXT, school_year TEXT, period TEXT, date_key TEXT,
      server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_profiles (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_guardian_summaries (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_enrollment_reference (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_pickup_statuses (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_pickup_history (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_notifications (
      user_id TEXT NOT NULL, server_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      server_updated_at TEXT, data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, server_id, snapshot_id)
    );
    CREATE TABLE IF NOT EXISTS offline_chat_messages (
      user_id TEXT NOT NULL, message_id TEXT NOT NULL, child_id TEXT,
      role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_offline_children_active ON offline_children(user_id, snapshot_id, child_id);
    CREATE INDEX IF NOT EXISTS idx_offline_attendance_date ON offline_attendance(user_id, snapshot_id, date_key);
    CREATE INDEX IF NOT EXISTS idx_offline_feeding_date ON offline_feeding(user_id, snapshot_id, date_key);
    CREATE INDEX IF NOT EXISTS idx_offline_nutrition_child ON offline_nutrition(user_id, snapshot_id, child_id, school_year, period);
    CREATE INDEX IF NOT EXISTS idx_offline_competency_child ON offline_competency_evaluations(user_id, snapshot_id, child_id, school_year, period);
  `);
  const metadataColumns = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(offline_sync_metadata)",
  );
  const metadataColumnNames = new Set(
    metadataColumns.map((column) => column.name),
  );
  for (const [name, type] of [
    ["pending_snapshot_id", "TEXT"],
    ["generated_at", "TEXT"],
    ["pending_generated_at", "TEXT"],
  ] as const) {
    if (!metadataColumnNames.has(name))
      await database.execAsync(
        `ALTER TABLE offline_sync_metadata ADD COLUMN ${name} ${type};`,
      );
  }
  await database.runAsync(
    "UPDATE offline_outbox SET status = 'failedRetryable' WHERE status = 'attempting'",
  );
  await database.execAsync("PRAGMA user_version = 2;");
  return database;
};

export const getOfflineDatabase = () => {
  databasePromise ??= initializeDatabase();
  return databasePromise;
};

export const clearOfflineDataForUser = async (userId: string) => {
  const database = await getOfflineDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      "DELETE FROM offline_drafts WHERE user_id = ?",
      userId,
    );
    await database.runAsync(
      "DELETE FROM offline_outbox WHERE user_id = ?",
      userId,
    );
    await database.runAsync(
      "DELETE FROM offline_query_cache WHERE user_id = ?",
      userId,
    );
    for (const table of [
      "offline_children",
      "offline_attendance",
      "offline_feeding",
      "offline_nutrition",
      "offline_competency_definitions",
      "offline_competency_evaluations",
      "offline_profiles",
      "offline_guardian_summaries",
      "offline_enrollment_reference",
      "offline_pickup_statuses",
      "offline_pickup_history",
      "offline_notifications",
      "offline_chat_messages",
      "offline_sync_resources",
      "offline_sync_metadata",
    ]) {
      await database.runAsync(`DELETE FROM ${table} WHERE user_id = ?`, userId);
    }
  });
};

export const saveEncryptedQueryCache = async (
  userId: string,
  cacheJson: string,
) => {
  const database = await getOfflineDatabase();
  await database.runAsync(
    `INSERT INTO offline_query_cache (user_id, cache_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       cache_json = excluded.cache_json, updated_at = excluded.updated_at`,
    userId,
    cacheJson,
    new Date().toISOString(),
  );
};

export const readEncryptedQueryCache = async (userId: string) => {
  const database = await getOfflineDatabase();
  return database.getFirstAsync<{ cache_json: string; updated_at: string }>(
    "SELECT cache_json, updated_at FROM offline_query_cache WHERE user_id = ?",
    userId,
  );
};
