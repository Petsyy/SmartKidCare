export const webQueryKeys = {
  authSession: () => ["authSession"] as const,
  users: (role: "teacher" | "parent") => ["users", role] as const,
  usersRoot: () => ["users"] as const,
  enrollmentRequests: (status: string) =>
    ["enrollmentRequests", status] as const,
  enrollmentRequestsRoot: () => ["enrollmentRequests"] as const,
  reportAnalytics: (paramsKey: string) =>
    ["reportAnalytics", paramsKey] as const,
  competencyAnalytics: (
    period: string,
    schoolYear: string,
    centerId: string,
  ) => ["competencyAnalytics", period, schoolYear, centerId] as const,
  nutritionAnalytics: (schoolYear: string, centerId: string) =>
    ["nutritionAnalytics", schoolYear, centerId] as const,
  children: () => ["children"] as const,
  adminDashboard: () => ["adminDashboard"] as const,
  feedingTracking: (paramsKey: string) => ["feedingTracking", paramsKey] as const,
  adminSettings: () => ["adminSettings"] as const,
};
