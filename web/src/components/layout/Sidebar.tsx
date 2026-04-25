import {
  LayoutDashboard,
  Calendar,
  Utensils,
  BarChart3,
  Settings,
  Shield,
  ClipboardList,
  Building2,
  Baby,
  UserCog,
} from "lucide-react";

type NavItem = {
  icon: React.ElementType;
  label: string;
  path: string;
};

type NavGroup = {
  groupName: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    groupName: "MAIN",
    items: [{ icon: LayoutDashboard, label: "Dashboard", path: "dashboard" }],
  },
  {
    groupName: "OPERATIONS",
    items: [
      { icon: Building2, label: "Centers", path: "centers" },
      { icon: Baby, label: "Children Records", path: "children" },
      {
        icon: ClipboardList,
        label: "Enrollment Requests",
        path: "enrollment-requests",
      },
    ],
  },
  {
    groupName: "MONITORING",
    items: [
      { icon: Calendar, label: "Attendance Tracking", path: "attendance" },
      { icon: Utensils, label: "Feeding Program", path: "feeding" },
    ],
  },
  {
    groupName: "MANAGEMENT",
    items: [{ icon: UserCog, label: "User Management", path: "users" }],
  },
  {
    groupName: "INSIGHTS",
    items: [{ icon: BarChart3, label: "Reports & Analytics", path: "reports" }],
  },
];

const systemItem: NavItem = { icon: Settings, label: "Settings", path: "settings" };

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
      <nav className="flex-1 space-y-6 px-3 py-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navGroups.map((group) => (
          <div key={group.groupName} className="space-y-1">
            <h3 className="px-4 text-[10px] font-bold tracking-wider text-teal-300/70 dark:text-slate-400/70 mb-2">
              {group.groupName}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate?.(item.path)}
                  className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer group ${
                    isActive
                      ? "bg-white/10 text-white font-medium dark:bg-slate-800"
                      : "text-teal-100/80 hover:bg-white/5 hover:text-white dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 rounded-r-full bg-cyan-300 dark:bg-cyan-500" />
                  )}
                  <Icon
                    size={20}
                    className={`transition-colors ${
                      isActive
                        ? "text-cyan-300 dark:text-cyan-400"
                        : "group-hover:text-cyan-200 dark:group-hover:text-cyan-400"
                    }`}
                  />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* System & Bottom Section */}
      <div className="p-4 border-t border-teal-500/30 dark:border-slate-700/50">
        <button
          onClick={() => onNavigate?.(systemItem.path)}
          className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer group ${
            activeItem === systemItem.path
              ? "bg-white/10 text-white font-medium dark:bg-slate-800"
              : "text-teal-100/80 hover:bg-white/5 hover:text-white dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
          }`}
        >
          {activeItem === systemItem.path && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 rounded-r-full bg-cyan-300 dark:bg-cyan-500" />
          )}
          <systemItem.icon
            size={20}
            className={`transition-colors ${
              activeItem === systemItem.path
                ? "text-cyan-300 dark:text-cyan-400"
                : "group-hover:text-cyan-200 dark:group-hover:text-cyan-400"
            }`}
          />
          <span className="text-sm">{systemItem.label}</span>
        </button>
      </div>
    </aside>
  );
}
