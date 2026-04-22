export const webQueryKeys = {
  authSession: () => ["authSession"] as const,
  users: (role: "teacher" | "parent") => ["users", role] as const,
  usersRoot: () => ["users"] as const,
  enrollmentRequests: (status: string) =>
    ["enrollmentRequests", status] as const,
  enrollmentRequestsRoot: () => ["enrollmentRequests"] as const,
  reportAnalyticsRaw: () => ["reportAnalyticsRaw"] as const,
  children: () => ["children"] as const,
  adminDashboard: () => ["adminDashboard"] as const,
  attendanceTracking: (paramsKey: string) =>
    ["attendanceTracking", paramsKey] as const,
  feedingTracking: (paramsKey: string) => ["feedingTracking", paramsKey] as const,
  adminSettings: () => ["adminSettings"] as const,
};
