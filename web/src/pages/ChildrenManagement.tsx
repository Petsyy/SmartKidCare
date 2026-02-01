import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, } from "lucide-react";
import Swal from "sweetalert2";
import Layout from "../components/Layout";
import AddChildModal, { type ChildFormData } from "../components/AddChildModal";

export type Child = {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  age: string;
  studentId: string;
  schoolYear: string;
  status: string;
  enrollmentDate: string;
  childLinkCode?: string;
};


export default function ChildrenManagement() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/children", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("API error:", data.message);
          setChildren([]);
          return;
        }

        setChildren(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch children:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          url: "http://192.168.100.15:5000/api/children"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchChildren();
  }, []);

  const handleSaveChild = async (childData: ChildFormData) => {
    try {
      const res = await fetch("http://localhost:5000/api/children", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(childData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save child");
      }

      const responseData = await res.json();
      const { child, parentCredentials } = responseData;

      setChildren((prev) => [...prev, child]);

      // Show parent credentials with SweetAlert
      if (parentCredentials) {
        Swal.fire({
          title: "Parent Account Created",
          html: `<div style="text-align: left; padding: 20px;">
            <p><strong>Email:</strong> ${parentCredentials.email}</p>
            <p><strong>Password:</strong> ${parentCredentials.password}</p>
            <p style="color: #666; margin-top: 15px; font-size: 14px;">Share these credentials with the parent so they can log in to the mobile app.</p>
          </div>`,
          icon: "success",
          confirmButtonText: "Done",
          confirmButtonColor: "#0D9488",
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save child:", error);
    }
  };

  const enrolledCount = children.length;

  return (
    <Layout
      activeItem="children"
      breadcrumbs={["Admin", "Children Records"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="p-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Children Records
          </h1>
          <p className="text-sm text-gray-500">
            View and manage student information
          </p>
        </div>

        {/* Student Directory Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Student Directory
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                {enrolledCount} Enrolled
              </span>
            </div>

            <div className="flex gap-3">
              {/* Search */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Add Child */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                <Plus size={16} />
                Add Child
              </button>
            </div>
          </div>

          {/* Table */}
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
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      Loading students...
                    </td>
                  </tr>
                ) : children.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No children records found.
                    </td>
                  </tr>
                ) : (
                  children.map((child, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">
                        {child.studentId}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {child.lastName}, {child.firstName} {child.middleName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {child.age}
                      </td>
                      <td className="px-6 py-4 text-sm capitalize text-gray-700">
                        {child.gender}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {child.schoolYear}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {child.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-800">
                        {child.childLinkCode}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>

        </div>
      </div>

      <AddChildModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChild}
      />

    </Layout>
  );
}
