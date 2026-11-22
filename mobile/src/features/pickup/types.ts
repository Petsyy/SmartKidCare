import type { Child, Guardian } from "@/src/features/children/types";

export interface PickupEligibleChild {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  parent?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    hasIdDocument: boolean;
  };
  authorizedPickupPersons?: Guardian[];
}

export interface BulkPickupNotificationInput {
  childIds: string[];
}

export type BulkPickupNotificationStatus =
  | "sent"
  | "cooldown"
  | "already_released"
  | "not_present"
  | "missing_parent"
  | "push_failed";

export interface BulkPickupNotificationDetail {
  childId: string;
  childName: string;
  status: BulkPickupNotificationStatus;
  reason?: string;
}

export interface BulkPickupNotificationResult {
  sent: number;
  pushDelivered: number;
  pushFailed: number;
  skipped: number;
  details: BulkPickupNotificationDetail[];
}

export interface RequestPickupCodeResponse {
  expiresAt: string;
  childId: string;
  code: string;
}

export interface PickupRecordResponse {
  _id: string;
  child: string | Partial<Child>;
  daycareCenter: string;
  pickedUpBy: {
    type: "parent" | "guardian";
    userId?: string;
    guardianIndex?: number;
    name: string;
    phone: string;
    relationship: string;
  };
  verificationMethod: "pickup_code" | "manual_override";
  verifiedByTeacher:
    | string
    | { _id: string; firstName: string; lastName: string };
  pickedUpAt: string;
  notes?: string;
}

export interface PickupStatusResponse {
  status: "pending" | "released";
  pickup?: PickupRecordResponse;
}

export interface PaginatedPickupHistory {
  data: PickupRecordResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
