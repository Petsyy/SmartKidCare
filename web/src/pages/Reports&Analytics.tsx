import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useReportAnalytics } from "@/features/reports/hooks/useReportAnalytics";
import { ReportsFilters } from "@/features/reports/components/ReportsFilters";
import { ReportsOverview } from "@/features/reports/components/ReportsOverview";
import { CompetencyAnalytics } from "@/features/reports/components/CompetencyAnalytics";
import { NutritionAnalytics } from "@/features/reports/components/NutritionAnalytics";
import { ReportExportMenu } from "@/features/reports/components/ReportExportMenu";
import { PrintableReportSection } from "@/features/reports/components/PrintableReportSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { useNutritionAnalytics } from "@/features/reports/hooks/useNutritionAnalytics";
import { useCompetencyAnalytics } from "@/features/reports/hooks/useCompetencyAnalytics";
import {
  buildCompetencyCsvRows,
  buildNutritionCsvRows,
  formatReportSchoolYear,
} from "@/features/reports/utils/report-csv-builders";

const REPORT_SECTION_IDS = ["overview", "nutrition", "academics"] as const;

export default function ReportAnalytics() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const requestedSection = REPORT_SECTION_IDS.find((id) =>
      location.pathname.endsWith(`/${id}`),
    );

    if (!requestedSection) return;
    window.requestAnimationFrame(() => {
      if (requestedSection !== "overview") {
        document
          .getElementById(requestedSection)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [location.pathname]);

  const {
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

    hasData,
    fetchReportData,
    overviewCsvRows,
  } = useReportAnalytics();

  const nutritionAnalytics = useNutritionAnalytics();
  const competencyAnalytics = useCompetencyAnalytics();
  const generatedAt = new Date().toLocaleString("en-PH");
  const nutritionRows = nutritionAnalytics.data
    ? buildNutritionCsvRows(nutritionAnalytics.data, generatedAt)
    : null;
  const competencyRows = competencyAnalytics.data
    ? buildCompetencyCsvRows(competencyAnalytics.data, generatedAt)
    : null;
  const nutritionHasData = (nutritionAnalytics.data?.totalEvaluated ?? 0) > 0;
  const competencyHasData = (competencyAnalytics.data?.totalStudents ?? 0) > 0;
  const refreshing =
    isFetching ||
    nutritionAnalytics.isFetching ||
    competencyAnalytics.isFetching;

  const refreshAll = () => {
    void Promise.all([
      fetchReportData(),
      nutritionAnalytics.refetch(),
      competencyAnalytics.refetch(),
    ]);
  };

  return (
    <Layout
      activeItem="monitoring/reports"
      breadcrumbs={["Barangay Captain", "Reports & Analytics"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Reports & Analytics"
            subtitle="Attendance, enrollment, competency, and printable student reports."
          />
          <ReportExportMenu
            overviewRows={overviewCsvRows}
            nutritionRows={nutritionHasData ? nutritionRows : null}
            competencyRows={competencyHasData ? competencyRows : null}
            overviewScope={activeRange.startKey && activeRange.endKey
              ? `${activeRange.startKey}-to-${activeRange.endKey}`
              : "all-time"}
            nutritionScope={nutritionAnalytics.data
              ? formatReportSchoolYear(
                  nutritionAnalytics.data.filters.schoolYear,
                  nutritionAnalytics.data.schoolYears,
                )
              : "latest"}
            competencyScope={competencyAnalytics.data
              ? formatReportSchoolYear(
                  competencyAnalytics.data.filters.schoolYear,
                  competencyAnalytics.data.schoolYears,
                )
              : "latest"}
            hasOverviewData={hasData}
            refreshing={refreshing}
            onRefreshAll={refreshAll}
            onPrint={() => window.print()}
          />
        </div>

        <section
          id="overview"
          aria-labelledby="overview-section-title"
          className="scroll-mt-24 space-y-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              1
            </span>
            <div>
              <h2
                id="overview-section-title"
                className="text-xl font-semibold text-gray-900 dark:text-slate-50"
              >
                Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Enrollment and demographic information for the selected date range.
              </p>
            </div>
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
            showDateRangeControls
          />

          {error && <ErrorAlert message={error} />}

          {isLoading ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-36 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          ) : (
            <div className="no-print">
              <ReportsOverview
                genderBreakdown={genderBreakdown}
                ageBreakdown={ageBreakdown}
                studentList={studentList}
                studentListPagination={studentListPagination}
                studentPage={studentPage}
                setStudentPage={setStudentPage}
                studentPageSize={studentPageSize}
                setStudentPageSize={setStudentPageSize}
              />
            </div>
          )}

          <div className="hidden print:block">
            {isLoading ? (
              <Skeleton className="h-56 w-full rounded-xl no-print" />
            ) : (
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
              />
            )}
          </div>
        </section>

        <div className="no-print border-t border-gray-200 dark:border-slate-800" />

        <section
          id="nutrition"
          aria-labelledby="nutrition-section-title"
          className="scroll-mt-8 space-y-4"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              2
            </span>
            <div>
              <h2
                id="nutrition-section-title"
                className="text-xl font-semibold text-gray-900 dark:text-slate-50"
              >
                Health & Nutrition
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Nutritional status and progress grouped by school year.
              </p>
            </div>
          </div>
          <NutritionAnalytics showActions={false} />
        </section>

        <div className="no-print border-t border-gray-200 dark:border-slate-800" />

        <section
          id="academics"
          aria-labelledby="academics-section-title"
          className="scroll-mt-8 space-y-4"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              3
            </span>
            <div>
              <h2
                id="academics-section-title"
                className="text-xl font-semibold text-gray-900 dark:text-slate-50"
              >
                Academic Competency
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Submitted competency results grouped by school year and period.
              </p>
            </div>
          </div>
          <CompetencyAnalytics showActions={false} />
        </section>
      </div>
    </Layout>
  );
}
