import * as Crypto from "expo-crypto";
import { getOfflineDatabase } from "./offline-database";
import type {
  OfflineDraft,
  OfflineDraftPayload,
  OfflineRecordType,
  OutboxOperation,
  OutboxStatus,
} from "./offline.types";
import type {
  SubmitAttendanceData,
  SubmitFeedingData,
} from "@/src/api/api.types";

const nowIso = () => new Date().toISOString();

export const saveDraft = async (input: {
  userId: string;
  recordType: OfflineRecordType;
  dateKey: string;
  payload: OfflineDraftPayload;
}): Promise<OfflineDraft> => {
  const database = await getOfflineDatabase();
  const existing = await database.getFirstAsync<{ draft_id: string; created_at: string }>(
    "SELECT draft_id, created_at FROM offline_drafts WHERE user_id = ? AND record_type = ? AND date_key = ?",
    input.userId,
    input.recordType,
    input.dateKey,
  );
  const timestamp = nowIso();
  const draftId = existing?.draft_id ?? Crypto.randomUUID();
  const createdAt = existing?.created_at ?? timestamp;
  await database.runAsync(
    `INSERT INTO offline_drafts
      (draft_id, user_id, record_type, date_key, payload_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, record_type, date_key) DO UPDATE SET
      payload_json = excluded.payload_json, updated_at = excluded.updated_at`,
    draftId,
    input.userId,
    input.recordType,
    input.dateKey,
    JSON.stringify(input.payload),
    createdAt,
    timestamp,
  );
  return { ...input, draftId, createdAt, updatedAt: timestamp };
};

export const getDraft = async (
  userId: string,
  recordType: OfflineRecordType,
  dateKey: string,
): Promise<OfflineDraft | null> => {
  const database = await getOfflineDatabase();
  const row = await database.getFirstAsync<any>(
    "SELECT * FROM offline_drafts WHERE user_id = ? AND record_type = ? AND date_key = ?",
    userId,
    recordType,
    dateKey,
  );
  if (!row) return null;
  return {
    draftId: row.draft_id,
    userId: row.user_id,
    recordType: row.record_type,
    dateKey: row.date_key,
    payload: JSON.parse(row.payload_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const hashPayload = (payloadJson: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payloadJson);

export const finalizeDraft = async (input: {
  draft: OfflineDraft;
  operationType: OutboxOperation["operationType"];
  completePayload: SubmitAttendanceData | SubmitFeedingData;
}): Promise<OutboxOperation> => {
  const database = await getOfflineDatabase();
  const timestamp = nowIso();
  const operationId = Crypto.randomUUID();
  const payloadJson = JSON.stringify(input.completePayload);
  const payloadHash = await hashPayload(payloadJson);
  const operation: OutboxOperation = {
    clientOperationId: operationId,
    sourceDraftId: input.draft.draftId,
    userId: input.draft.userId,
    operationType: input.operationType,
    dateKey: input.draft.dateKey,
    frozenPayload: input.completePayload,
    payloadHash,
    status: "queued",
    attemptCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO offline_outbox
        (operation_id, source_draft_id, user_id, operation_type, date_key,
         payload_json, payload_hash, status, attempt_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', 0, ?, ?)`,
      operationId,
      input.draft.draftId,
      input.draft.userId,
      input.operationType,
      input.draft.dateKey,
      payloadJson,
      payloadHash,
      timestamp,
      timestamp,
    );
    await database.runAsync(
      "DELETE FROM offline_drafts WHERE draft_id = ? AND user_id = ?",
      input.draft.draftId,
      input.draft.userId,
    );
  });
  return operation;
};

export const listOutboxOperations = async (userId: string) => {
  const database = await getOfflineDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM offline_outbox
     WHERE user_id = ? AND status != 'synced'
     ORDER BY date_key ASC,
       CASE operation_type WHEN 'attendance.create' THEN 0 ELSE 1 END ASC`,
    userId,
  );
  return rows.map(
    (row): OutboxOperation => ({
      clientOperationId: row.operation_id,
      sourceDraftId: row.source_draft_id,
      userId: row.user_id,
      operationType: row.operation_type,
      dateKey: row.date_key,
      frozenPayload: JSON.parse(row.payload_json),
      payloadHash: row.payload_hash,
      status: row.status,
      attemptCount: row.attempt_count,
      firstAttemptedAt: row.first_attempted_at ?? undefined,
      lastAttemptedAt: row.last_attempted_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastErrorCode: row.last_error_code ?? undefined,
    }),
  );
};

export const getOutboxOperation = async (operationId: string) => {
  const database = await getOfflineDatabase();
  const row = await database.getFirstAsync<{ status: OutboxStatus }>(
    "SELECT status FROM offline_outbox WHERE operation_id = ?",
    operationId,
  );
  return row?.status ?? null;
};

export const getLocalWorkCount = async (userId: string) => {
  const database = await getOfflineDatabase();
  const draft = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM offline_drafts WHERE user_id = ?",
    userId,
  );
  const outbox = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM offline_outbox WHERE user_id = ? AND status != 'synced'",
    userId,
  );
  return Number(draft?.count ?? 0) + Number(outbox?.count ?? 0);
};

export const updateOutboxStatus = async (
  operationId: string,
  status: OutboxStatus,
  errorCode?: string,
) => {
  const database = await getOfflineDatabase();
  const timestamp = nowIso();
  if (status === "attempting") {
    await database.runAsync(
      `UPDATE offline_outbox SET status = ?, attempt_count = attempt_count + 1,
       first_attempted_at = COALESCE(first_attempted_at, ?),
       last_attempted_at = ?, updated_at = ?, last_error_code = NULL
       WHERE operation_id = ?`,
      status,
      timestamp,
      timestamp,
      timestamp,
      operationId,
    );
    return;
  }
  await database.runAsync(
    "UPDATE offline_outbox SET status = ?, last_error_code = ?, updated_at = ? WHERE operation_id = ?",
    status,
    errorCode ?? null,
    timestamp,
    operationId,
  );
};
