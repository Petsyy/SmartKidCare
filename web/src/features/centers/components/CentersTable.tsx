import { Eye, Edit2 } from "lucide-react";
import { type DaycareCenter } from "@/api/daycare-center.api";
import { formatLastActivity } from "../utils/date.utils";

type CentersTableProps = {
  centers: DaycareCenter[];
  isLoading: boolean;
  onEdit: (center: DaycareCenter) => void;
};

export function CentersTable({
  centers,
  isLoading,
  onEdit,
}: CentersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="border-b bg-gray-50 dark:border-slate-700 dark:bg-slate-900">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Center
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Assigned CDW
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Children
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Status
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {isLoading ? (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
              >
                Loading centers...
              </td>
            </tr>
          ) : centers.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
              >
                No centers match your search.
              </td>
            </tr>
          ) : (
            centers.map((center) => (
              <tr
                key={center._id}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      {center.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {center.barangay}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {center.assignedCDW || "Unassigned"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {center.childrenCount || 0}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      center.isActive !== false
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${center.isActive !== false ? "bg-green-600 dark:bg-green-400" : "bg-red-600 dark:bg-red-400"}`}></span>
                    {center.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-1.5">
                    <button
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40 cursor-pointer"
                      title="View"
                    >
                      <Eye
                        size={14}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                      View
                    </button>
                    <button
                      onClick={() => onEdit(center)}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 cursor-pointer"
                      title="Edit"
                    >
                      <Edit2
                        size={14}
                        className="transition-transform duration-200 group-hover:-rotate-6"
                      />
                      Edit
                    </button>
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
