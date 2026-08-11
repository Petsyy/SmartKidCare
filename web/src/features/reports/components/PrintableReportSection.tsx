import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pagination } from "@/components/ui/Pagination";
import type {
  ReportAgeBreakdownItem,
  ReportGenderBreakdown,
  ReportStudentListItem,
  ReportStudentListPagination,
  ReportSummary,
  TrendPoint,
} from "@/features/reports/hooks/useReportAnalytics";
import {
  formatDateKey,
  formatDateTime,
} from "@/features/reports/hooks/useReportAnalytics";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-PH");
const formatNumber = (value: number) => NUMBER_FORMATTER.format(value);
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const STUDENT_PAGE_SIZE_OPTIONS = [10, 20, 50];

const GENDER_COLORS = ["#14b8a6", "#f472b6"];
const AGE_COLOR = "#0f766e";
const ATTENDANCE_COLOR = "#0d9488";
const FEEDING_COLOR = "#3b82f6";

type PrintableReportSectionProps = {

  activeRangeLabel: string;
  generatedAtLabel: string;
  summary: ReportSummary;
  genderBreakdown: ReportGenderBreakdown;
  ageBreakdown: ReportAgeBreakdownItem[];
  studentList: ReportStudentListItem[];
  studentListPagination: ReportStudentListPagination;
  studentPage: number;
  setStudentPage: (page: number) => void;
  studentPageSize: number;
  setStudentPageSize: (size: number) => void;
  recentDailyRows: TrendPoint[];
};

