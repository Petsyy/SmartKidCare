import type {
  SubmitAttendanceData,
  SubmitFeedingData,
} from "@/src/api/api.types";

export type OfflineRecordType =
  "attendance" | "feeding" | "nutrition" | "competency";

export type AttendanceDraftPayload = {
  dateKey: string;
  records: Record<string, { status?: "present" | "absent"; notes?: string }>;
};

export type FeedingDraftPayload = {
  dateKey: string;
  foodServed?: string;
  records: Record<string, { status?: "completed" | "missed"; notes?: string }>;
};

export type NutritionDraftPayload = {
  childId: string;
  schoolYear: string;
  period: "quarterly" | "final";
  measurementDateKey: string;
  weight?: string;
  height?: string;
};

export type CompetencyDraftPayload = {
  childId: string;
  period: "quarterly" | "final";
  evaluationDate: string;
  levels: Record<
    string,
    "not_demonstrated" | "emerging" | "developing" | "achieved"
  >;
  remarks: Record<string, string>;
  generalNotes?: string;
};

export type OfflineDraftPayload =
  | AttendanceDraftPayload
  | FeedingDraftPayload
  | NutritionDraftPayload
  | CompetencyDraftPayload;

export type OfflineDraft = {
  draftId: string;
  userId: string;
  recordType: OfflineRecordType;
  dateKey: string;
  draftScopeKey: string;
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
