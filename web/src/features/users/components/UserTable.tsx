import { Eye, Pencil, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { User } from "@/api/authentication.api";
import type { ParentLinkedChildItem } from "@/api/admin.api";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

type UserTableProps = {
  activeTab: "teacher" | "parent";
  isLoading: boolean;
  usersLength: number;
  filteredUsersLength: number;
  paginatedUsers: User[];
  openMenuUserId: string | null;
  parentChildrenLoadingByUserId: Record<string, boolean>;
  parentChildrenByUserId: Record<string, ParentLinkedChildItem[]>;
  onOpenMenu: (user: User, element: HTMLButtonElement) => void;
  onCloseMenu: () => void;
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  maskChildName: (child: ParentLinkedChildItem) => string;
  paginationRangeLabel: string;
  safeCurrentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const UserTable = ({
  activeTab,
  isLoading,
  usersLength,
  filteredUsersLength,
  paginatedUsers,
  openMenuUserId,
  parentChildrenLoadingByUserId,
  parentChildrenByUserId,
  onOpenMenu,
  onCloseMenu,
  onViewUser,
  onEditUser,
  maskChildName,
  paginationRangeLabel,
  safeCurrentPage,
  totalPages,
  onPageChange,
}: UserTableProps) => {
  const navigate = useNavigate();
  const tableColumnCount = 6;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                Phone
              </th>
              {activeTab === "parent" && (
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                  Child Name
                </th>
              )}
              {activeTab === "teacher" && (
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                  Assigned Center
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {isLoading && <TableSkeleton columns={tableColumnCount} />}

            {!isLoading && usersLength === 0 && (
              <tr>
                <td
                  colSpan={tableColumnCount}
                  className="px-6 py-12 text-center text-gray-500 dark:text-slate-400"
                >
                  No {activeTab === "teacher" ? "teachers" : "parents"} found.
                </td>
              </tr>
            )}

            {!isLoading && usersLength > 0 && filteredUsersLength === 0 && (
              <tr>
                <td
                  colSpan={tableColumnCount}
                  className="px-6 py-12 text-center text-gray-500 dark:text-slate-400"
                >
                  No {activeTab === "teacher" ? "teachers" : "parents"} match your search.
                </td>
              </tr>
            )}

            {paginatedUsers.map((user) => (
              <tr
                key={user._id}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
              >
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">
                  {user.lastName}, {user.firstName} {user.middleName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                  {user.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {user.phone || "-"}
                </td>
                {activeTab === "parent" && (
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {parentChildrenLoadingByUserId[user._id] ? (
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        Loading...
                      </span>
                    ) : (parentChildrenByUserId[user._id] || []).length === 0 ? (
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        No linked child
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(parentChildrenByUserId[user._id] || []).map((child) => (
                          <button
                            key={`${user._id}-${child._id}-${child.studentId || "no-id"}`}
                            type="button"
                            onClick={() =>
                              navigate(
                                `/children?prefillSearch=${encodeURIComponent(
                                  child.studentId || `${child.lastName} ${child.firstName}`,
                                )}`,
                              )
                            }
                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs text-teal-700 transition hover:border-teal-300 hover:bg-teal-100 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/35"
                            title="Open in Child Table"
                          >
                            <span className="font-mono">
                              {child.studentId || "No ID"}
                            </span>
                            <span>{maskChildName(child)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                )}
                {activeTab === "teacher" && (
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {user.daycareCenter ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-slate-100">
                          {user.daycareCenter.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {user.daycareCenter.barangay}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-slate-500">
                        Unassigned
                      </span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      user.isActive !== false
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        user.isActive !== false ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    {user.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => onViewUser(user)}
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
                      onClick={() => onEditUser(user)}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 cursor-pointer"
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
                          if (openMenuUserId === user._id) {
                            onCloseMenu();
                          } else {
                            onOpenMenu(user, e.currentTarget);
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 cursor-pointer"
                        title="More actions"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Showing {paginationRangeLabel}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1 || filteredUsersLength === 0}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            Previous
          </button>
          <span className="px-2 text-sm text-gray-600 dark:text-slate-300">
            Page {filteredUsersLength === 0 ? 0 : safeCurrentPage} of {filteredUsersLength === 0 ? 0 : totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={filteredUsersLength === 0 || safeCurrentPage >= totalPages}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};
