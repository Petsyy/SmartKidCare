import { Search, Bell, ChevronRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const adminEmail = user?.email || "admin@smartkidcare.com";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <header className="sticky top-0 z-40 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl px-8 py-4 transition-colors dark:border-white/5 dark:bg-[#060913]/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium dark:text-slate-400">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={16} className="text-gray-400 dark:text-slate-600" />}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-semibold text-gray-900 dark:text-slate-200 tracking-wide"
                    : "transition-colors hover:text-teal-600 dark:hover:text-teal-400 cursor-default"
                }
              >
                {crumb}
              </span>
            </div>
          ))}
        </div>

        {/* Right: Search, Notifications, and Profile */}
        <div className="flex items-center gap-5">
          {/* Search Bar */}
          <div className="relative group">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-teal-500 dark:text-slate-500 dark:group-focus-within:text-teal-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-72 rounded-full border border-gray-200/80 bg-gray-50/50 py-2.5 pl-11 pr-4 text-sm text-gray-900 shadow-sm transition-all duration-300 ease-out placeholder:text-gray-400 focus:w-80 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 dark:border-white/5 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500/50 dark:focus:bg-[#0A101D] dark:focus:ring-teal-500/20"
            />
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />

          {/* Notification Bell */}
          <button className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-600 transition-all hover:bg-teal-50 hover:text-teal-600 hover:shadow-sm dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-teal-400">
            <Bell size={20} className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 border-[1.5px] border-white dark:border-[#060913]"></span>
            </span>
          </button>

          {/* User Profile with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4 transition-all hover:bg-gray-50 active:scale-95 dark:hover:bg-white/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 shadow-[0_0_10px_rgba(45,212,191,0.3)] ring-2 ring-white dark:ring-[#060913]">
                <span className="text-sm font-bold text-white tracking-wider">
                  {getInitials(adminEmail)}
                </span>
              </div>
              <div className="text-sm text-left hidden sm:block">
                <div className="font-semibold text-gray-900 dark:text-slate-200">
                  Admin User
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {adminEmail}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            <div
              className={`absolute right-0 top-[110%] z-50 mt-1 w-56 origin-top-right rounded-2xl border border-gray-100 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl transition-all duration-200 dark:border-white/10 dark:bg-[#0A101D]/95 ${
                showDropdown ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
