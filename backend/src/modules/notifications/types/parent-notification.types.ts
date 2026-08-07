export type ParentNotificationType =
  | "attendance_submitted"
  | "absence_alert"
  | "feeding_submitted"
  | "missed_meal_alert";

export interface ParentFeedItem {
  id: string;
  type: ParentNotificationType;
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
}

export interface ParentFeedResult {
  date: string;
  parentId: string;
  parentName: string;
  hasPushToken: boolean;
  notifications: ParentFeedItem[];
}
