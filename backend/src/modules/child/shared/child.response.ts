export const teacherWithCenterPopulate = {
  path: "teacher",
  select: "firstName middleName lastName email phone daycareCenter",
  populate: {
    path: "daycareCenter",
    select: "name barangay code isActive",
  },
};

export const withDerivedDaycareCenter = <T extends Record<string, any> | null>(
  child: T,
): T => {
  if (!child || child.daycareCenter) {
    return child;
  }

  const teacherCenter = child.teacher?.daycareCenter;
  if (!teacherCenter) {
    return child;
  }

  return {
    ...child,
    daycareCenter: teacherCenter,
  };
};