export function PrintableReportSection({
  activeRangeLabel,
  generatedAtLabel,
  summary,
  genderBreakdown,
  ageBreakdown,
  studentList,
  studentListPagination,
  studentPage, 
  setStudentPage,
  setStudentPageSize,
  studentPageSize,
  recentDailyRows,
}: PrintableReportSectionProps) {
  const studentRangeLabel =
    studentListPagination.total === 0
      ? "No students found"
      : `Showing ${(studentListPagination.page - 1) * studentListPagination.limit + 1}-${Math.min(studentListPagination.page * studentListPagination.limit, studentListPagination.total)} of ${studentListPagination.total} students`;

  const genderChartData = [
    {
      name: "Male",
      value: genderBreakdown.male,
      percentage: genderBreakdown.malePercentage,
    },
    {
      name: "Female",
      value: genderBreakdown.female,
      percentage: genderBreakdown.femalePercentage,
    },
  ];

  const trendRows = [...recentDailyRows].reverse();

  return (
    <section className="print-report-sheet rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <style>
        {`@page {
          size: A4 portrait;
          margin: 12mm;
        }

        @media print {
          body,
          #root {
            background: #ffffff !important;
          }

          .dark {
            color-scheme: light;
          }

          .no-print {
            display: none !important;
          }

          .print-report-sheet {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border-color: #d1d5db !important;
            box-shadow: none !important;
          }

          .print-report-header {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-end !important;
            justify-content: space-between !important;
            gap: 16px !important;
          }

          .print-summary-grid {
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }

          .print-summary-grid > div {
            padding: 12px !important;
          }

          .print-summary-grid > div > p:last-child {
            margin-top: 4px !important;
            font-size: 20px !important;
            line-height: 1.2 !important;
          }

          .print-demographics-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
            margin-top: 12px !important;
          }

          .print-card-padding {
            padding: 14px !important;
          }

          .print-table-wrap {
            overflow: visible !important;
          }

          .print-table-wrap table {
            width: 100% !important;
            table-layout: fixed;
            font-size: 10px;
          }

          .print-table-wrap th,
          .print-table-wrap td {
            padding: 5px 6px !important;
            word-break: break-word;
          }

          .print-table-card {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          .print-table-wrap thead {
            display: table-header-group;
          }

          .print-table-wrap tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-page-break {
            break-before: page;
            page-break-before: always;
          }
        }
      `}
      </style>

      <div className="print-card print-card-padding rounded-xl border border-gray-200 p-6 dark:border-slate-700">
        <div className="print-report-header flex flex-col gap-2 border-b border-gray-200 pb-4 dark:border-slate-700 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
              SMART KIDCARE MONITORING SYSTEM
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Student demographics, attendance and feeding trends, and
              enrollment roster.
            </p>
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            <p>Range: {activeRangeLabel}</p>
            <p>Generated: {generatedAtLabel}</p>
          </div>
        </div>

        <div className="print-summary-grid mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-teal-50 p-4 text-teal-900">
            <p className="text-xs font-semibold uppercase tracking-wide">
              Total Enrolled
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {formatNumber(summary.totalEnrolledChildren)}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 text-blue-900">
            <p className="text-xs font-semibold uppercase tracking-wide">
              Active Children
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {formatNumber(summary.activeChildren)}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-emerald-900">
            <p className="text-xs font-semibold uppercase tracking-wide">
              Attendance Rate
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {summary.attendanceRate}%
            </p>
          </div>
          <div className="rounded-lg bg-violet-50 p-4 text-violet-900">
            <p className="text-xs font-semibold uppercase tracking-wide">
              Feeding Rate
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {summary.feedingRate}%
            </p>
          </div>
        </div>
      </div>

      <div className="print-demographics-grid mt-6 grid gap-6 xl:grid-cols-2">
        <div className="print-card print-card-padding rounded-xl border border-gray-200 p-6 dark:border-slate-700">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Gender Ratio
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Male and female distribution for the selected range.
            </p>
          </div>
          <div className="print-compact-chart h-72" role="img" aria-label="Gender ratio chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={72}
                  label={(entry) => `${entry.name} ${formatPercent(Number(entry.payload?.percentage ?? 0))}`}
                >
                  {genderChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value?: number | string) => Number(value ?? 0)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="print-card print-card-padding rounded-xl border border-gray-200 p-6 dark:border-slate-700">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Age Distribution
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Student count grouped by age.
            </p>
          </div>
          <div className="print-compact-chart h-72" role="img" aria-label="Age distribution chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageBreakdown} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="age" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                <Tooltip formatter={(value?: number | string) => Number(value ?? 0)} />
                <Bar dataKey="count" name="Students" fill={AGE_COLOR} radius={[6, 6, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="print-trend-card print-card print-card-padding mt-6 rounded-xl border border-gray-200 p-6 dark:border-slate-700">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Attendance and Feeding Trends
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Recent daily percentages across attendance and feeding records.
          </p>
        </div>
        <div className="print-compact-chart print-trend-chart h-80" role="img" aria-label="Attendance and feeding trend chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendRows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="dateKey" tickFormatter={formatDateKey} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
              <Tooltip labelFormatter={(label) => formatDateKey(String(label))} />
              <Legend />
              <Bar dataKey="attendanceRate" name="Attendance Rate %" fill={ATTENDANCE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="feedingRate" name="Feeding Rate %" fill={FEEDING_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="print-table-card print-card-padding mt-6 print-page-break print-card rounded-xl border border-gray-200 p-6 dark:border-slate-700">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Student List
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Enrollment roster for the selected range with demographic and
            assignment details.
          </p>
        </div>
        <div className="print-table-wrap overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                {[
                  "Student ID",
                  "Name",
                  "Gender",
                  "Age",
                  "Status",
                  "Program",
                  "School Year",
                  "Teacher",
                  "Center",
                  "Enrolled",
                ].map((heading) => (
                  <th key={heading} className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-slate-300">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {studentList.map((student) => (
                <tr key={student.id}>
                  <td className="px-3 py-2">{student.studentId}</td>
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-slate-100">{student.fullName}</td>
                  <td className="px-3 py-2 capitalize">{student.gender}</td>
                  <td className="px-3 py-2">{student.age}</td>
                  <td className="px-3 py-2">{student.status}</td>
                  <td className="px-3 py-2">{student.programType}</td>
                  <td className="px-3 py-2">{student.schoolYear}</td>
                  <td className="px-3 py-2">{student.teacherName}</td>
                  <td className="px-3 py-2">{student.centerName}</td>
                  <td className="px-3 py-2">
                    {student.enrollmentDate ? formatDateTime(student.enrollmentDate) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="no-print mt-2">
          <Pagination
            page={studentPage}
            totalPages={studentListPagination.totalPages}
            rangeLabel={studentRangeLabel}
            onPageChange={setStudentPage}
            pageSizeOptions={STUDENT_PAGE_SIZE_OPTIONS}
            pageSize={studentPageSize}
            onPageSizeChange={setStudentPageSize}
          />
        </div>
      </div>
    </section>
  );
}







