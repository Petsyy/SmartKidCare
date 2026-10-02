type UserTabsProps = {
  activeTab: "teacher" | "parent";
  onTabChange: (tab: "teacher" | "parent") => void;
};

export function UserTabs({ activeTab, onTabChange }: UserTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex">
      <button
        onClick={() => onTabChange("teacher")}
        className={`min-h-11 px-3 py-2 rounded-lg text-sm font-medium transition sm:px-4 ${
          activeTab === "teacher"
            ? "border border-teal-200 bg-teal-50 text-teal-700 shadow-sm hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/55"
            : "border border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 cursor-pointer"
        }`}
      >
        Teacher Accounts
      </button>

      <button
        onClick={() => onTabChange("parent")}
        className={`min-h-11 px-3 py-2 rounded-lg text-sm font-medium transition sm:px-4 ${
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
