export type CompetencyPeriod = "all" | "quarterly" | "final";

export type CompetencyAnalyticsItem = {
  competencyId: string;
  code: string;
  name: string;
  category: string;
  distribution: {
    not_demonstrated: number;
    emerging: number;
    developing: number;
    achieved: number;
  };
  totalEvaluated: number;
  achievedRate: number;
};

export type CompetencyAnalyticsPayload = {
  filters: {
    period: CompetencyPeriod;
    schoolYear: string;
  };
  totalStudents: number;
  schoolYears: string[];
  competencies: CompetencyAnalyticsItem[];
  periods: Record<
    "quarterly" | "final",
    { totalStudents: number; competencies: CompetencyAnalyticsItem[] }
  >;
  comparison: {
    matchedStudents: number;
    totalComparedRatings: number;
    improvedRatings: number;
    unchangedRatings: number;
    declinedRatings: number;
    improvementRate: number;
  };
};

export type ReportDatePreset = "7d" | "30d" | "90d" | "all" | "custom";

export type TrendPoint = {
  dateKey: string;
  label: string;
  attendanceRate: number;
  present: number;
  absent: number;
};

export type ReportSummary = {
  totalChildDevelopmentCenters: number;
  childDevelopmentWorkers: number;
  totalEnrolledChildren: number;
  fourPsBeneficiaries: number;
  regularAttendees: number;
  totalChildren: number;
  activeChildren: number;
  totalTeachers: number;
  attendanceRecords: number;
  attendanceRate: number;
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

export type AdminReportPayload = {
  summary: ReportSummary;
  demographics: {
    genderBreakdown: ReportGenderBreakdown;
    ageBreakdown: ReportAgeBreakdownItem[];
  };
  studentList: ReportStudentListItem[];
  studentListPagination: ReportStudentListPagination;
  recentDailyRows: TrendPoint[];
  hasData: boolean;
  lastUpdatedAt: string;
};

export type ActiveRange = {
  startKey: string | null;
  endKey: string | null;
  label: string;
  isValid: boolean;
};
