import { Eye, Pencil, Users, MoreVertical } from "lucide-react";
import { type User } from "../api/authentication.api";

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
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {activeTab === "teacher" && (
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Employee ID
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Email
            </th>
            {activeTab === "parent" && (
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Linked Child
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading && (
            <tr>
              <td
                colSpan={activeTab === "teacher" ? 5 : 5}
                className="px-6 py-10 text-center text-gray-500"
              >
                Loading users...
              </td>
            </tr>
          )}

          {!isLoading && users.length === 0 && (
            <tr>
              <td
                colSpan={activeTab === "teacher" ? 5 : 5}
                className="px-6 py-12 text-center text-gray-500"
              >
                No {activeTab === "teacher" ? "teachers" : "parents"} found.
              </td>
            </tr>
          )}

          {!isLoading && users.length > 0 && filteredUsers.length === 0 && (
            <tr>
              <td
                colSpan={activeTab === "teacher" ? 5 : 5}
                className="px-6 py-12 text-center text-gray-500"
              >
                No {activeTab === "teacher" ? "teachers" : "parents"} match your search.
              </td>
            </tr>
          )}

          {filteredUsers.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50">
              {activeTab === "teacher" && (
                <td className="px-6 py-4 font-mono text-sm text-gray-900">
                  {user.employeeId || "—"}
                </td>
              )}
              <td className="px-6 py-4 font-medium text-gray-900">
                {user.lastName}, {user.firstName} {user.middleName}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
              {activeTab === "parent" && (
                <td className="px-6 py-4 text-sm text-gray-700">
                  {parentChildren[user._id] && parentChildren[user._id].length > 0 ? (
                    <div className="space-y-1">
                      {parentChildren[user._id].map((child) => (
                        <div key={child._id} className="flex flex-col">
                          <span className="font-medium">
                            {child.firstName} {child.middleName ? child.middleName + " " : ""}{child.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            ID: {child.studentId}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">No linked children</span>
                  )}
                </td>
              )}
              <td className="px-6 py-4 text-sm">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    user.isActive !== false
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.isActive !== false ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => onViewUser(user)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-md hover:bg-teal-100 transition"
                    title="View"
                  >
                    <Eye size={14} />
                    View
                  </button>
                  <button
                    onClick={() => onEditUser(user)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition"
                    title="Edit"
                  >
                    <Pencil size={14} />
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
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 transition"
                      title="View children"
                    >
                      <Users size={14} />
                      Children
                    </button>
                  )}
                  <div className="inline-block shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openMenuUserId === user._id) {
                          onMenuClick(user, e.currentTarget as HTMLButtonElement);
                        } else {
                          onMenuClick(user, e.currentTarget as HTMLButtonElement);
                        }
                      }}
                      className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
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
