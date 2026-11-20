import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export function SettingsLoadingSkeleton() {
  return (
    <div className="grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)] items-start">
      <aside className="rounded-3xl border border-slate-200/60 bg-white/60 p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] backdrop-blur-xl dark:border-white/5 dark:bg-[#0A101D]/80 xl:sticky xl:top-28">
        <Skeleton className="mb-4 h-4 w-24 ml-2" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 rounded-2xl border border-transparent p-3.5"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <SkeletonText lines={2} className="w-full mt-1" />
            </div>
          ))}
        </div>
      </aside>
      <section className="rounded-3xl border border-slate-200/60 bg-white p-4 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] dark:border-white/5 dark:bg-[#0A101D]/90 sm:p-6 lg:p-8">
        <div className="mb-8 flex items-start gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <SkeletonText lines={2} className="w-48 mt-1" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
