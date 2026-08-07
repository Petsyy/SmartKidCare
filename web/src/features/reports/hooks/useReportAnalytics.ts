import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/api/config";
import { webQueryKeys } from "@/lib/query-keys";

export type ReportDatePreset = "7d" | "30d" | "90d" | "all" | "custom";

export type TrendPoint = {
  dateKey: string;
  label: string;
  attendanceRate: number;
  feedingRate: number;
  present: number;
  absent: number;
  completed: number;
  missed: number;
};

export type ReportSummary = {
  totalChildDevelopmentCenters: number;
  childDevelopmentWorkers: number;
  totalEnrolledChildren: number;
  fourPsBeneficiaries: number;
  regularAttendees: number;
  totalChildren: number;
  activeChildren: number;
  totalTeachers: number;
  attendanceRecords: number;
  feedingRecords: number;
  totalChecks: number;
  attendanceRate: number;
  feedingRate: number;
};

export type ReportGenderBreakdown = {
  male: number;
  female: number;
  total: number;
  malePercentage: number;
  femalePercentage: number;
};

export type ReportAgeBreakdownItem = {
  age: number;
  count: number;
};

export type ReportStudentListItem = {
  id: string;
  studentId: string;
  fullName: string;
  gender: "male" | "female";
  age: number;
  status: string;
  programType: string;
  schoolYear: string;
  teacherName: string;
  centerName: string;
  enrollmentDate: string | null;
};

export type ReportStudentListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminReportPayload = {
  summary: ReportSummary;
  demographics: {
    genderBreakdown: ReportGenderBreakdown;
    ageBreakdown: ReportAgeBreakdownItem[];
  };
  studentList: ReportStudentListItem[];
  studentListPagination: ReportStudentListPagination;
  recentDailyRows: TrendPoint[];
  hasData: boolean;
  lastUpdatedAt: string;
};

type ActiveRange = {
  startKey: string | null;
  endKey: string | null;
  label: string;
  isValid: boolean;
};

const EMPTY_DAILY_ROWS: TrendPoint[] = [];
const EMPTY_AGE_BREAKDOWN: ReportAgeBreakdownItem[] = [];
const EMPTY_STUDENT_LIST: ReportStudentListItem[] = [];
const DEFAULT_STUDENT_PAGINATION: ReportStudentListPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const DEFAULT_SUMMARY: ReportSummary = {
  totalChildDevelopmentCenters: 0,
  childDevelopmentWorkers: 0,
  totalEnrolledChildren: 0,
  fourPsBeneficiaries: 0,
  regularAttendees: 0,
  totalChildren: 0,
  activeChildren: 0,
  totalTeachers: 0,
  attendanceRecords: 0,
  feedingRecords: 0,
  totalChecks: 0,
  attendanceRate: 0,
  feedingRate: 0,
};

const DEFAULT_GENDER_BREAKDOWN: ReportGenderBreakdown = {
  male: 0,
  female: 0,
  total: 0,
  malePercentage: 0,
  femalePercentage: 0,
};

const getLocalDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateKey = (key: string) => {
  if (!key) return "-";
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return key;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(year, month - 1, day));
};

export const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Manila",
      })
    : "-";

const toCsvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function useReportAnalytics() {
  const [datePreset, setDatePreset] = useState<ReportDatePreset>("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(10);

  const customRangeError = useMemo(() => {
    if (datePreset !== "custom") return null;
    if (!customStartDate || !customEndDate) {
      return "Select both start and end dates for custom range.";
    }
    if (customStartDate > customEndDate) {
      return "Start date must be earlier than end date.";
    }
    return null;
  }, [customEndDate, customStartDate, datePreset]);

  useEffect(() => {
    setStudentPage(1);
  }, [datePreset, customStartDate, customEndDate]);

  const activeRange = useMemo<ActiveRange>(() => {
    const today = new Date();
    const todayKey = getLocalDateKey(today);

    if (datePreset === "all") {
      return {
        startKey: null,
        endKey: null,
        label: "All available records",
        isValid: true,
      };
    }

    if (datePreset === "custom") {
      return {
        startKey: customStartDate || null,
        endKey: customEndDate || null,
        label:
          customStartDate && customEndDate
            ? `${formatDateKey(customStartDate)} - ${formatDateKey(customEndDate)}`
            : "Custom range",
        isValid: !customRangeError,
      };
    }

    const dayCount = datePreset === "7d" ? 7 : datePreset === "90d" ? 90 : 30;
    const start = new Date(today);
    start.setDate(today.getDate() - (dayCount - 1));
    const startKey = getLocalDateKey(start);

    return {
      startKey,
      endKey: todayKey,
      label: `Last ${dayCount} days (${formatDateKey(startKey)} - ${formatDateKey(todayKey)})`,
      isValid: true,
    };
  }, [customEndDate, customRangeError, customStartDate, datePreset]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (datePreset === "custom") {
      if (customStartDate) params.set("startDate", customStartDate);
      if (customEndDate) params.set("endDate", customEndDate);
    } else {
      params.set("datePreset", datePreset);
    }
    params.set("page", String(studentPage));
    params.set("limit", String(studentPageSize));
    return params.toString();
  }, [customEndDate, customStartDate, datePreset, studentPage, studentPageSize]);

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: webQueryKeys.reportAnalytics(queryParams),
    enabled: activeRange.isValid,
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/reports/admin-analytics?${queryParams}`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (payload as { message?: string }).message ||
            `Unable to load report analytics (${response.status})`,
        );
      }
      return payload as AdminReportPayload;
    },
  });

  const summary = data?.summary ?? DEFAULT_SUMMARY;
  const genderBreakdown = data?.demographics?.genderBreakdown ?? DEFAULT_GENDER_BREAKDOWN;
  const ageBreakdown = data?.demographics?.ageBreakdown ?? EMPTY_AGE_BREAKDOWN;
  const studentList = data?.studentList ?? EMPTY_STUDENT_LIST;
  const studentListPagination = data?.studentListPagination ?? DEFAULT_STUDENT_PAGINATION;
  const recentDailyRows = data?.recentDailyRows ?? EMPTY_DAILY_ROWS;
  const hasData = data?.hasData ?? false;
  const lastUpdatedLabel = formatDateTime(data?.lastUpdatedAt);
  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? "Unable to load report analytics."
        : null;

  const fetchReportData = useCallback(async () => {
    if (activeRange.isValid) await refetch();
  }, [activeRange.isValid, refetch]);

  const downloadCsv = useCallback(() => {
    const lines: string[] = [
      "Smart KidCare - Printable Reports",
      `Range,${toCsvCell(activeRange.label)}`,
      `Generated At,${toCsvCell(formatDateTime(new Date().toISOString()))}`,
      "",
      "Summary",
      "Metric,Value",
      `Total Child Development Centers,${summary.totalChildDevelopmentCenters}`,
      `Child Development Workers,${summary.childDevelopmentWorkers}`,
      `Total Enrolled Children,${summary.totalEnrolledChildren}`,
      `Active Children,${summary.activeChildren}`,
      `4P's Beneficiaries,${summary.fourPsBeneficiaries}`,
      `Regular Attendees,${summary.regularAttendees}`,
      `Attendance Records,${summary.attendanceRecords}`,
      `Feeding Records,${summary.feedingRecords}`,
      `Attendance Rate,${summary.attendanceRate}%`,
      `Feeding Rate,${summary.feedingRate}%`,
      "",
      "Student Demographics",
      "Metric,Value",
      `Male,${genderBreakdown.male}`,
      `Female,${genderBreakdown.female}`,
      `Male Ratio,${genderBreakdown.malePercentage}%`,
      `Female Ratio,${genderBreakdown.femalePercentage}%`,
      "",
      "Age Distribution",
      "Age,Students",
    ];

    ageBreakdown.forEach((row) => {
      lines.push([toCsvCell(row.age), toCsvCell(row.count)].join(","));
    });

    lines.push("", "Student List", "Student ID,Name,Gender,Age,Status,Program Type,School Year,Teacher,Center,Enrollment Date");

    studentList.forEach((student) => {
      lines.push(
        [
          toCsvCell(student.studentId),
          toCsvCell(student.fullName),
          toCsvCell(student.gender),
          toCsvCell(student.age),
          toCsvCell(student.status),
          toCsvCell(student.programType),
          toCsvCell(student.schoolYear),
          toCsvCell(student.teacherName),
          toCsvCell(student.centerName),
          toCsvCell(student.enrollmentDate ? formatDateTime(student.enrollmentDate) : "-"),
        ].join(","),
      );
    });

    lines.push("", "Recent Daily Summary", "Date,Attendance Rate,Feeding Rate,Present,Absent,Completed,Missed Meal");

    recentDailyRows.forEach((row) => {
      lines.push(
        [
          toCsvCell(formatDateKey(row.dateKey)),
          toCsvCell(`${row.attendanceRate}%`),
          toCsvCell(`${row.feedingRate}%`),
          toCsvCell(row.present),
          toCsvCell(row.absent),
          toCsvCell(row.completed),
          toCsvCell(row.missed),
        ].join(","),
      );
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `smartkidcare-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [activeRange.label, ageBreakdown, genderBreakdown, recentDailyRows, studentList, summary]);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  return {
    isLoading,
    error,
    datePreset,
    setDatePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    customRangeError,
    activeRange,
    lastUpdatedLabel,
    summary,
    genderBreakdown,
    ageBreakdown,
    studentList,
    studentListPagination,
    studentPage,
    setStudentPage,
    studentPageSize,
    setStudentPageSize,
    recentDailyRows,
    hasData,
    fetchReportData,
    downloadCsv,
    printReport,
  };
}
