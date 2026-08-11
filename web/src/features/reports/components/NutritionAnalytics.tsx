import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getNutritionAnalytics } from "../../../api/nutrition.api";
import { StatCard } from "@/components/ui/StatCard";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { useState } from "react";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

export function NutritionAnalytics() {
  const [schoolYear, setSchoolYear] = useState<string>("2024-2025");

  const { data, isLoading, error } = useQuery({
    queryKey: ["nutrition-analytics", schoolYear],
    queryFn: () => getNutritionAnalytics(schoolYear),
    enabled: !!schoolYear,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
              Nutritional Progress Analytics
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Tracking students who improved their nutritional status over the school year.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <label className="space-y-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                School year
              </span>
              <SelectFilter
                value={schoolYear}
                onChange={setSchoolYear}
                options={[
                  { value: "2023-2024", label: "2023-2024" },
                  { value: "2024-2025", label: "2024-2025" },
                ]}
              />
            </label>
          </div>
        </div>

        {error && <div className="mt-4"><ErrorAlert message={error.message} /></div>}

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-500">Loading nutrition analytics...</div>
        ) : data ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard 
              title="Evaluated Students" 
              value={String(data.totalEvaluated)} 
              subtitle="With initial and final records" 
              icon={Activity} 
              color="blue" 
            />
            <StatCard 
              title="Initially Malnourished" 
              value={String(data.initiallyMalnourished)} 
              subtitle="Underweight or severely underweight" 
              icon={Activity} 
              color="rose" 
            />
            <StatCard 
              title="Improved to Normal" 
              value={String(data.improvedToNormal)} 
              subtitle="Ended year as Normal status" 
              icon={Activity} 
              color="teal" 
            />
            <StatCard 
              title="Improvement Rate" 
              value={`${data.improvementRate.toFixed(1)}%`} 
              subtitle="Of malnourished students improved" 
              icon={Activity} 
              color="purple" 
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
