import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/api/config";
import { webQueryKeys } from "@/lib/query-keys";
import { downloadCsvFile, todayFileKey, type CsvRow } from "../utils/csv-export";

export type ReportDatePreset = "7d" | "30d" | "90d" | "all" | "custom";

export type TrendPoint = {
  dateKey: string;
  label: string;
  attendanceRate: number;
  present: number;
  absent: number;
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
  attendanceRate: number;
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
  attendanceRate: 0,
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

export function useReportAnalytics() {
  const [datePreset, setDatePresetValue] = useState<ReportDatePreset>("30d");
  const [customStartDate, setCustomStartDateValue] = useState("");
  const [customEndDate, setCustomEndDateValue] = useState("");
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

  const setDatePreset = useCallback((value: ReportDatePreset) => {
    setDatePresetValue(value);
    setStudentPage(1);
  }, []);
  const setCustomStartDate = useCallback((value: string) => {
    setCustomStartDateValue(value);
    setStudentPage(1);
  }, []);
  const setCustomEndDate = useCallback((value: string) => {
    setCustomEndDateValue(value);
    setStudentPage(1);
  }, []);

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
    isFetching,
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

  const overviewCsvRows = useMemo<CsvRow[]>(() => {
    const generatedAt = formatDateTime(new Date().toISOString());
    const rows: CsvRow[] = [
      ["SMARTKIDCARE OVERVIEW REPORT"],
      ["Date Range", activeRange.label],
      ["Generated At", generatedAt],
      [],
      ["SUMMARY"],
      ["Metric", "Value", "Unit"],
      ["Bonuan Sabangan Daycare Center", summary.totalChildDevelopmentCenters, "Centers"],
      ["Child Development Worker", summary.childDevelopmentWorkers, "Workers"],
      ["Total Enrolled Children", summary.totalEnrolledChildren, "Children"],
      ["Active Children", summary.activeChildren, "Children"],
      ["4P's Beneficiaries", summary.fourPsBeneficiaries, "Children"],
      ["Regular Attendees", summary.regularAttendees, "Children"],
      ["Attendance Records", summary.attendanceRecords, "Records"],
      ["Attendance Rate", summary.attendanceRate, "Percent"],
      [],
      ["DEMOGRAPHICS"],
      ["Category", "Count", "Percentage"],
      ["Male", genderBreakdown.male, `${genderBreakdown.malePercentage}%`],
      ["Female", genderBreakdown.female, `${genderBreakdown.femalePercentage}%`],
      [],
      ["AGE DISTRIBUTION"],
      ["Age", "Number of Children"],
    ];

    ageBreakdown.forEach((row) => {
      rows.push([row.age, row.count]);
    });

    rows.push([], ["DAILY ATTENDANCE"], ["Date", "Attendance Rate", "Present", "Absent"]);
    recentDailyRows.forEach((row) => {
      rows.push([formatDateKey(row.dateKey), `${row.attendanceRate}%`, row.present, row.absent]);
    });

    rows.push(
      [],
      ["STUDENT LIST"],
      ["Name", "Gender", "Age", "Status", "Program Type", "School Year", "Teacher", "Enrollment Date"],
    );
    studentList.forEach((student) => {
      rows.push([
        student.fullName,
        student.gender,
        student.age,
        student.status,
        student.programType,
        student.schoolYear,
        student.teacherName,
        student.enrollmentDate ? formatDateTime(student.enrollmentDate) : "-",
      ]);
    });

    return rows;
  }, [activeRange.label, ageBreakdown, genderBreakdown, recentDailyRows, studentList, summary]);

  const downloadCsv = useCallback(() => {
    downloadCsvFile(`smartkidcare-overview-${todayFileKey()}.csv`, overviewCsvRows);
  }, [overviewCsvRows]);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  return {
    isLoading,
    isFetching,
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
    overviewCsvRows,
    downloadCsv,
    printReport,
  };
}
