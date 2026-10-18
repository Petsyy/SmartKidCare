import type { PushNotificationSendResult } from "../../notifications/types/push-notification.types";

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

export interface PickupNotificationParent {
  _id: unknown;
  role: string;
  isActive: boolean;
  pushToken?: string | null;
  pushTokens?: { token?: string | null }[];
}

export interface PickupNotificationChild {
  _id: unknown;
  firstName: string;
  lastName: string;
  status: string;
  teacher: unknown;
  daycareCenter: unknown;
  parent?: PickupNotificationParent | null;
}

export interface PickupNotificationRepositoryContract {
  findChildrenByIds(ids: string[]): Promise<PickupNotificationChild[]>;
  findPresentChildIds(input: {
    teacherId: string;
    centerId: string;
    start: Date;
    end: Date;
  }): Promise<string[]>;
  findReleasedChildIds(input: {
    childIds: string[];
    start: Date;
    end: Date;
  }): Promise<string[]>;
  findRecentlyAlertedChildIds(childIds: string[], since: Date): Promise<string[]>;
  createAlert(input: {
    recipientId: string;
    childId: string;
    senderId: string;
    centerId: string;
    title: string;
    message: string;
    cooldownKey: string;
  }): Promise<void>;
}

export interface PickupNotificationServiceDependencies {
  repository: PickupNotificationRepositoryContract;
  now: () => Date;
  parseDayRange: (value: unknown) => { start: Date; end: Date } | null;
  extractTokens: (user: PickupNotificationParent) => string[];
  sendPush: (input: {
    tokens: string[];
    title: string;
    body: string;
    data: Record<string, unknown>;
  }) => Promise<PushNotificationSendResult>;
}
