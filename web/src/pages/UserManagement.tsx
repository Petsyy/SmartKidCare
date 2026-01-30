import { useState, useEffect } from "react";
import {
  FileText,
} from "lucide-react";
import { getUsers, updateUserStatus, type User } from "../api/api";
import DocumentReviewModal from "../components/DocumentReviewModal";

type UserStatus = "pending" | "approved" | "rejected";

export default function UserManagement() {
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
      const updatedUser = await updateUserStatus({ 
        userId: selectedUser._id, 
        verificationStatus: status 
      });
      
      // Update the local state
      setUsers(prev => 
        prev.map(u => u._id === selectedUser._id ? updatedUser : u)
      );
      
      setIsModalOpen(false);
      setSelectedUser(null);
      alert(`User ${status} successfully!`);
    } catch (err: any) {
      alert(`Failed to update user: ${err.message}`);
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">
          Manage teacher and parent accounts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {(["worker", "parent"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? "bg-white text-blue-600 shadow-sm border-2 border-blue-100"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {tab === "worker" ? "Teacher" : "Parent"} Accounts
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-500">Loading users...</div>
        </div>
      ) : (
        /* Table Card */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "worker" ? "Teacher" : "Parent"} Account Verification
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No {activeTab === "worker" ? "teacher" : "parent"} accounts found.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {user.phone || 'N/A'}
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
                      <div className="flex items-center gap-2">
                        <button 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          onClick={() => handleOpenReview(user)}
                        >
                          <FileText size={16} />
                          Review Documents
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Document Review Modal */}
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
  );
}
