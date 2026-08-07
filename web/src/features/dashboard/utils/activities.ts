import type { RecentActivity } from "./types";
import { getChildId, formatChildName, formatDateTimeManila } from "./helpers";

export function computeRecentActivities(
  attendanceArray: any[],
  feedingArray: any[],
  childMap: Map<string, any>,
  usersArray: any[],
  centersArray: any[]
): RecentActivity[] {
  const activities: RecentActivity[] = [];

  const getTeacherAndCenter = (entry: any, childObj: any) => {
    const teacherId = entry.teacher?._id || entry.teacher;
    const teacherObj = typeof entry.teacher === "object" ? entry.teacher : usersArray.find((u) => u._id === teacherId);
    
    const teacherName = teacherObj 
      ? formatChildName(teacherObj) 
      : "Unknown Teacher";

    const centerId = childObj?.daycareCenter?._id || childObj?.daycareCenter || teacherObj?.daycareCenter?._id || teacherObj?.daycareCenter;
    const centerObj = centersArray.find((c) => c._id === centerId);
    const centerName = centerObj?.name || "Unknown Center";

    return { teacherName, centerName };
  };

  attendanceArray.forEach((entry: any) => {
    entry.records?.forEach((record: any) => {
      const childId = getChildId(record.child);
      const childObj = typeof record.child === "object" ? record.child : childMap.get(childId) || null;
      const { teacherName, centerName } = getTeacherAndCenter(entry, childObj);
      const eventTime = new Date(entry.updatedAt || entry.createdAt || entry.date);

      activities.push({
        id: `att-${entry._id || "row"}-${childId || record._id || Math.random()}`,
        type: "attendance",
        childName: formatChildName(childObj),
        teacherName,
        centerName,
        action: record.status === "present" ? "Checked in" : "Marked absent",
        timestamp: formatDateTimeManila(eventTime),
        sortTime: eventTime.getTime(),
        status: record.status,
      });
    });
  });

  feedingArray.forEach((entry: any) => {
    entry.records?.forEach((record: any) => {
      const childId = getChildId(record.child);
      const childObj = typeof record.child === "object" ? record.child : childMap.get(childId) || null;
      const { teacherName, centerName } = getTeacherAndCenter(entry, childObj);
      const eventTime = new Date(entry.updatedAt || entry.createdAt || entry.date);

      activities.push({
        id: `feed-${entry._id || "row"}-${childId || record._id || Math.random()}`,
        type: "feeding",
        childName: formatChildName(childObj),
        teacherName,
        centerName,
        action: record.status === "completed" ? "Fed lunch" : "Missed lunch",
        timestamp: formatDateTimeManila(eventTime),
        sortTime: eventTime.getTime(),
        status: record.status,
      });
    });
  });

  activities.sort((a, b) => b.sortTime - a.sortTime);
  return activities.slice(0, 10);
}
