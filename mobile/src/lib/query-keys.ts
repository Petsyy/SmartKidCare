export const mobileQueryKeys = {
  teacherAttendanceSetup: (token: string | null, selectedDateKey: string) =>
    ["teacherAttendanceSetup", token, selectedDateKey] as const,
  teacherFeedingSetup: (
    token: string | null,
    attendanceDateKey: string,
    presentChildrenIdsKey: string,
  ) =>
    ["teacherFeedingSetup", token, attendanceDateKey, presentChildrenIdsKey] as const,
  parentAttendanceChildren: (token: string | null) =>
    ["parentAttendanceChildren", token] as const,
  parentAttendanceHistory: (
    token: string | null,
    selectedChildId: string | null,
    monthKey: string,
  ) => ["parentAttendanceHistory", token, selectedChildId, monthKey] as const,
  parentFeedingChildren: (token: string | null) =>
    ["parentFeedingChildren", token] as const,
  parentFeedingHistory: (
    token: string | null,
    selectedChildId: string | null,
    monthKey: string,
  ) => ["parentFeedingHistory", token, selectedChildId, monthKey] as const,
  profile: (token: string | null, role: "parent" | "teacher") =>
    ["profile", token, role] as const,
  parentChildrenDashboard: (token: string | null) =>
    ["parentChildrenDashboard", token] as const,
  parentDashboard: (token: string | null) =>
    ["parentDashboard", token] as const,
  teacherDashboard: (token: string | null, todayDateKey: string) =>
    ["teacherDashboard", token, todayDateKey] as const,
  notificationsFeed: (
    audience: string,
    token: string | null,
    userId: string | undefined,
    todayDateKey: string,
  ) => ["notificationsFeed", audience, token, userId, todayDateKey] as const,
  teacherChildrenOverview: (token: string | null) =>
    ["teacherChildrenOverview", token] as const,
  teacherChildDetails: (token: string | null, childId: string | null) =>
    ["teacherChildDetails", token, childId] as const,
  parentChildDetails: (
    token: string | null,
    childId: string | null,
    viewerEmail: string | undefined,
  ) => ["parentChildDetails", token, childId, viewerEmail] as const,
  submittedRequests: (token: string | null) => ["submittedRequests", token] as const,
};
