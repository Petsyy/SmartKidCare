import { useNavigate } from "react-router-dom";
import { Users, Home, UserCircle, Heart, Smile } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useReportAnalytics } from "@/features/reports/hooks/useReportAnalytics";
import { ReportsFilters } from "@/features/reports/components/ReportsFilters";
import { ReportsDailySummaryTable } from "@/features/reports/components/ReportsTables";
import { StatCard } from "@/components/ui/StatCard";
import { CompetencyAnalytics } from "@/features/reports/components/CompetencyAnalytics";
import { PrintableReportSection } from "@/features/reports/components/PrintableReportSection";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-PH");
const formatNumber = (value: number) => NUMBER_FORMATTER.format(value);

export default function ReportAnalytics() {
  const navigate = useNavigate();
  const {
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
  } = useReportAnalytics();

  return (
    <Layout
      activeItem="reports"
      breadcrumbs={["Admin", "Reports & Analytics"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div className="no-print">
          <PageHeader
            title="Reports & Analytics"
            subtitle="Attendance, feeding, enrollment, competency, and printable student reports."
          />
        </div>

        <ReportsFilters
          datePreset={datePreset}
          setDatePreset={setDatePreset}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          customRangeError={customRangeError}
          activeRange={activeRange}
          lastUpdatedLabel={lastUpdatedLabel}
          hasData={hasData}
          onRefresh={() => void fetchReportData()}
          onExport={downloadCsv}
          onPrint={printReport}
        />

        {!isLoading && (
          <div className="no-print grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Total Child Development Centers" value={formatNumber(summary.totalChildDevelopmentCenters)} subtitle="Active centers" icon={Home} color="blue" />
            <StatCard title="Child Development Workers" value={formatNumber(summary.childDevelopmentWorkers)} subtitle="Active teacher accounts" icon={Users} color="teal" />
            <StatCard title="Total Enrolled Children" value={formatNumber(summary.totalEnrolledChildren)} subtitle="Children in selected range" icon={UserCircle} color="purple" />
            <StatCard title="4P's Beneficiaries" value={formatNumber(summary.fourPsBeneficiaries)} subtitle="Children under 4Ps program" icon={Heart} color="rose" />
            <StatCard title="Regular Attendees" value={formatNumber(summary.regularAttendees)} subtitle="Non-beneficiary enrollees" icon={Smile} color="blue" />
          </div>
        )}

        {error && <ErrorAlert message={error} />}

        <div className="no-print">
          <CompetencyAnalytics />
        </div>

        {isLoading ? (
          <div className="flex h-56 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Loading report analytics...
          </div>
        ) : (
          <>
            <div className="no-print mt-4">
              <ReportsDailySummaryTable recentDailyRows={recentDailyRows} />
            </div>

            <PrintableReportSection
              activeRangeLabel={activeRange.label}
              generatedAtLabel={lastUpdatedLabel}
              summary={summary}
              genderBreakdown={genderBreakdown}
              ageBreakdown={ageBreakdown}
              studentList={studentList}
              studentListPagination={studentListPagination}
              studentPage={studentPage}
              setStudentPage={setStudentPage}
              studentPageSize={studentPageSize}
              setStudentPageSize={setStudentPageSize}
              recentDailyRows={recentDailyRows}
            />
          </>
        )}
      </div>
    </Layout>
  );
}
