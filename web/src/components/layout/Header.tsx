import { Search, Bell, ChevronRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/api/config";
import { useAuthSession } from "../auth/useAuthSession";
import { webQueryKeys } from "@/lib/query-keys";

type HeaderProps = {
  breadcrumbs?: string[];
};

export default function Header({
  breadcrumbs = ["Admin", "User Management"],
}: HeaderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const adminEmail = user?.email || "admin@smartkidcare.com";

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout network errors and still clear local UI state.
    }

    await queryClient.invalidateQueries({ queryKey: webQueryKeys.authSession() });
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
    <header className="border-b border-gray-200 bg-white px-8 py-4 transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={16} />}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-medium text-gray-900 dark:text-slate-100"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Notification Bell */}
          <button className="relative rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-slate-800">
            <Bell size={20} className="text-gray-600 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
              3
            </span>
          </button>

          {/* User Profile with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-cyan-500 ring-1 ring-teal-400/40 dark:from-slate-700 dark:to-slate-600 dark:ring-slate-500/60">
                <span className="text-sm font-semibold text-white dark:text-slate-100">
                  {getInitials(adminEmail)}
                </span>
              </div>
              <div className="text-sm text-left">
                <div className="font-semibold text-gray-900 dark:text-slate-100">
                  Admin
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {adminEmail}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
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
