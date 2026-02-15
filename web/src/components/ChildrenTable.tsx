import { Copy, Eye, Pencil, MoreVertical } from "lucide-react";
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
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Student ID
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Child Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Age
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Gender
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              School Year
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Link Code
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                Loading students...
              </td>
            </tr>
          ) : children.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                No children records found.
              </td>
            </tr>
          ) : filteredChildren.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                No students match your search.
              </td>
            </tr>
          ) : (
            filteredChildren.map((child) => (
              <tr key={child._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-gray-900">
                  {child.studentId}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {child.lastName}, {child.firstName} {child.middleName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{child.age}</td>
                <td className="px-6 py-4 text-sm capitalize text-gray-700">
                  {child.gender}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{child.schoolYear}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      child.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : child.status === "Inactive"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {child.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {child.childLinkCode ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-900">
                        {child.childLinkCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(child.childLinkCode ?? "");
                        }}
                        className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                        title="Copy link code"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => onViewChild(child)}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      title="View"
                    >
                      <Eye size={14} className="transition-transform duration-200 group-hover:scale-110" />
                      View
                    </button>
                    <button
                      onClick={() => onEditChild(child)}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      title="Edit"
                    >
                      <Pencil size={14} className="transition-transform duration-200 group-hover:-rotate-6" />
                      Edit
                    </button>
                    <div className="inline-block shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenuClick(child, e.currentTarget as HTMLButtonElement);
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400/30"
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
