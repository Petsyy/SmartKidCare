import { useNavigate, Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useReportAnalytics } from "@/features/reports/hooks/useReportAnalytics";
import { ReportsFilters } from "@/features/reports/components/ReportsFilters";
import { ReportsOverview } from "@/features/reports/components/ReportsOverview";
import { CompetencyAnalytics } from "@/features/reports/components/CompetencyAnalytics";
import { NutritionAnalytics } from "@/features/reports/components/NutritionAnalytics";
import { PrintableReportSection } from "@/features/reports/components/PrintableReportSection";
import { Skeleton } from "@/components/ui/Skeleton";

function TabLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
          isActive
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function ReportAnalytics() {
  const navigate = useNavigate();
  const location = useLocation();
  const isNutritionTab = location.pathname.includes("/nutrition");
  const isAcademicsTab = location.pathname.includes("/academics");
  const showDateRangeControls = !isNutritionTab && !isAcademicsTab;
  const scopeDescription = isNutritionTab
    ? "Nutrition progress is grouped by school year and the selected center."
    : "Competency results are grouped by school year, period, and the selected center.";

  const {
    isLoading,
    error,
    centers,
    centerId,
    setCenterId,
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
          centers={centers}
          centerId={centerId}
          setCenterId={setCenterId}
          showDateRangeControls={showDateRangeControls}
          scopeDescription={scopeDescription}
        />

        <div className="no-print flex space-x-2 border-b border-gray-200 pb-4 dark:border-slate-800 overflow-x-auto">
          <TabLink to="/reports/overview">Overview</TabLink>
          <TabLink to="/reports/nutrition">Health & Nutrition</TabLink>
          <TabLink to="/reports/academics">Academic Competency</TabLink>
        </div>

        {error && <ErrorAlert message={error} />}

        <Routes>
          <Route path="/" element={<Navigate to="overview" replace />} />

          <Route
            path="overview"
            element={
              <>

                {isLoading ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 6 }, (_, index) => (
                        <Skeleton key={index} className="h-36 rounded-xl" />
                      ))}
                    </div>
                    <Skeleton className="h-96 w-full rounded-xl" />
                  </div>
                ) : (
                  <div className="no-print mt-4">
                    <ReportsOverview
                      rangeLabel={activeRange.label}
                      summary={summary}
                      genderBreakdown={genderBreakdown}
                      ageBreakdown={ageBreakdown}
                      recentDailyRows={recentDailyRows}
                      studentList={studentList}
                      studentListPagination={studentListPagination}
                      studentPage={studentPage}
                      setStudentPage={setStudentPage}
                      studentPageSize={studentPageSize}
                      setStudentPageSize={setStudentPageSize}
                    />
                  </div>
                )}
              </>
            }
          />

          <Route
            path="nutrition"
            element={
              <div className="no-print">
                <NutritionAnalytics
                  key={centerId || "all-centers"}
                  centerId={centerId}
                />
              </div>
            }
          />

          <Route
            path="academics"
            element={
              <div className="no-print">
                <CompetencyAnalytics centerId={centerId} />
              </div>
            }
          />

          <Route
            path="export"
            element={<Navigate to="/reports/overview" replace />}
          />
        </Routes>

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
              recentDailyRows={recentDailyRows}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
