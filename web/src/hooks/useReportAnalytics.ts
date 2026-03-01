import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/components/config/config.api";

type ChildRef = {
  _id: string;
  firstName: string;
  middleName?: string;
  middle?: string;
  middle_name?: string;
  lastName: string;
};

type AttendanceEntry = {
  _id: string;
  date: string;
  records: Array<{
    child: ChildRef | string;
    status: "present" | "absent";
  }>;
};

type FeedingEntry = {
  _id: string;
  date: string;
  records: Array<{
    child: ChildRef | string;
    status: "completed" | "missed";
  }>;
};

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

export type StatusDistributionPoint = {
  name: string;
  value: number;
  color: string;
};

export type ExceptionRow = {
  childId: string;
  childName: string;
  absentCount: number;
  missedCount: number;
  totalExceptions: number;
};

export type ReportSummary = {
  totalChildren: number;
  activeChildren: number;
  totalTeachers: number;
  attendanceRecords: number;
  feedingRecords: number;
  totalChecks: number;
  attendanceRate: number;
  feedingRate: number;
  exceptionRate: number;
  absentCount: number;
  missedCount: number;
};

type RawPayload = {
  children: any[];
  users: any[];
  attendance: AttendanceEntry[];
  feeding: FeedingEntry[];
};

type ActiveRange = {
  startKey: string | null;
  endKey: string | null;
  label: string;
  isValid: boolean;
};

const DEFAULT_RAW: RawPayload = {
  children: [],
  users: [],
  attendance: [],
  feeding: [],
};

const getLocalDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getRecordDateKey = (value: unknown) => {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "";
  return getLocalDateKey(date);
};

