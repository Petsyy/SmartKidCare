import type {
  SubmitAttendanceData,
  SubmitFeedingData,
} from "@/src/api/api.types";

export type OfflineRecordType = "attendance" | "feeding";

export type AttendanceDraftPayload = {
  dateKey: string;
  records: Record<
    string,
    { status?: "present" | "absent"; notes?: string }
  >;
};

export type FeedingDraftPayload = {
  dateKey: string;
  foodServed?: string;
  records: Record<
    string,
    { status?: "completed" | "missed"; notes?: string }
  >;
};

export type OfflineDraftPayload =
  | AttendanceDraftPayload
  | FeedingDraftPayload;

export type OfflineDraft = {
  draftId: string;
  userId: string;
  recordType: OfflineRecordType;
  dateKey: string;
  payload: OfflineDraftPayload;
  createdAt: string;
  updatedAt: string;
};

export type OutboxStatus =
  | "queued"
  | "attempting"
  | "pausedForAuthentication"
  | "failedRetryable"
  | "needsAttention"
  | "synced";

export type OutboxOperation = {
  clientOperationId: string;
  sourceDraftId: string;
  userId: string;
  operationType: "attendance.create" | "feeding.create";
  dateKey: string;
  frozenPayload: SubmitAttendanceData | SubmitFeedingData;
  payloadHash: string;
  status: OutboxStatus;
  attemptCount: number;
  firstAttemptedAt?: string;
  lastAttemptedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastErrorCode?: string;
};
