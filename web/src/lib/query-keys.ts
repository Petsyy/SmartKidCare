export const webQueryKeys = {
  authSession: () => ["authSession"] as const,
  users: (role: "barangay_captain" | "teacher" | "parent") =>
    ["users", role] as const,
  usersRoot: () => ["users"] as const,
  reportAnalytics: (paramsKey: string) =>
    ["reportAnalytics", paramsKey] as const,
  competencyAnalytics: (period: string, schoolYear: string) =>
    ["competencyAnalytics", period, schoolYear] as const,
  nutritionAnalytics: (schoolYear: string) =>
    ["nutritionAnalytics", schoolYear] as const,
  children: () => ["children"] as const,
  adminDashboard: () => ["adminDashboard"] as const,
  feedingTracking: (paramsKey: string) =>
    ["feedingTracking", paramsKey] as const,
  adminSettings: () => ["adminSettings"] as const,
  concerns: (paramsKey: string) => ["concerns", paramsKey] as const,
  concernsRoot: () => ["concerns"] as const,
  concernDetail: (id: string) => ["concern", id] as const,
};