const formatDateKey = (key: string) => {
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

const formatChildName = (child?: ChildRef | null) => {
  if (!child) return "Unknown Child";
  const middleName = child.middleName ?? child.middle ?? child.middle_name;
  const trailing = [child.firstName, middleName].filter(Boolean).join(" ");
  return trailing ? `${child.lastName}, ${trailing}` : child.lastName;
};

const getChildId = (child: ChildRef | string) =>
  typeof child === "string" ? child : String(child?._id || "");

const buildDateKeysBetween = (startKey: string, endKey: string) => {
  const [startYear, startMonth, startDay] = startKey.split("-").map(Number);
  const [endYear, endMonth, endDay] = endKey.split("-").map(Number);
  if (
    !startYear ||
    !startMonth ||
    !startDay ||
    !endYear ||
    !endMonth ||
    !endDay
  ) {
    return [];
  }

  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const keys: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    keys.push(getLocalDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return keys;
};

const toCsvCell = (value: string | number) => {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const formatDateTime = (value?: string) =>
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
  const [raw, setRaw] = useState<RawPayload>(DEFAULT_RAW);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<ReportDatePreset>("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchJson = async (url: string) => {
        const response = await fetch(url, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message =
            (payload as { message?: string; error?: string }).message ||
            (payload as { message?: string; error?: string }).error ||
            `Request failed (${response.status})`;
          throw new Error(message);
        }
        return payload;
      };

      const [childrenPayload, usersPayload, attendancePayload, feedingPayload] =
        await Promise.all([
          fetchJson(`${API_BASE}/children`),
          fetchJson(`${API_BASE}/auth/users`),
          fetchJson(`${API_BASE}/records/attendance`),
          fetchJson(`${API_BASE}/records/feeding`),
        ]);

      setRaw({
        children: Array.isArray(childrenPayload) ? childrenPayload : [],
        users: Array.isArray((usersPayload as { users?: unknown[] }).users)
          ? ((usersPayload as { users?: unknown[] }).users as any[])
          : [],
        attendance: Array.isArray(attendancePayload)
          ? (attendancePayload as AttendanceEntry[])
          : [],
        feeding: Array.isArray(feedingPayload)
          ? (feedingPayload as FeedingEntry[])
          : [],
      });
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to load report analytics",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReportData();
  }, [fetchReportData]);

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

  const activeRange = useMemo<ActiveRange>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = getLocalDateKey(today);

    if (datePreset === "custom") {
      if (customRangeError || !customStartDate || !customEndDate) {
        return {
          startKey: customStartDate || null,
          endKey: customEndDate || null,
          label: "Custom range",
          isValid: false,
        };
      }
      return {
        startKey: customStartDate,
        endKey: customEndDate,
        label: `${formatDateKey(customStartDate)} - ${formatDateKey(customEndDate)}`,
        isValid: true,
      };
    }

    if (datePreset === "all") {
      return {
        startKey: null,
        endKey: null,
        label: "All time",
        isValid: true,
      };
    }

    const dayCount = datePreset === "7d" ? 7 : datePreset === "30d" ? 30 : 90;
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

  const isDateInRange = useCallback(
    (dateKey: string) => {
      if (!activeRange.isValid || !dateKey) return false;
      if (activeRange.startKey && dateKey < activeRange.startKey) return false;
      if (activeRange.endKey && dateKey > activeRange.endKey) return false;
      return true;
    },
    [activeRange],
  );

  const childMap = useMemo(() => {
    const entries: Array<[string, any]> = [];
    raw.children.forEach((child: any) => {
      const childId = String(child?._id || "");
      if (childId) entries.push([childId, child]);
    });
    return new Map<string, any>(entries);
  }, [raw.children]);

  const filteredAttendance = useMemo(() => {
    if (!activeRange.isValid) return [];
    return raw.attendance.filter((entry) =>
      isDateInRange(getRecordDateKey(entry?.date)),
    );
  }, [activeRange.isValid, isDateInRange, raw.attendance]);

  const filteredFeeding = useMemo(() => {
    if (!activeRange.isValid) return [];
    return raw.feeding.filter((entry) =>
      isDateInRange(getRecordDateKey(entry?.date)),
    );
  }, [activeRange.isValid, isDateInRange, raw.feeding]);

  const computed = useMemo(() => {
    let attendanceTotal = 0;
    let attendancePresent = 0;
    let attendanceAbsent = 0;
    let feedingTotal = 0;
    let feedingCompleted = 0;
    let feedingMissed = 0;

    const dailyBuckets = new Map<
      string,
      {
        attendanceTotal: number;
        attendancePresent: number;
        attendanceAbsent: number;
        feedingTotal: number;
        feedingCompleted: number;
        feedingMissed: number;
      }
    >();

    const exceptionsByChild = new Map<
      string,
      {
        childId: string;
        childName: string;
        absentCount: number;
        missedCount: number;
      }
    >();

    const ensureBucket = (dateKey: string) => {
      if (!dailyBuckets.has(dateKey)) {
        dailyBuckets.set(dateKey, {
          attendanceTotal: 0,
          attendancePresent: 0,
          attendanceAbsent: 0,
          feedingTotal: 0,
          feedingCompleted: 0,
          feedingMissed: 0,
        });
      }
      return dailyBuckets.get(dateKey)!;
    };

    const upsertChildException = (
      childId: string,
      childName: string,
      field: "absentCount" | "missedCount",
    ) => {
      if (!exceptionsByChild.has(childId)) {
        exceptionsByChild.set(childId, {
          childId,
          childName,
          absentCount: 0,
          missedCount: 0,
        });
      }
      const row = exceptionsByChild.get(childId)!;
      row[field] += 1;
    };

    filteredAttendance.forEach((entry) => {
      const dateKey = getRecordDateKey(entry.date);
      if (!dateKey) return;
      const bucket = ensureBucket(dateKey);

      (entry.records || []).forEach((record, recordIndex) => {
        attendanceTotal += 1;
        bucket.attendanceTotal += 1;

        if (record.status === "present") {
          attendancePresent += 1;
          bucket.attendancePresent += 1;
        } else {
          attendanceAbsent += 1;
          bucket.attendanceAbsent += 1;

          const childId = getChildId(record.child) || `unknown-${recordIndex}`;
          const childObj =
            typeof record.child === "object"
              ? record.child
              : childMap.get(childId) || null;
          upsertChildException(
            childId,
            formatChildName(childObj),
            "absentCount",
          );
        }
      });
    });

    filteredFeeding.forEach((entry) => {
      const dateKey = getRecordDateKey(entry.date);
      if (!dateKey) return;
      const bucket = ensureBucket(dateKey);

      (entry.records || []).forEach((record, recordIndex) => {
        feedingTotal += 1;
        bucket.feedingTotal += 1;

        if (record.status === "completed") {
          feedingCompleted += 1;
          bucket.feedingCompleted += 1;
        } else {
          feedingMissed += 1;
          bucket.feedingMissed += 1;

          const childId = getChildId(record.child) || `unknown-${recordIndex}`;
          const childObj =
            typeof record.child === "object"
              ? record.child
              : childMap.get(childId) || null;
          upsertChildException(
            childId,
            formatChildName(childObj),
            "missedCount",
          );
        }
      });
    });

    let dateKeys: string[];
    if (activeRange.startKey && activeRange.endKey) {
      dateKeys = buildDateKeysBetween(activeRange.startKey, activeRange.endKey);
    } else {
      dateKeys = Array.from(dailyBuckets.keys()).sort((a, b) =>
        a.localeCompare(b),
      );
      if (dateKeys.length > 45) {
        dateKeys = dateKeys.slice(dateKeys.length - 45);
      }
    }

    const dailyTrends: TrendPoint[] = dateKeys.map((dateKey) => {
      const bucket = dailyBuckets.get(dateKey) || {
        attendanceTotal: 0,
        attendancePresent: 0,
        attendanceAbsent: 0,
        feedingTotal: 0,
        feedingCompleted: 0,
        feedingMissed: 0,
      };

      return {
        dateKey,
        label: new Intl.DateTimeFormat("en-PH", {
          month: "short",
          day: "2-digit",
          timeZone: "Asia/Manila",
        }).format(new Date(dateKey)),
        attendanceRate: bucket.attendanceTotal
          ? Math.round(
              (bucket.attendancePresent / bucket.attendanceTotal) * 100,
            )
          : 0,
        feedingRate: bucket.feedingTotal
          ? Math.round((bucket.feedingCompleted / bucket.feedingTotal) * 100)
          : 0,
        present: bucket.attendancePresent,
        absent: bucket.attendanceAbsent,
        completed: bucket.feedingCompleted,
        missed: bucket.feedingMissed,
      };
    });

    const topExceptions: ExceptionRow[] = Array.from(exceptionsByChild.values())
      .map((row) => ({
        ...row,
        totalExceptions: row.absentCount + row.missedCount,
      }))
      .sort((a, b) => {
        if (b.totalExceptions !== a.totalExceptions) {
          return b.totalExceptions - a.totalExceptions;
        }
        return a.childName.localeCompare(b.childName);
      })
      .slice(0, 8);

    const statusDistribution: StatusDistributionPoint[] = [
      { name: "Present", value: attendancePresent, color: "#10b981" },
      { name: "Absent", value: attendanceAbsent, color: "#f43f5e" },
      { name: "Fed", value: feedingCompleted, color: "#14b8a6" },
      { name: "Missed Meal", value: feedingMissed, color: "#f59e0b" },
    ].filter((item) => item.value > 0);

    if (statusDistribution.length === 0) {
      statusDistribution.push({
        name: "No Data",
        value: 1,
        color: "#cbd5e1",
      });
    }

    const recentDailyRows = [...dailyTrends].reverse().slice(0, 10);

    return {
      attendanceTotal,
      attendancePresent,
      attendanceAbsent,
      feedingTotal,
      feedingCompleted,
      feedingMissed,
      dailyTrends,
      recentDailyRows,
      topExceptions,
      statusDistribution,
    };
  }, [
    activeRange.endKey,
    activeRange.startKey,
    childMap,
    filteredAttendance,
    filteredFeeding,
  ]);

  const summary = useMemo<ReportSummary>(() => {
    const totalChildren = raw.children.length;
    const activeChildren = raw.children.filter(
      (child: any) => child.status === "Active",
    ).length;
    const totalTeachers = raw.users.filter(
      (user: any) => user.role === "teacher",
    ).length;
    const totalChecks = computed.attendanceTotal + computed.feedingTotal;
    const exceptionCount = computed.attendanceAbsent + computed.feedingMissed;

    return {
      totalChildren,
      activeChildren,
      totalTeachers,
      attendanceRecords: computed.attendanceTotal,
      feedingRecords: computed.feedingTotal,
      totalChecks,
      attendanceRate: computed.attendanceTotal
        ? Math.round(
            (computed.attendancePresent / computed.attendanceTotal) * 100,
          )
        : 0,
      feedingRate: computed.feedingTotal
        ? Math.round((computed.feedingCompleted / computed.feedingTotal) * 100)
        : 0,
      exceptionRate: totalChecks
        ? Math.round((exceptionCount / totalChecks) * 100)
        : 0,
      absentCount: computed.attendanceAbsent,
      missedCount: computed.feedingMissed,
    };
  }, [computed, raw.children, raw.users]);

  const hasData = summary.totalChecks > 0;

  const lastUpdatedLabel = useMemo(
    () => formatDateTime(lastUpdatedAt),
    [lastUpdatedAt],
  );

  const downloadCsv = useCallback(() => {
    const lines: string[] = [];
    lines.push("Smart KidCare - Reports and Analytics");
    lines.push(`Range,${toCsvCell(activeRange.label)}`);
    lines.push(
      `Generated At,${toCsvCell(formatDateTime(new Date().toISOString()))}`,
    );
    lines.push("");

    lines.push("Summary");
    lines.push("Metric,Value");
    lines.push(`Total Children,${summary.totalChildren}`);
    lines.push(`Active Children,${summary.activeChildren}`);
    lines.push(`Total Teachers,${summary.totalTeachers}`);
    lines.push(`Attendance Records,${summary.attendanceRecords}`);
    lines.push(`Feeding Records,${summary.feedingRecords}`);
    lines.push(`Attendance Rate,${summary.attendanceRate}%`);
    lines.push(`Feeding Rate,${summary.feedingRate}%`);
    lines.push(`Exception Rate,${summary.exceptionRate}%`);
    lines.push("");

    lines.push("Daily Trend");
    lines.push(
      "Date,Attendance Rate,Feeding Rate,Present,Absent,Fed,Missed Meal",
    );
    computed.dailyTrends.forEach((row) => {
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
    lines.push("");

    lines.push("Top Exceptions by Child");
    lines.push("Child Name,Absences,Missed Meals,Total Exceptions");
    computed.topExceptions.forEach((row) => {
      lines.push(
        [
          toCsvCell(row.childName),
          toCsvCell(row.absentCount),
          toCsvCell(row.missedCount),
          toCsvCell(row.totalExceptions),
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
  }, [
    activeRange.label,
    computed.dailyTrends,
    computed.topExceptions,
    summary,
  ]);

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
    dailyTrends: computed.dailyTrends,
    recentDailyRows: computed.recentDailyRows,
    topExceptions: computed.topExceptions,
    statusDistribution: computed.statusDistribution,
    hasData,
    fetchReportData,
    downloadCsv,
  };
}
