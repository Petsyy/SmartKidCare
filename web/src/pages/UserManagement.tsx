import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, KeyRound, Power, Users, MoreVertical, Search, Baby } from "lucide-react";
import { getUsers, type User } from "../api/authentication.api";
import AddTeacherModal from "../components/modals/AddTeacherModal";
import AddChildForParentModal from "../components/modals/AddChildForParentModal";
import Layout from "../components/layout/Layout";
import { handleViewUser, showErrorModal, showResetPasswordModal, showToggleUserStatusModal, showToggleUserStatusSuccessModal, showLinkedChildrenModal } from "../utils/sweetalert.modal";
import { getParentChildren, toggleUserStatus, resetUserPassword } from "../api/admin.api";
import { createChild } from "../api/child.api";
import EditUserModal from "../components/modals/EditUserModal";

interface Child {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"teacher" | "parent">("teacher");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [selectedParentForChild, setSelectedParentForChild] = useState<User | null>(null);
  const [parentChildren, setParentChildren] = useState<Record<string, Child[]>>({});

  const openMenu = (user: User, buttonEl: HTMLButtonElement) => {
    setMenuUser(user);
    setOpenMenuUserId(user._id);
    setMenuAnchorRect(buttonEl.getBoundingClientRect());
  };

  const closeMenu = () => {
    setOpenMenuUserId(null);
    setMenuAnchorRect(null);
    setMenuUser(null);
  };

  useEffect(() => {
    const handleClickOutside = () => closeMenu();
    if (openMenuUserId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuUserId]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await resetUserPassword(userId);

      await showResetPasswordModal(res.credentials);
    } catch (err: any) {
      showErrorModal(err.message || "Failed to reset password");
    }
  };


  const handleToggleStatus = async (user: User) => {
    const userName = `${user.firstName} ${user.middleName} ${user.lastName}`;
    const isActivating = user.isActive === false;
    const confirmed = await showToggleUserStatusModal({ userName, isActivating });
    if (!confirmed) return;
    try {
      await toggleUserStatus(user._id);
      await showToggleUserStatusSuccessModal({ userName, isActivating });
      fetchUsers(); // refresh table
    } catch (err: any) {
      showErrorModal(err.message || "Failed to update account status");
    }
  };

  const handleAddChildForParent = (parent: User) => {
    setSelectedParentForChild(parent);
    setShowAddChildModal(true);
  };

  const handleSaveChildForParent = async (data: { parent: { firstName: string; middleName?: string; lastName: string; email: string } } & {
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    age: string;
    gender: string;
    enrollmentDate: string;
    schoolYear: string;
    status: string;
  }) => {
    try {
      const p = data.parent;
      await createChild({
        firstName: data.firstName,
        middleName: data.middleName || undefined,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        age: data.age,
        gender: data.gender,
        enrollmentDate: data.enrollmentDate,
        schoolYear: data.schoolYear,
        status: data.status,
        parentFirstName: p.firstName,
        parentLastName: p.lastName,
        parentMiddleName: p.middleName || undefined,
        parentEmail: p.email,
      });
      setShowAddChildModal(false);
      setSelectedParentForChild(null);
      fetchUsers(); // Refresh to update the linked children
    } catch (err: any) {
      showErrorModal(err.message || "Failed to add child");
      throw err;
    }
  };

  const handleViewChildren = async (parentId: string, parentName: string) => {
    try {
      const children = await getParentChildren(parentId);
      showLinkedChildrenModal(children, parentName);
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
      
      // Fetch children for each parent if activeTab is parent
      if (activeTab === "parent" && data.length > 0) {
        const childrenData: Record<string, Child[]> = {};
        await Promise.all(
          data.map(async (parent) => {
            try {
              const children = await getParentChildren(parent._id);
              childrenData[parent._id] = children;
            } catch (err) {
              childrenData[parent._id] = [];
            }
          })
        );
        setParentChildren(childrenData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${user.firstName} ${user.middleName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const employeeId = (user.employeeId || "").toLowerCase();
    const phone = (user.phone || "").toLowerCase();
    return fullName.includes(q) || email.includes(q) || employeeId.includes(q) || phone.includes(q);
  });

  return (
    <Layout
      activeItem="users"
      breadcrumbs={["Admin", "User Management"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            User Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage teacher and parent accounts
          </p>
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
            Teacher Accounts
          </button>

          <button
            onClick={() => setActiveTab("parent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "parent"
              ? "bg-teal-50 text-teal-700 border border-teal-200"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Parent Accounts
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "teacher" ? "Teacher Accounts" : "Parent Accounts"}
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "teacher" ? "teachers" : "parents"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full sm:w-56 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              {activeTab === "teacher" && (
                <button
                  onClick={() => setShowAddTeacherModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition shrink-0"
                >
                  <Plus size={16} />
                  Add Teacher
                </button>
              )}
            </div>
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
                      Phone
                    </th>
                  )}
                  {activeTab === "parent" && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Phone
                    </th>
                  )}
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
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Loading users...
                    </td>
                  </tr>
                )}

                {!isLoading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No {activeTab === "teacher" ? "teachers" : "parents"} found.
                    </td>
                  </tr>
                )}

                {!isLoading && users.length > 0 && filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    {activeTab === "teacher" && (
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.phone || "—"}
                      </td>
                    )}
                    {activeTab === "parent" && (
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.phone || "—"}
                      </td>
                    )}
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
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${user.isActive !== false
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                        }`}>
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-md hover:bg-teal-100 transition"
                          title="View"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition"
                          title="Edit"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        {activeTab === "parent" && (
                          <button
                            onClick={() => {
                              const parentName = `${user.firstName} ${user.middleName || ''} ${user.lastName}`.replace(/\s+/g, ' ').trim();
                              handleViewChildren(user._id, parentName);
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
                                closeMenu();
                              } else {
                                openMenu(user, e.currentTarget);
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

      {openMenuUserId && menuUser && menuAnchorRect &&
        createPortal(
          <div
            className="fixed py-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            style={{
              top: menuAnchorRect.bottom + 4,
              left: menuAnchorRect.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeTab === "parent" && (
              <button
                onClick={() => {
                  closeMenu();
                  handleAddChildForParent(menuUser);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-teal-700 hover:bg-teal-50 transition"
              >
                <Baby size={14} />
                Add Child
              </button>
            )}
            <button
              onClick={() => {
                closeMenu();
                handleResetPassword(menuUser._id);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 transition"
            >
              <KeyRound size={14} />
              Reset password
            </button>
            <button
              onClick={() => {
                closeMenu();
                handleToggleStatus(menuUser);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Power size={14} />
              {menuUser.isActive === false ? "Activate" : "Deactivate"}
            </button>
          </div>,
          document.body
        )}

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <AddTeacherModal
          onClose={() => setShowAddTeacherModal(false)}
          onCreated={fetchUsers}
        />
      )}

      {/* Add Child for Existing Parent Modal */}
      {showAddChildModal && selectedParentForChild && (
        <AddChildForParentModal
          isOpen={showAddChildModal}
          parent={{
            firstName: selectedParentForChild.firstName,
            middleName: selectedParentForChild.middleName,
            lastName: selectedParentForChild.lastName,
            email: selectedParentForChild.email,
          }}
          onClose={() => {
            setShowAddChildModal(false);
            setSelectedParentForChild(null);
          }}
          onSave={handleSaveChildForParent}
        />
      )}
    </Layout>
  );
}

