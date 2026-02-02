import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { getUsers, type User } from "../api/authentication.api";
import AddTeacherModal from "../components/modals/AddTeacherModal";
import Layout from "../components/layout/Layout";
import { handleViewUser, showErrorModal, showTeacherCredentialsModal } from "../utils/sweetalert.modal";
import { getParentChildren, toggleUserStatus, resetUserPassword } from "../api/admin.api";
import EditUserModal from "../components/modals/EditUserModal";
import Swal from "sweetalert2";


export default function UserManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"teacher" | "parent">("teacher");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);


  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };


  const handleResetPassword = async (userId: string) => {
    try {
      const res = await resetUserPassword(userId);

      await showTeacherCredentialsModal(res.credentials);
    } catch (err: any) {
      showErrorModal(err.message || "Failed to reset password");
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleUserStatus(userId);
      fetchUsers(); // refresh table
    } catch (err: any) {
      showErrorModal(err.message || "Failed to update account status");
    }
  };

  const handleViewChildren = async (parentId: string) => {
    try {
      const children = await getParentChildren(parentId);

      if (!children.length) {
        Swal.fire({
          title: "Linked Children",
          text: "No children linked to this parent.",
          confirmButtonColor: "#0D9488",
        });
        return;
      }

      Swal.fire({
        title: "Linked Children",
        html: children
          .map(
            (c: any) =>
              `<p>${c.firstName} ${c.lastName} <span style="color:#6b7280">(${c.studentId || "—"})</span></p>`
          )
          .join(""),
        confirmButtonColor: "#0D9488",
      });
    } catch (err: any) {
      showErrorModal(err.message || "Failed to load children");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUsers({ role: activeTab });
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout
      activeItem="users"
      breadcrumbs={["Admin", "User Management"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              User Management
            </h1>
            <p className="text-sm text-gray-500">
              Manage teacher and parent accounts
            </p>
          </div>

          {activeTab === "teacher" && (
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition"
            >
              <Plus size={16} />
              Add Teacher
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("teacher")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "teacher"
              ? "bg-teal-50 text-teal-700 border border-teal-200"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Teachers
          </button>

          <button
            onClick={() => setActiveTab("parent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "parent"
              ? "bg-teal-50 text-teal-700 border border-teal-200"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Parents
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "teacher" ? "Teacher Accounts" : "Parent Accounts"}
            </h2>
          </div>

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
                  {activeTab === "teacher" && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={activeTab === "teacher" ? 5 : 3}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Loading users...
                    </td>
                  </tr>
                )}

                {!isLoading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={activeTab === "teacher" ? 5 : 3}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No {activeTab === "teacher" ? "teachers" : "parents"} found.
                    </td>
                  </tr>
                )}

                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    {activeTab === "teacher" && (
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">
                        {user.employeeId || "—"}
                      </td>
                    )}
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    {activeTab === "teacher" && (
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${(user as any).status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}>
                          {(user as any).status || "Active"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {/* View */}
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-teal-600 hover:underline"
                        >
                          View
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPassword(user._id)}
                          className="text-orange-600 hover:underline"
                        >
                          Reset
                        </button>

                        {/* Activate / Deactivate */}
                        <button
                          onClick={() => handleToggleStatus(user._id)}
                          className="text-gray-600 hover:underline"
                        >
                          {(user as any).isActive === false ? "Activate" : "Deactivate"}
                        </button>

                        {/* Parent-only */}
                        {activeTab !== "teacher" && (
                          <button
                            onClick={() => handleViewChildren(user._id)}
                            className="text-blue-600 hover:underline"
                          >
                            Children
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={fetchUsers}
          onDeleted={fetchUsers}
        />
      )}

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <AddTeacherModal
          onClose={() => setShowAddTeacherModal(false)}
          onCreated={fetchUsers}
        />
      )}
    </Layout>
  );
}

