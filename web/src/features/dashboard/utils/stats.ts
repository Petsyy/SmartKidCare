import type { DashboardStats } from "./types";

export function computeStats(
  childrenArray: any[],
  usersArray: any[],
  centersArray: any[],
  attendanceArray: any[],
  feedingArray: any[]
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

  const activeCenters = centersArray.filter(
    (center: any) => center?.isActive !== false
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

  let allFeedTotal = 0;
  let allFeedCompleted = 0;
  feedingArray.forEach((entry: any) => {
    entry.records?.forEach((record: any) => {
      allFeedTotal += 1;
      if (record.status === "completed") allFeedCompleted += 1;
    });
  });

  const todayAttendanceRate = allAttTotal
    ? Math.round((allAttPresent / allAttTotal) * 100)
    : 0;
  const todayFeedingRate = allFeedTotal
    ? Math.round((allFeedCompleted / allFeedTotal) * 100)
    : 0;
  const todayExceptions =
    allAttTotal - allAttPresent + (allFeedTotal - allFeedCompleted);

  return {
    totalChildDevelopmentCenters: activeCenters,
    childDevelopmentWorkers: totalTeachers,
    totalEnrolledDaycares: totalChildren,
    fourPsBeneficiaries,
    regularAttendees,
    totalChildren,
    activeChildren,
    totalTeachers,
    todayAttendanceRate,
    todayFeedingRate,
    todayExceptions,
    underweightCount,
    severelyUnderweightCount,
    normalCount,
    overweightCount,
    obeseCount,
  };
}
