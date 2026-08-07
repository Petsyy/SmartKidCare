export type DashboardStats = {
  totalChildDevelopmentCenters: number;
  childDevelopmentWorkers: number;
  totalEnrolledDaycares: number;
  fourPsBeneficiaries: number;
  regularAttendees: number;
  totalChildren: number;
  activeChildren: number;
  totalTeachers: number;
  todayAttendanceRate: number;
  todayFeedingRate: number;
  todayExceptions: number;
};

export type ChartDataPoint = {
  day: string;
  attendance: number;
  feeding: number;
};

export type PieDataPoint = {
  name: string;
  value: number;
  color: string;
};

export type RecentActivity = {
  id: string;
  type: "attendance" | "feeding";
  childName: string;
  teacherName: string;
  centerName: string;
  action: string;
  timestamp: string;
  sortTime: number;
  status: string;
};

export type DashboardDateMeta = {
  todayKey: string;
  attendanceKey: string;
  feedingKey: string;
};

export const DEFAULT_STATS: DashboardStats = {
  totalChildDevelopmentCenters: 0,
  childDevelopmentWorkers: 0,
  totalEnrolledDaycares: 0,
  fourPsBeneficiaries: 0,
  regularAttendees: 0,
  totalChildren: 0,
  activeChildren: 0,
  totalTeachers: 0,
  todayAttendanceRate: 0,
  todayFeedingRate: 0,
  todayExceptions: 0,
};

export const DEFAULT_DATE_META: DashboardDateMeta = {
  todayKey: "",
  attendanceKey: "",
  feedingKey: "",
};
