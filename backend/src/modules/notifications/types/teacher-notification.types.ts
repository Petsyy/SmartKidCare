export type TeacherNotificationType =
  | "attendance_reminder"
  | "attendance_incomplete"
  | "feeding_reminder"
  | "feeding_incomplete";

export interface TeacherDispatchDetail {
  teacherId: string;
  teacherName: string;
  sent: TeacherNotificationType[];
  skipped?: string;
}

export interface TeacherDispatchResult {
  date: string;
  totalTeachers: number;
  processedTeachers: number;
  notificationsSent: number;
  attendanceReminderCount: number;
  attendanceIncompleteCount: number;
  feedingReminderCount: number;
  feedingIncompleteCount: number;
  details: TeacherDispatchDetail[];
}

export interface TeacherFeedItem {
  id: string;
  type: TeacherNotificationType;
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
}

export interface TeacherFeedResult {
  date: string;
  teacherId: string;
  teacherName: string;
  hasPushToken: boolean;
  notifications: TeacherFeedItem[];
}

export interface DispatchTeacherParams {
  date?: Date;
  teacherIds?: string[];
  includeTypes?: TeacherNotificationType[];
}

export interface TeacherNotificationDraft {
  type: TeacherNotificationType;
  title: string;
  body: string;
  timeLabel: string;
  actionLabel: string;
  data: Record<string, unknown>;
}
