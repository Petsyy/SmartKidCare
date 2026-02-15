import { Search, Bell, ChevronRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_BASE } from "../config/config.api";

type HeaderProps = {
  breadcrumbs?: string[];
};

export default function Header({
  breadcrumbs = ["Admin", "User Management"],
}: HeaderProps) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const adminEmail =
    localStorage.getItem("adminEmail") || "admin@smartkidcare.com";

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout network errors and still clear local UI state.
    }

    localStorage.removeItem("authToken");
    localStorage.removeItem("adminEmail");
    navigate("/login");
  };

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part[0].toUpperCase())
      .join("");
  };
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={16} />}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "text-gray-900 font-medium"
                    : ""
                }
              >
                {crumb}
              </span>
            </div>
          ))}
        </div>

        {/* Right: Search, Notifications, and Profile */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Notification Bell */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
              3
            </span>
          </button>

          {/* User Profile with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-2 py-1 transition"
            >
              <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {getInitials(adminEmail)}
                </span>
              </div>
              <div className="text-sm text-left">
                <div className="font-semibold text-gray-900">Admin</div>
                <div className="text-gray-500 text-xs">{adminEmail}</div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition text-sm font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
