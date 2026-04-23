export const attendanceQueryKeys = {
  teacherAttendanceSetup: (selectedDateKey: string) =>
    ["teacherAttendanceSetup", selectedDateKey] as const,
  parentAttendanceChildren: () =>
    ["parentAttendanceChildren"] as const,
  parentAttendanceHistory: (
    selectedChildId: string | null,
    monthKey: string,
  ) => ["parentAttendanceHistory", selectedChildId, monthKey] as const,
};

export const feedingQueryKeys = {
  teacherFeedingSetup: (
    attendanceDateKey: string,
    presentChildrenIdsKey: string,
  ) =>
    ["teacherFeedingSetup", attendanceDateKey, presentChildrenIdsKey] as const,
  parentFeedingChildren: () =>
    ["parentFeedingChildren"] as const,
  parentFeedingHistory: (
    selectedChildId: string | null,
    monthKey: string,
  ) => ["parentFeedingHistory", selectedChildId, monthKey] as const,
};

export const profileQueryKeys = {
  profile: (role: "parent" | "teacher") =>
    ["profile", role] as const,
};

export const dashboardQueryKeys = {
  parentChildrenDashboard: () =>
    ["parentChildrenDashboard"] as const,
  parentDashboard: () =>
    ["parentDashboard"] as const,
  teacherDashboard: (todayDateKey: string) =>
    ["teacherDashboard", todayDateKey] as const,
};

export const notificationsQueryKeys = {
  notificationsFeed: (
    audience: string,
    userId: string | undefined,
    todayDateKey: string,
  ) => ["notificationsFeed", audience, userId, todayDateKey] as const,
};

export const childrenQueryKeys = {
  teacherChildrenOverview: () =>
    ["teacherChildrenOverview"] as const,
  teacherChildDetails: (childId: string | null) =>
    ["teacherChildDetails", childId] as const,
  parentChildDetails: (
    childId: string | null,
    viewerEmail: string | undefined,
  ) => ["parentChildDetails", childId, viewerEmail] as const,
};

export const requestsQueryKeys = {
  submittedRequests: () => ["submittedRequests"] as const,
};

export const mobileQueryKeys = {
  ...attendanceQueryKeys,
  ...feedingQueryKeys,
  ...profileQueryKeys,
  ...dashboardQueryKeys,
  ...notificationsQueryKeys,
  ...childrenQueryKeys,
  ...requestsQueryKeys,
};
