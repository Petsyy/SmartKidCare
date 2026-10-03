export type DashboardStats = {
  totalChildDevelopmentCenters: number;
  childDevelopmentWorkers: number;
  totalEnrolledDaycares: number;
  fourPsBeneficiaries: number;
  regularAttendees: number;
  totalChildren: number;
  activeChildren: number;
  totalTeachers: number;
  todayAttendanceRate: number | null;
  hasTodayAttendance: boolean;
  todayAbsentCount: number;
  todayPresentCount: number;
  todayExceptions: number;
  underweightCount: number;
  severelyUnderweightCount: number;
  normalCount: number;
  overweightCount: number;
  obeseCount: number;
  boys: number;
  girls: number;
};

export type ChartDataPoint = {
  day: string;
  attendance: number | null;
};

export type PieDataPoint = {
  name: string;
  value: number;
  color: string;
};


export type DashboardDateMeta = {
  todayKey: string;
  attendanceKey: string;
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
  todayAttendanceRate: null,
  hasTodayAttendance: false,
  todayAbsentCount: 0,
  todayPresentCount: 0,
  todayExceptions: 0,
  underweightCount: 0,
  severelyUnderweightCount: 0,
  normalCount: 0,
  overweightCount: 0,
  obeseCount: 0,
  boys: 0,
  girls: 0,
};

export const DEFAULT_DATE_META: DashboardDateMeta = {
  todayKey: "",
  attendanceKey: "",
};
