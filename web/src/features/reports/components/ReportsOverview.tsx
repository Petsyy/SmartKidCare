import { useState } from "react";
import {
  Building2,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  UserRoundCheck,
  Users,
  Utensils,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { StatCard } from "@/components/ui/StatCard";
import type {
  ReportAgeBreakdownItem,
  ReportGenderBreakdown,
  ReportStudentListItem,
  ReportStudentListPagination,
  ReportSummary,
  TrendPoint,
} from "@/features/reports/hooks/useReportAnalytics";
import { formatDateKey } from "@/features/reports/hooks/useReportAnalytics";
import { ReportsDailySummaryTable } from "./ReportsTables";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-PH");
const STUDENT_PAGE_SIZE_OPTIONS = [10, 20, 50];
const ATTENDANCE_COLOR = "#0d9488";
const FEEDING_COLOR = "#3b82f6";
const AGE_COLOR = "#0f766e";

const formatNumber = (value: number) => NUMBER_FORMATTER.format(value);

const formatEnrollmentDate = (value: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
};

type ReportsOverviewProps = {
  rangeLabel: string;
  summary: ReportSummary;
  genderBreakdown: ReportGenderBreakdown;
  ageBreakdown: ReportAgeBreakdownItem[];
  recentDailyRows: TrendPoint[];
  studentList: ReportStudentListItem[];
  studentListPagination: ReportStudentListPagination;
  studentPage: number;
  setStudentPage: (page: number) => void;
  studentPageSize: number;
  setStudentPageSize: (size: number) => void;
};

export function ReportsOverview({
  rangeLabel,
  summary,
  genderBreakdown,
  ageBreakdown,
  recentDailyRows,
  studentList,
  studentListPagination,
  studentPage,
  setStudentPage,
  studentPageSize,
  setStudentPageSize,
}: ReportsOverviewProps) {
  const [showDailyDetails, setShowDailyDetails] = useState(false);
  const trendRows = [...recentDailyRows].reverse();
  const hasTrendData = trendRows.length > 0;
  const hasDemographicData = genderBreakdown.total > 0;
  const studentRangeLabel =
    studentListPagination.total === 0
      ? "No students found"
      : `Showing ${
          (studentListPagination.page - 1) * studentListPagination.limit + 1
        }-${Math.min(
          studentListPagination.page * studentListPagination.limit,
          studentListPagination.total,
        )} of ${studentListPagination.total} students`;

  return (
    <div className="space-y-6">
      <section aria-labelledby="overview-summary-title">
        <div className="mb-3">
          <h2
            id="overview-summary-title"
            className="text-lg font-semibold text-gray-900 dark:text-slate-50"
          >
            Report Summary
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Key enrollment and program indicators for {rangeLabel.toLowerCase()}.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Development Centers"
            value={formatNumber(summary.totalChildDevelopmentCenters)}
            subtitle="Centers in the selected scope"
            icon={Building2}
            color="teal"
          />
          <StatCard
            title="Child Development Workers"
            value={formatNumber(summary.childDevelopmentWorkers)}
            subtitle="Active teacher accounts"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Enrolled Children"
            value={formatNumber(summary.totalEnrolledChildren)}
            subtitle="Children enrolled in the selected range"
            icon={UserRoundCheck}
            color="purple"
          />
          <StatCard
            title="4Ps Beneficiaries"
            value={formatNumber(summary.fourPsBeneficiaries)}
            subtitle="Enrolled beneficiary children"
            icon={HeartPulse}
            color="rose"
          />
          <StatCard
            title="Attendance Rate"
            value={`${summary.attendanceRate}%`}
            subtitle={`${formatNumber(summary.attendanceRecords)} attendance checks`}
            icon={CalendarCheck}
            color="teal"
          />
          <StatCard
            title="Feeding Completion"
            value={`${summary.feedingRate}%`}
            subtitle={`${formatNumber(summary.feedingRecords)} feeding checks`}
            icon={Utensils}
            color="blue"
          />
        </div>
      </section>

      <section
        aria-labelledby="attendance-feeding-trends-title"
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              id="attendance-feeding-trends-title"
              className="text-lg font-semibold text-gray-900 dark:text-slate-50"
            >
              Attendance &amp; Feeding Trends
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Daily completion rates for the latest 10 recorded days in the selected range.
            </p>
          </div>
          {hasTrendData && (
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => setShowDailyDetails((current) => !current)}
              aria-expanded={showDailyDetails}
              aria-controls="daily-report-details"
              icon={
                showDailyDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )
              }
            >
              {showDailyDetails ? "Hide details" : "View detailed data"}
            </Button>
          )}
        </div>

        {!hasTrendData ? (
          <div className="mt-5 flex h-52 items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
            No attendance or feeding records are available for the selected range.
          </div>
        ) : (
          <>
            <div
              className="mt-5 h-80"
              role="img"
              aria-label="Attendance and feeding completion rates by date"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendRows}
                  margin={{ top: 8, right: 20, left: 0, bottom: 8 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="dateKey"
                    tickFormatter={formatDateKey}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip
                    labelFormatter={(label) => formatDateKey(String(label))}
                    formatter={(value?: number | string, name?: string) => [
                      `${Number(value ?? 0)}%`,
                      name ?? "Rate",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="attendanceRate"
                    name="Attendance Rate"
                    stroke={ATTENDANCE_COLOR}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="feedingRate"
                    name="Feeding Completion"
                    stroke={FEEDING_COLOR}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {showDailyDetails && (
              <div id="daily-report-details" className="mt-5">
                <ReportsDailySummaryTable recentDailyRows={recentDailyRows} />
              </div>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="student-demographics-title">
        <div className="mb-3">
          <h2
            id="student-demographics-title"
            className="text-lg font-semibold text-gray-900 dark:text-slate-50"
          >
            Student Demographics
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Gender and age distribution for children enrolled in the selected range.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">
              Gender Distribution
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Counts and percentages across enrolled children.
            </p>
            {!hasDemographicData ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-slate-400">
                No demographic records are available.
              </div>
            ) : (
              <div className="mt-8 space-y-5">
                <div
                  className="flex h-4 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800"
                  role="img"
                  aria-label={`Male ${genderBreakdown.malePercentage} percent, female ${genderBreakdown.femalePercentage} percent`}
                >
                  <div
                    className="bg-teal-500"
                    style={{ width: `${genderBreakdown.malePercentage}%` }}
                  />
                  <div
                    className="bg-pink-400"
                    style={{ width: `${genderBreakdown.femalePercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-teal-50 p-4 dark:bg-teal-500/10">
                    <p className="text-sm font-medium text-teal-800 dark:text-teal-300">
                      Male
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-100">
                      {formatNumber(genderBreakdown.male)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {genderBreakdown.malePercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-pink-50 p-4 dark:bg-pink-500/10">
                    <p className="text-sm font-medium text-pink-800 dark:text-pink-300">
                      Female
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-100">
                      {formatNumber(genderBreakdown.female)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {genderBreakdown.femalePercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">
              Age Distribution
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Number of enrolled children grouped by age.
            </p>
            {ageBreakdown.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-slate-400">
                No age records are available.
              </div>
            ) : (
              <div
                className="mt-4 h-60"
                role="img"
                aria-label="Number of enrolled children grouped by age"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ageBreakdown}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="age"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <Tooltip
                      formatter={(value?: number | string) => [
                        Number(value ?? 0),
                        "Students",
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      name="Students"
                      fill={AGE_COLOR}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={56}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="student-list-title"
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="p-6">
          <h2
            id="student-list-title"
            className="text-lg font-semibold text-gray-900 dark:text-slate-50"
          >
            Student List
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Read-only enrollment roster for the selected range and center.
          </p>
        </div>

        {studentList.length === 0 ? (
          <div className="border-t border-gray-200 px-6 py-12 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
            No students were enrolled in the selected range.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border-t border-gray-200 dark:border-slate-700">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    {[
                      "Student ID",
                      "Name",
                      "Gender",
                      "Age",
                      "Program",
                      "School Year",
                      "Teacher",
                      "Center",
                      "Enrolled",
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-300"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {studentList.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/60"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-slate-300">
                        {student.studentId}
                      </td>
                      <th
                        scope="row"
                        className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-900 dark:text-slate-100"
                      >
                        {student.fullName}
                      </th>
                      <td className="whitespace-nowrap px-4 py-3 capitalize text-gray-600 dark:text-slate-300">
                        {student.gender}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                        {student.age}
                      </td>
                      <td className="min-w-52 px-4 py-3 text-gray-600 dark:text-slate-300">
                        {student.programType}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-slate-300">
                        {student.schoolYear}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-slate-300">
                        {student.teacherName}
                      </td>
                      <td className="min-w-64 px-4 py-3 text-gray-600 dark:text-slate-300">
                        {student.centerName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-slate-300">
                        {formatEnrollmentDate(student.enrollmentDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={studentPage}
              totalPages={studentListPagination.totalPages}
              rangeLabel={studentRangeLabel}
              onPageChange={setStudentPage}
              pageSizeOptions={STUDENT_PAGE_SIZE_OPTIONS}
              pageSize={studentPageSize}
              onPageSizeChange={setStudentPageSize}
            />
          </>
        )}
      </section>
    </div>
  );
}
