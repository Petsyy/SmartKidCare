type UserTabsProps = {
  activeTab: "teacher" | "parent";
  onTabChange: (tab: "teacher" | "parent") => void;
};

export function UserTabs({ activeTab, onTabChange }: UserTabsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onTabChange("teacher")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
          activeTab === "teacher"
            ? "border border-teal-200 bg-teal-50 text-teal-700 shadow-sm hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/55"
            : "border border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 cursor-pointer"
        }`}
      >
        Teacher Accounts
      </button>

      <button
        onClick={() => onTabChange("parent")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
          activeTab === "parent"
            ? "border border-teal-200 bg-teal-50 text-teal-700 shadow-sm hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/55"
            : "border border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 cursor-pointer"
        }`}
      >
        Parent Accounts
      </button>
    </div>
  );
}
