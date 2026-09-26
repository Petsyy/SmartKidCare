import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getNutritionAnalytics } from "../../../api/nutrition.api";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { webQueryKeys } from "@/lib/query-keys";

const STATUS_COLORS: Record<string, string> = {
  "Severely Underweight": "#e11d48",
  Underweight: "#a855f7",
  Normal: "#0d9488",
  Overweight: "#3b82f6",
  Obese: "#f43f5e",
};

const PROGRESS_COLORS: Record<string, string> = {
  "Evaluated Students": "#3b82f6",
  "Initially Malnourished": "#e11d48",
  "Improved to Normal": "#0d9488",
  "Improvement Rate": "#a855f7",
};

export function NutritionAnalytics() {
  const [schoolYear] = useState("");

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: webQueryKeys.nutritionAnalytics(
      schoolYear || "latest",
    ),
    queryFn: () =>
      getNutritionAnalytics({
        schoolYear: schoolYear || undefined,
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

  const progressData = [
    {
      name: "Evaluated Students",
      value: data?.totalEvaluated ?? 0,
    },
    {
      name: "Initially Malnourished",
      value: data?.initiallyMalnourished ?? 0,
    },
    {
      name: "Improved to Normal",
      value: data?.improvedToNormal ?? 0,
    },
  ];

  const improvementRate = data?.improvementRate ?? 0;

  const statusData = [
    {
      name: "Severely Underweight",
      value: data?.severelyUnderweightCount ?? 0,
    },
    {
      name: "Underweight",
      value: data?.underweightCount ?? 0,
    },
    {
      name: "Normal",
      value: data?.normalCount ?? 0,
    },
    {
      name: "Overweight",
      value: data?.overweightCount ?? 0,
    },
    {
      name: "Obese",
      value: data?.obeseCount ?? 0,
    },
  ];

  const displayYear =
    selectedSchoolYear !== "all"
      ? selectedSchoolYear
      : data?.filters.schoolYear ?? "";

  return (
    <section className="space-y-4" aria-labelledby="nutrition-analytics-title">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2
                id="nutrition-analytics-title"
                className="text-xl font-semibold text-gray-900 dark:text-slate-50"
              >
                Nutritional Progress Analytics
              </h2>
              {displayYear && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {displayYear}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Tracking students who improved their nutritional status between initial and final assessments.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
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
              Choose another school year or submit both initial and final assessments for Bonuan Sabangan.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  Progress Overview
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Student evaluation and improvement metrics.
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2" role="img" aria-label="Progress overview chart">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={progressData}
                      barCategoryGap="30%"
                      margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="name"
                        interval={0}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={32}
                      />
                      <Tooltip
                        formatter={(value?: number | string) => [Number(value ?? 0), "Students"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={64}
                      >
                        {progressData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={PROGRESS_COLORS[entry.name] ?? "#6b7280"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-6 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                    Improvement Rate
                  </p>
                  <p className="mt-2 text-5xl font-bold text-purple-600 dark:text-purple-400">
                    {improvementRate.toFixed(1)}%
                  </p>
                  <p className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400">
                    Of malnourished students improved
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6 dark:border-slate-700">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                  Current Status Distribution
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Number of students at each nutritional status level.
                </p>
              </div>
              <div role="img" aria-label="Current nutritional status distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={statusData}
                    barCategoryGap="22%"
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <Tooltip
                      formatter={(value?: number | string) => [Number(value ?? 0), "Students"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={56}
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name] ?? "#6b7280"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
