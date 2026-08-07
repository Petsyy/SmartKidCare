import { adminCenterRepository } from "../repositories/admin.repository";
import User from "../../../models/Users";
import Child from "../../../models/Child";
import Attendance from "../../../models/Attendance";

export class DaycareCenterService {
  async getEnrichedDaycareCenters(barangay?: string) {
    const query: Record<string, unknown> = {};
    if (barangay) {
      query.barangay = barangay;
    }

    const centers = await adminCenterRepository.find(query);

    const enrichedCenters = await Promise.all(
      centers.map(async (doc: any) => {
        const center = doc.toObject ? doc.toObject() : doc;
        const centerId = center._id;

        const cdw = await User.findOne({ daycareCenter: centerId, role: "teacher" }).select("firstName lastName _id");
        const assignedCDW = cdw ? `${cdw.firstName} ${cdw.lastName}` : "Unassigned";

        const childrenCount = await Child.countDocuments({ daycareCenter: centerId });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let attendanceToday = { present: 0, total: childrenCount };
        let lastActivityDate = new Date(center.updatedAt || center.createdAt || Date.now());

        if (cdw) {
          const attendance = await Attendance.findOne({
            teacher: cdw._id,
            date: { $gte: today },
          });

          if (attendance) {
            const present = attendance.records.filter((r: any) => r.status === "present").length;
            attendanceToday = { present, total: attendance.records.length };
            
            const attendanceUpdate = new Date(attendance.updatedAt);
            if (attendanceUpdate > lastActivityDate) {
              lastActivityDate = attendanceUpdate;
            }
          }
        }

        return {
          ...center,
          assignedCDW,
          childrenCount,
          attendanceToday,
          lastActivity: lastActivityDate.toISOString(),
        };
      })
    );

    return enrichedCenters;
  }
}

export const daycareCenterService = new DaycareCenterService();
