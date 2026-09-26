import type { DashboardStats } from "./types";

export function computeStats(
  childrenArray: any[],
  usersArray: any[],
  attendanceArray: any[]
): DashboardStats {
  const totalChildren = childrenArray.length;
  const activeChildren = childrenArray.filter(
    (c: any) => c.status === "Active"
  ).length;

  const totalTeachers = usersArray.filter(
    (u: any) =>
      u.role === "teacher" &&
      u.isActive !== false &&
      Boolean(u.daycareCenter)
  ).length;

  const fourPsBeneficiaries = childrenArray.filter(
    (c: any) => c?.programType === "4Ps Beneficiary"
  ).length;

  const regularAttendees = childrenArray.filter(
    (c: any) => c?.programType === "Regular Enrollee (Non-beneficiary)"
  ).length;

  const activeHealthChildren = childrenArray.filter(
    (child: any) => child.status === "Active" && child.nutritionalStatus,
  );
  const underweightCount = activeHealthChildren.filter(
    (child: any) => child.nutritionalStatus === "Underweight",
  ).length;
  const severelyUnderweightCount = activeHealthChildren.filter(
    (child: any) => child.nutritionalStatus === "Severely Underweight",
  ).length;
  const normalCount = activeHealthChildren.filter(
    (child: any) => child.nutritionalStatus === "Normal",
  ).length;
  const overweightCount = activeHealthChildren.filter(
    (child: any) => child.nutritionalStatus === "Overweight",
  ).length;
  const obeseCount = activeHealthChildren.filter(
    (child: any) => child.nutritionalStatus === "Obese",
  ).length;

  let allAttTotal = 0;
  let allAttPresent = 0;
  attendanceArray.forEach((entry: any) => {
    entry.records?.forEach((record: any) => {
      allAttTotal += 1;
      if (record.status === "present") allAttPresent += 1;
    });
  });

  const todayAttendanceRate = allAttTotal
    ? Math.round((allAttPresent / allAttTotal) * 100)
    : null;
  const todayExceptions = allAttTotal - allAttPresent;

  return {
    totalChildDevelopmentCenters: 1,
    childDevelopmentWorkers: totalTeachers,
    totalEnrolledDaycares: totalChildren,
    fourPsBeneficiaries,
    regularAttendees,
    totalChildren,
    activeChildren,
    totalTeachers,
    todayAttendanceRate,
    hasTodayAttendance: allAttTotal > 0,
    todayAbsentCount: allAttTotal - allAttPresent,
    todayExceptions,
    underweightCount,
    severelyUnderweightCount,
    normalCount,
    overweightCount,
    obeseCount,
  };
}
