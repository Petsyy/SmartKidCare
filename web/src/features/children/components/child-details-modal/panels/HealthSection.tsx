import { HeartPulse } from "lucide-react";
import type { Child } from "@/types/child";
import { useChildNutrition } from "../../../hooks/useChildNutrition";
import {
  formatFullName,
  formatMetric,
  getNutritionalStatusColor,
} from "../utils";
import { ContactCard, InfoCard } from "../cards";

interface HealthSectionProps {
  child: Child;
  tabId: string;
}

export function HealthSection({ child, tabId }: HealthSectionProps) {
  const { data: records = [], isLoading } = useChildNutrition(child._id);

  const initialRecord = records.find((r) => r.period === "initial");
  const finalRecord = records.find((r) => r.period === "final");

  return (
    <div
      id="health-panel"
      role="tabpanel"
      aria-labelledby={tabId}
      className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
    >
      <div className="rounded-3xl border border-gray-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="mb-4 flex items-center gap-2">
          <HeartPulse size={18} className="text-teal-600 dark:text-teal-400" />
          <p className="text-base font-bold tracking-[-0.01em] text-gray-900 dark:text-slate-100">
            Health metrics & Nutritional Progress
          </p>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Loading nutrition history...
          </div>
        ) : !initialRecord ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No nutrition records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Initial Record */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="mb-4 text-sm font-semibold text-gray-700 dark:text-slate-300">
                Start of Year (Initial)
              </p>
              <div className="mb-4 grid grid-cols-3 gap-4">
                <InfoCard
                  label="Weight"
                  value={formatMetric(initialRecord.weight, "kg")}
                />
                <InfoCard
                  label="Height"
                  value={formatMetric(initialRecord.height, "cm")}
                />
                <InfoCard label="BMI" value={formatMetric(initialRecord.bmi)} />
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getNutritionalStatusColor(initialRecord.nutritionalStatus)}`}
              >
                {initialRecord.nutritionalStatus}
              </span>
            </div>

            {/* Final Record */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="mb-4 text-sm font-semibold text-gray-700 dark:text-slate-300">
                End of Year (Final)
              </p>
              {finalRecord ? (
                <>
                  <div className="mb-4 grid grid-cols-3 gap-4">
                    <InfoCard
                      label="Weight"
                      value={formatMetric(finalRecord.weight, "kg")}
                    />
                    <InfoCard
                      label="Height"
                      value={formatMetric(finalRecord.height, "cm")}
                    />
                    <InfoCard
                      label="BMI"
                      value={formatMetric(finalRecord.bmi)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getNutritionalStatusColor(finalRecord.nutritionalStatus)}`}
                    >
                      {finalRecord.nutritionalStatus}
                    </span>
                    {finalRecord.weight > initialRecord.weight && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        +
                        {formatMetric(
                          finalRecord.weight - initialRecord.weight,
                          "kg",
                        )}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-29 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
                  Pending final measurement
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ContactCard
          label="Parent"
          name={
            child.parent
              ? formatFullName(
                  child.parent.firstName,
                  child.parent.middleName,
                  child.parent.lastName,
                )
              : "Not linked"
          }
          email={child.parent?.email}
          phone={child.parent?.phone}
          emptyLabel="Not linked"
        />
        <ContactCard
          label="Teacher"
          name={
            child.teacher
              ? formatFullName(
                  child.teacher.firstName,
                  child.teacher.middleName,
                  child.teacher.lastName,
                )
              : "Unassigned"
          }
          email={child.teacher?.email}
          emptyLabel="Unassigned"
        />
      </div>
    </div>
  );
}
