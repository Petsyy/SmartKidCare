import type { SettingsSection, SettingsSectionId } from "../types";

export interface SettingsNavSidebarProps {
  sections: SettingsSection[];
  activeSection: SettingsSectionId;
  onSelectSection: (id: SettingsSectionId) => void;
  sectionStatus: Record<SettingsSectionId, string>;
}

export function SettingsNavSidebar({
  sections,
  activeSection,
  onSelectSection,
  sectionStatus,
}: SettingsNavSidebarProps) {
  return (
    <aside className="rounded-3xl border border-slate-200/60 bg-white/60 p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] backdrop-blur-xl dark:border-white/5 dark:bg-[#0A101D]/80 xl:sticky xl:top-28">
      <p className="px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
        Settings Menu
      </p>
      <div className="mt-4 space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeSection;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
              className={`group relative cursor-pointer w-full rounded-2xl border p-3.5 text-left transition-all duration-300 ease-out ${
                isActive
                  ? "border-slate-200/80 bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-slate-800/80"
                  : "border-transparent bg-transparent hover:border-slate-200/60 hover:bg-slate-50/50 hover:shadow-sm dark:hover:border-slate-700/50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={`rounded-xl p-2.5 transition-all duration-300 ${
                    isActive
                      ? `${section.iconClassName} shadow-sm scale-110`
                      : "bg-slate-100/80 text-slate-500 ring-1 ring-slate-200/50 group-hover:scale-105 group-hover:bg-white group-hover:shadow-sm dark:bg-slate-800/80 dark:text-slate-400 dark:ring-slate-700/50 dark:group-hover:bg-slate-800"
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                <div className="min-w-0 mt-0.5">
                  <p
                    className={`text-sm tracking-wide ${
                      isActive
                        ? "font-bold text-slate-900 dark:text-slate-100"
                        : "font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                    }`}
                  >
                    {section.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {section.description}
                  </p>
                  <p
                    className={`mt-1.5 text-xs font-semibold ${
                      isActive
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {sectionStatus[section.id]}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
