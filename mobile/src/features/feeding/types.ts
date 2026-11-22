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

export interface FeedingRecord {
  child: string;
  status: "completed" | "missed";
  notes?: string;
}

export interface SubmitFeedingData {
  clientOperationId?: string;
  date: string;
  foodServed: string;
  records: FeedingRecord[];
}
