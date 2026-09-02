export type ReportDateRange = {
  startDate?: string;
  endDate?: string;
  datePreset?: string;
};

export type AdminReportRange = {
  startDate?: string;
  endDate?: string;
  datePreset?: "7d" | "30d" | "90d" | "all";
  page?: number;
  limit?: number;
  centerId?: string;
};

export type AttendanceDailyAggregate = {
  _id: string;
  present: number;
  absent: number;
};

export type FeedingDailyAggregate = {
  _id: string;
  completed: number;
  missed: number;
};

export type ReportGenderBreakdown = {
  male: number;
  female: number;
  total: number;
  malePercentage: number;
  femalePercentage: number;
};

export type ReportAgeBreakdownItem = {
  age: number;
  count: number;
};

export type ReportStudentListItem = {
  id: string;
  studentId: string;
  fullName: string;
  gender: "male" | "female";
  age: number;
  status: string;
  programType: string;
  schoolYear: string;
  teacherName: string;
  centerName: string;
  enrollmentDate: string | null;
};

export type ReportStudentListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
