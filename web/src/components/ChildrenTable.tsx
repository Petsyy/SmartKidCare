import { Eye, Pencil, MoreVertical } from "lucide-react";
import { type Child } from "../pages/ChildrenManagement";

interface ChildrenTableProps {
  isLoading: boolean;
  children: Child[];
  filteredChildren: Child[];
  onViewChild: (child: Child) => void;
  onEditChild: (child: Child) => void;
  onMenuClick: (child: Child, buttonEl: HTMLButtonElement) => void;
}

export function ChildrenTable({
  isLoading,
  children,
  filteredChildren,
  onViewChild,
  onEditChild,
  onMenuClick,
}: ChildrenTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="border-b bg-gray-50 dark:border-slate-700 dark:bg-slate-900">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Student ID
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Child Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Age
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Gender
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              School Year
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Assigned Teacher
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {isLoading ? (
            <tr>
              <td
                colSpan={8}
                className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
              >
                Loading students...
              </td>
            </tr>
          ) : children.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
              >
                No children records found.
              </td>
            </tr>
          ) : filteredChildren.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
              >
                No students match your search.
              </td>
            </tr>
          ) : (
            filteredChildren.map((child) => (
              <tr
                key={child._id}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
              >
                <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-slate-100">
                  {child.studentId}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">
                  {`${child.lastName}, ${child.firstName}${child.middleName ? ` ${child.middleName}` : ""}`}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {child.age}
                </td>
                <td className="px-6 py-4 text-sm capitalize text-gray-700 dark:text-slate-300">
                  {child.gender}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {child.schoolYear}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      child.status === "Active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                        : child.status === "Inactive"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                    }`}
                  >
                    {child.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {child.teacher
                    ? `${child.teacher.lastName}, ${child.teacher.firstName}${child.teacher.middleName ? ` ${child.teacher.middleName}` : ""}`
                    : "Unassigned"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => onViewChild(child)}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40"
                      title="View"
                    >
                      <Eye
                        size={14}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                      View
                    </button>
                    <button
                      onClick={() => onEditChild(child)}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                      title="Edit"
                    >
                      <Pencil
                        size={14}
                        className="transition-transform duration-200 group-hover:-rotate-6"
                      />
                      Edit
                    </button>
                    <div className="inline-block shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenuClick(
                            child,
                            e.currentTarget as HTMLButtonElement,
                          );
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                        title="More actions"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
