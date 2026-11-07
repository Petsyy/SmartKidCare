export type FeedingDateStatus =
  | "attendanceMissing"
  | "attendanceSubmitted"
  | "feedingSubmitted";

export type FeedingDateOption = {
  dateKey: string;
  label: string;
  status: FeedingDateStatus;
};

export type TeacherFeedingStats = {
  fed: number;
  total: number;
};

