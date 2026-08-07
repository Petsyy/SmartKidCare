import Child from "../../../../models/Child";
import Attendance from "../../../../models/Attendance";
import Feeding from "../../../../models/Feeding";
import User from "../../../../models/Users";
import ChildDevelopmentCenter from "../../../../models/ChildDevelopmentCenter";
import type {
  AdminReportRange,
  AttendanceDailyAggregate,
  FeedingDailyAggregate,
} from "../../types/reports.types";
import {
  buildAgeBreakdown,
  buildGenderBreakdown,
  buildStudentList,
  type AgeAggregateRow,
  type ChildReportRecord,
  type GenderAggregateRow,
} from "../../shared/reports-aggregation.helpers";
import {
  getAdminDateMatch,
  getChildEnrollmentDateMatch,
  normalizePagination,
} from "../../shared/reports-query.helpers";

const CHILD_SELECT =
  "firstName lastName age gender status studentId programType schoolYear enrollmentDate teacher daycareCenter";

export async function getAdminAnalyticsReport(range: AdminReportRange) {
  const dateMatch = getAdminDateMatch(range);
  const childEnrollmentMatch = getChildEnrollmentDateMatch(range);
  const { page, limit } = normalizePagination(range);

  const [
    totalChildDevelopmentCenters,
    childDevelopmentWorkers,
    totalEnrolledChildren,
    activeChildren,
    fourPsBeneficiaries,
    regularAttendees,
    genderRows,
    ageRows,
    pagedChildren,
    attendanceDaily,
    feedingDaily,
  ] = await Promise.all([
    ChildDevelopmentCenter.countDocuments({ isActive: { $ne: false } }),
    User.countDocuments({
      role: "teacher",
      isActive: { $ne: false },
      daycareCenter: { $ne: null },
    }),
    Child.countDocuments(childEnrollmentMatch),
    Child.countDocuments({ ...childEnrollmentMatch, status: "Active" }),
    Child.countDocuments({ ...childEnrollmentMatch, programType: "4Ps Beneficiary" }),
    Child.countDocuments({
      ...childEnrollmentMatch,
      programType: "Regular Enrollee (Non-beneficiary)",
    }),
    Child.aggregate<GenderAggregateRow>([
      { $match: childEnrollmentMatch },
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]),
    Child.aggregate<AgeAggregateRow>([
      { $match: childEnrollmentMatch },
      { $group: { _id: "$age", count: { $sum: 1 } } },
    ]),
    Child.find(childEnrollmentMatch)
      .select(CHILD_SELECT)
      .sort({ firstName: 1, lastName: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("teacher", "firstName lastName")
      .populate("daycareCenter", "name")
      .lean<ChildReportRecord[]>(),
    Attendance.aggregate<AttendanceDailyAggregate>([
      { $match: dateMatch },
      { $unwind: "$records" },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "Asia/Manila",
            },
          },
          present: {
            $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$records.status", "absent"] }, 1, 0] },
          },
        },
      },
    ]),
    Feeding.aggregate<FeedingDailyAggregate>([
      { $match: dateMatch },
      { $unwind: "$records" },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "Asia/Manila",
            },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$records.status", "completed"] }, 1, 0] },
          },
          missed: {
            $sum: { $cond: [{ $eq: ["$records.status", "missed"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const genderBreakdown = buildGenderBreakdown(genderRows, totalEnrolledChildren);
  const ageBreakdown = buildAgeBreakdown(ageRows);
  const totalStudentPages = Math.max(1, Math.ceil(totalEnrolledChildren / limit));
  const normalizedPage = Math.min(page, totalStudentPages);
  const studentList = buildStudentList(pagedChildren);

  const attendanceByDate = new Map(attendanceDaily.map((row) => [row._id, row]));
  const feedingByDate = new Map(feedingDaily.map((row) => [row._id, row]));
  const dateKeys = Array.from(
    new Set([...attendanceByDate.keys(), ...feedingByDate.keys()]),
  ).sort((a, b) => b.localeCompare(a));

  const recentDailyRows = dateKeys.map((dateKey) => {
    const attendance = attendanceByDate.get(dateKey);
    const feeding = feedingByDate.get(dateKey);
    const present = attendance?.present ?? 0;
    const absent = attendance?.absent ?? 0;
    const completed = feeding?.completed ?? 0;
    const missed = feeding?.missed ?? 0;
    const attendanceTotal = present + absent;
    const feedingTotal = completed + missed;

    return {
      dateKey,
      label: dateKey,
      attendanceRate: attendanceTotal ? Math.round((present / attendanceTotal) * 100) : 0,
      feedingRate: feedingTotal ? Math.round((completed / feedingTotal) * 100) : 0,
      present,
      absent,
      completed,
      missed,
    };
  });

  const attendancePresent = attendanceDaily.reduce((sum, row) => sum + row.present, 0);
  const attendanceAbsent = attendanceDaily.reduce((sum, row) => sum + row.absent, 0);
  const feedingCompleted = feedingDaily.reduce((sum, row) => sum + row.completed, 0);
  const feedingMissed = feedingDaily.reduce((sum, row) => sum + row.missed, 0);
  const attendanceRecords = attendancePresent + attendanceAbsent;
  const feedingRecords = feedingCompleted + feedingMissed;
  const totalChecks = attendanceRecords + feedingRecords;

  return {
    summary: {
      totalChildDevelopmentCenters,
      childDevelopmentWorkers,
      totalEnrolledChildren,
      fourPsBeneficiaries,
      regularAttendees,
      totalChildren: totalEnrolledChildren,
      activeChildren,
      totalTeachers: childDevelopmentWorkers,
      attendanceRecords,
      feedingRecords,
      totalChecks,
      attendanceRate: attendanceRecords
        ? Math.round((attendancePresent / attendanceRecords) * 100)
        : 0,
      feedingRate: feedingRecords
        ? Math.round((feedingCompleted / feedingRecords) * 100)
        : 0,
    },
    demographics: {
      genderBreakdown,
      ageBreakdown,
    },
    studentList,
    studentListPagination: {
      page: normalizedPage,
      limit,
      total: totalEnrolledChildren,
      totalPages: totalStudentPages,
    },
    recentDailyRows: recentDailyRows.slice(0, 10),
    hasData: totalChecks > 0 || totalEnrolledChildren > 0,
    lastUpdatedAt: new Date().toISOString(),
  };
}
