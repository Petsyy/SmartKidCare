export function LoginHeroBanner() {
  return (
    <aside className="relative hidden bg-linear-to-br from-teal-700 via-teal-600 to-emerald-500 p-10 text-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-800 lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/30 dark:border-cyan-300/20" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-24 w-24 rounded-3xl bg-white/10 dark:bg-cyan-300/10" />
      <div className="relative">
        <h1 className="text-4xl font-black leading-tight">
          Secure access for daily school operations.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-teal-50 dark:text-slate-300">
          Monitor attendance, feeding records, and parent-linked child
          profiles from one admin workspace.
        </p>
      </div>
    </aside>
  );
}
