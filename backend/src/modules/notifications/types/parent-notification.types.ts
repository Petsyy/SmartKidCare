export type ParentNotificationType =
  | "attendance_submitted"
  | "absence_alert"
  | "feeding_submitted"
  | "missed_meal_alert"
  | "pickup_code_generated"
  | "child_released"
  | "pickup_reminder"
  | "competency_practice";

export interface ParentFeedItem {
  id: string;
  type: ParentNotificationType;
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
  childId?: string;
  evaluationId?: string;
  actionPath?: string;
}

export interface ParentFeedResult {
  date: string;
  parentId: string;
  parentName: string;
  hasPushToken: boolean;
  notifications: ParentFeedItem[];
}
