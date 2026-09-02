import { getDateRangeFromPreset } from "../../../shared/utils/records.utils";
import Attendance from "../../../models/Attendance";
import Feeding from "../../../models/Feeding";
import Child from "../../../models/Child";
import { NotFoundError } from "../../../shared/errors/app-error";
import type { ReportDateRange, AdminReportRange } from "../types/reports.types";
import { getAdminAnalyticsReport } from "./admin/reports-admin-analytics.service";
import type { AuthenticatedUser } from "../../../shared/types/auth.types";
import {
  assertCanAccessChild,
  assertTeacherCenter,
} from "../../../shared/services/child-access.service";
export { buildReportDemographics, buildStudentList } from "../shared/reports-aggregation.helpers";

export class ReportsService {
  private buildDateQuery(range: ReportDateRange): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (range.startDate && range.endDate) {
      query.date = {
        $gte: new Date(range.startDate),
        $lte: new Date(range.endDate),
      };
    } else if (range.datePreset) {
      const presetRange = getDateRangeFromPreset(range.datePreset);
      if (presetRange) {
        query.date = {
          $gte: presetRange.start,
          $lte: presetRange.end,
        };
      }
    }

    return query;
  }

  public async getAdminAnalytics(range: AdminReportRange) {
    return getAdminAnalyticsReport(range);
  }

  public async getChildReport(
    user: AuthenticatedUser,
    childId: string,
    range: ReportDateRange,
  ) {
    const child = await Child.findById(childId).lean();
    if (!child) {
      throw new NotFoundError("Child");
    }
    assertCanAccessChild(user, child);

    const dateQuery = this.buildDateQuery(range);
    const baseQuery = {
      ...dateQuery,
      "records.child": childId,
      ...(user.role === "teacher"
        ? { teacher: user.id, daycareCenter: user.daycareCenterId }
        : {}),
    };

    const [attendanceRecords, feedingRecords] = await Promise.all([
      Attendance.find(baseQuery).lean(),
      Feeding.find(baseQuery).lean(),
    ]);

    let presentDays = 0;
    let absentDays = 0;

    attendanceRecords.forEach((entry: any) => {
      const record = entry.records.find((r: any) => String(r.child) === childId);
      if (record) {
        if (record.status === "present") presentDays++;
        if (record.status === "absent") absentDays++;
      }
    });

    let mealsCompleted = 0;
    let mealsMissed = 0;

    feedingRecords.forEach((entry: any) => {
      const record = entry.records.find((r: any) => String(r.child) === childId);
      if (record) {
        if (record.status === "completed") mealsCompleted++;
        if (record.status === "missed") mealsMissed++;
      }
    });

    return {
      childId,
      name: `${child.firstName} ${child.lastName}`,
      studentId: child.studentId || "--",
      summary: {
        attendance: {
          present: presentDays,
          absent: absentDays,
          total: presentDays + absentDays,
          rate:
            presentDays + absentDays > 0
              ? Math.round((presentDays / (presentDays + absentDays)) * 100)
              : 0,
        },
        feeding: {
          completed: mealsCompleted,
          missed: mealsMissed,
          total: mealsCompleted + mealsMissed,
          rate:
            mealsCompleted + mealsMissed > 0
              ? Math.round((mealsCompleted / (mealsCompleted + mealsMissed)) * 100)
              : 0,
        },
      },
    };
  }

  public async getTeacherReport(
    user: AuthenticatedUser,
    range: ReportDateRange,
  ) {
    const daycareCenterId = assertTeacherCenter(user);
    const dateQuery = this.buildDateQuery(range);
    const baseQuery = {
      ...dateQuery,
      teacher: user.id,
      daycareCenter: daycareCenterId,
    };

    const [attendanceRecords, feedingRecords] = await Promise.all([
      Attendance.find(baseQuery).lean(),
      Feeding.find(baseQuery).lean(),
    ]);

    let presentDays = 0;
    let absentDays = 0;

    attendanceRecords.forEach((entry: any) => {
      entry.records.forEach((r: any) => {
        if (r.status === "present") presentDays++;
        if (r.status === "absent") absentDays++;
      });
    });

    let mealsCompleted = 0;
    let mealsMissed = 0;

    feedingRecords.forEach((entry: any) => {
      entry.records.forEach((r: any) => {
        if (r.status === "completed") mealsCompleted++;
        if (r.status === "missed") mealsMissed++;
      });
    });

    return {
      teacherId: user.id,
      summary: {
        attendance: {
          present: presentDays,
          absent: absentDays,
          total: presentDays + absentDays,
        },
        feeding: {
          completed: mealsCompleted,
          missed: mealsMissed,
          total: mealsCompleted + mealsMissed,
        },
      },
    };
  }
}

export const reportsService = new ReportsService();

export type { ReportDateRange, AdminReportRange } from "../types/reports.types";
