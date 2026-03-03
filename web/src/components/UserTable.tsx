import { Eye, Pencil, Users, MoreVertical } from "lucide-react";
import { type User } from "@/api/authentication.api";

interface Child {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId: string;
}

interface UserTableProps {
  activeTab: "teacher" | "parent";
  isLoading: boolean;
  users: User[];
  filteredUsers: User[];
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onViewChildren: (parentId: string, parentName: string) => void;
  onMenuClick: (user: User, buttonEl: HTMLButtonElement) => void;
  openMenuUserId: string | null;
  parentChildren?: Record<string, Child[]>;
}

export function UserTable({
  activeTab,
  isLoading,
  users,
  filteredUsers,
  onViewUser,
  onEditUser,
  onViewChildren,
  onMenuClick,
  openMenuUserId,
  parentChildren = {},
}: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900">
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
              Email
            </th>
            {activeTab === "parent" && (
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                Linked Child
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
          {isLoading && (
            <tr>
              <td
                colSpan={activeTab === "parent" ? 5 : 4}
                className="px-6 py-10 text-center text-gray-500 dark:text-slate-400"
              >
                Loading users...
              </td>
            </tr>
          )}

          {!isLoading && users.length === 0 && (
            <tr>
              <td
                colSpan={activeTab === "parent" ? 5 : 4}
                className="px-6 py-12 text-center text-gray-500 dark:text-slate-400"
              >
                No {activeTab === "teacher" ? "teachers" : "parents"} found.
              </td>
            </tr>
          )}

          {!isLoading && users.length > 0 && filteredUsers.length === 0 && (
            <tr>
              <td
                colSpan={activeTab === "parent" ? 5 : 4}
                className="px-6 py-12 text-center text-gray-500 dark:text-slate-400"
              >
                No {activeTab === "teacher" ? "teachers" : "parents"} match your
                search.
              </td>
            </tr>
          )}

          {filteredUsers.map((user) => (
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
              {activeTab === "parent" && (
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {parentChildren[user._id] &&
                  parentChildren[user._id].length > 0 ? (
                    <div className="space-y-1">
                      {parentChildren[user._id].map((child) => (
                        <div key={child._id} className="flex flex-col">
                          <span className="font-medium dark:text-slate-100">
                            {child.firstName}{" "}
                            {child.middleName ? child.middleName + " " : ""}
                            {child.lastName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            ID: {child.studentId}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-slate-500">
                      No linked children
                    </span>
                  )}
                </td>
              )}
              <td className="px-6 py-4 text-sm">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    user.isActive !== false
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                  }`}
                >
                  {user.isActive !== false ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => onViewUser(user)}
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
                    onClick={() => onEditUser(user)}
                    className="group inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                    title="Edit"
                  >
                    <Pencil
                      size={14}
                      className="transition-transform duration-200 group-hover:-rotate-6"
                    />
                    Edit
                  </button>
                  {activeTab !== "teacher" && (
                    <button
                      onClick={() => {
                        const parentName = `${user.firstName} ${
                          user.middleName || ""
                        } ${user.lastName}`
                          .replace(/\s+/g, " ")
                          .trim();
                        onViewChildren(user._id, parentName);
                      }}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                      title="View children"
                    >
                      <Users
                        size={14}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                      Children
                    </button>
                  )}
                  <div className="inline-block shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openMenuUserId === user._id) {
                          onMenuClick(
                            user,
                            e.currentTarget as HTMLButtonElement,
                          );
                        } else {
                          onMenuClick(
                            user,
                            e.currentTarget as HTMLButtonElement,
                          );
                        }
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
