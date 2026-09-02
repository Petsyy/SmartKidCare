import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw } from "lucide-react";
import { getNutritionAnalytics } from "../../../api/nutrition.api";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { StatCard } from "@/components/ui/StatCard";
import { webQueryKeys } from "@/lib/query-keys";

type NutritionAnalyticsProps = {
  centerId?: string;
};

export function NutritionAnalytics({ centerId = "" }: NutritionAnalyticsProps) {
  const [schoolYear, setSchoolYear] = useState("");

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: webQueryKeys.nutritionAnalytics(
      schoolYear || "latest",
      centerId || "all-centers",
    ),
    queryFn: () =>
      getNutritionAnalytics({
        schoolYear: schoolYear || undefined,
        centerId: centerId || undefined,
      }),
  });

  const selectedSchoolYear = schoolYear || data?.filters.schoolYear || "all";
  const hasData = (data?.totalEvaluated ?? 0) > 0;
  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? "Unable to load nutrition analytics."
        : null;

  return (
    <section className="space-y-4" aria-labelledby="nutrition-analytics-title">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2
              id="nutrition-analytics-title"
              className="text-xl font-semibold text-gray-900 dark:text-slate-50"
            >
              Nutritional Progress Analytics
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Tracking students who improved their nutritional status between initial and final assessments.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                School year
              </span>
              <SelectFilter
                value={selectedSchoolYear}
                onChange={setSchoolYear}
                options={[
                  { value: "all", label: "All school years" },
                  ...(data?.schoolYears ?? []).map((value) => ({
                    value,
                    label: value,
                  })),
                ]}
              />
            </label>
            <Button
              onClick={() => void refetch()}
              disabled={isFetching}
              icon={
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
              }
            >
              Refresh
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4">
            <ErrorAlert message={errorMessage} />
          </div>
        )}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-slate-400">
            Loading nutrition analytics...
          </div>
        ) : !hasData ? (
          <div className="mt-5 flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 text-center dark:border-slate-700">
            <p className="font-medium text-gray-700 dark:text-slate-200">
              No completed nutrition assessments found.
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Choose another school year or center, or submit both initial and final assessments.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Evaluated Students"
              value={String(data?.totalEvaluated ?? 0)}
              subtitle={
                selectedSchoolYear === "all"
                  ? "Student-year records with both assessments"
                  : "With initial and final records"
              }
              icon={Activity}
              color="blue"
            />
            <StatCard
              title="Initially Malnourished"
              value={String(data?.initiallyMalnourished ?? 0)}
              subtitle="Underweight or severely underweight"
              icon={Activity}
              color="rose"
            />
            <StatCard
              title="Improved to Normal"
              value={String(data?.improvedToNormal ?? 0)}
              subtitle="Ended year as Normal status"
              icon={Activity}
              color="teal"
            />
            <StatCard
              title="Improvement Rate"
              value={`${(data?.improvementRate ?? 0).toFixed(1)}%`}
              subtitle="Of malnourished students improved"
              icon={Activity}
              color="purple"
            />
          </div>
        )}
      </div>
    </section>
  );
}
