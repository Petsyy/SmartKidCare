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
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_drafts (
      draft_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      date_key TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, record_type, date_key)
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
  `);
  await database.runAsync(
    "UPDATE offline_outbox SET status = 'failedRetryable' WHERE status = 'attempting'",
  );
  return database;
};

export const getOfflineDatabase = () => {
  databasePromise ??= initializeDatabase();
  return databasePromise;
};

export const clearOfflineDataForUser = async (userId: string) => {
  const database = await getOfflineDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync("DELETE FROM offline_drafts WHERE user_id = ?", userId);
    await database.runAsync("DELETE FROM offline_outbox WHERE user_id = ?", userId);
    await database.runAsync("DELETE FROM offline_query_cache WHERE user_id = ?", userId);
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
