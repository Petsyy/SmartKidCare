export * from "../utils/types";

export type DashboardReport = {
  summary: {
    totalChildDevelopmentCenters: number;
    childDevelopmentWorkers: number;
    totalEnrolledChildren: number;
    fourPsBeneficiaries: number;
    regularAttendees: number;
    activeChildren: number;
    attendanceRate: number;
  };
  demographics?: {
    genderBreakdown: {
      male: number;
      female: number;
    };
    programBreakdownByGender?: {
      male: {
        fourPs: number;
        regular: number;
      };
      female: {
        fourPs: number;
        regular: number;
      };
    };
  };
  recentDailyRows: Array<{
    dateKey: string;
    attendanceRate: number;
    present: number;
    absent: number;
  }>;
  lastUpdatedAt: string;
};
