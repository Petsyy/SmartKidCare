import {
  LayoutDashboard,
  Users,
  Calendar,
  Utensils,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react";

type NavItem = {
  icon: React.ElementType;
  label: string;
  path: string;
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "dashboard" },
  { icon: Users, label: "Children Records", path: "children" },
  { icon: Users, label: "User Management", path: "users" },
  { icon: Calendar, label: "Attendance Tracking", path: "attendance" },
  { icon: Utensils, label: "Feeding Program", path: "feeding" },
  { icon: BarChart3, label: "Reports & Analytics", path: "reports" },
  { icon: Settings, label: "Settings", path: "settings" },
];

type SidebarProps = {
  activeItem?: string;
  onNavigate?: (path: string) => void;
};

export default function Sidebar({
  activeItem = "users",
  onNavigate,
}: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col bg-linear-to-b from-teal-600 to-teal-700 text-white transition-colors dark:from-slate-900 dark:to-slate-800">
      {/* Logo Section */}
      <div className="border-b border-teal-500/30 p-6 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 ring-1 ring-cyan-200 dark:bg-cyan-500/20 dark:ring-cyan-500/30">
            <Shield className="text-cyan-700 dark:text-cyan-300" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Smart KidCare</h1>
            <p className="text-xs text-teal-200 dark:text-slate-300">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.path;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate?.(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "bg-white/20 text-white font-medium shadow-sm dark:bg-slate-700/70"
                  : "text-teal-100 hover:bg-white/10 hover:text-white dark:text-slate-300 dark:hover:bg-slate-700/60"
              }`}
            >
              <Icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
