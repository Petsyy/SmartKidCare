import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
} from "lucide-react";
import { getUsers, updateUserStatus, type User } from "../api/api";
import DocumentReviewModal from "../components/DocumentReviewModal";
import Layout from "../components/Layout";

type UserStatus = "pending" | "approved" | "rejected";

export default function UserManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"worker" | "parent">("worker");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleOpenReview = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (status: UserStatus) => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      await updateUserStatus({ userId: selectedUser._id, verificationStatus: status });
      setIsModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadge = (status: UserStatus) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <Layout
      activeItem="users"
      breadcrumbs={["Admin", "User Management"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="p-8 space-y-6">
        {/* Page Header — MATCHED */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            User Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage teacher and parent accounts
          </p>
        </div>

        {/* Tabs — tightened */}
        <div className="flex gap-2">
          {(["worker", "parent"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab === "worker" ? "Teacher Accounts" : "Parent Accounts"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table Card — MATCHED TO CHILDREN */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Card Header */}
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "worker"
                ? "Teacher Account Verification"
                : "Parent Account Verification"}
            </h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Phone
                  </th>
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
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                )}

                {!isLoading && users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No {activeTab === "worker" ? "teacher" : "parent"} accounts found.
                    </td>
                  </tr>
                )}

                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.phone || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-md text-xs font-medium capitalize ${statusBadge(
                          user.verificationStatus
                        )}`}
                      >
                        {user.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenReview(user)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                      >
                        <FileText size={16} />
                        Review Documents
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <DocumentReviewModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onApprove={() => handleUpdateStatus("approved")}
          onReject={() => handleUpdateStatus("rejected")}
          isLoading={isUpdating}
        />
      </div>
    </Layout>
  );
}

