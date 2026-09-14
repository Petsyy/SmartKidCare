import {
  LayoutDashboard,
  Utensils,
  BarChart3,
  Settings,
  Building2,
  UsersRound,
  UserCog,
} from "lucide-react";
import { useSystemSettings } from "../../context/SystemSettingsContext";

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
      { icon: UsersRound, label: "Children Records", path: "children" },
    ],
  },
  {
    groupName: "MONITORING",
    items: [
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
  const { settings, loading } = useSystemSettings();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-[#0A101D] text-slate-400 transition-colors dark:bg-[#060913] border-r border-white/5 shadow-2xl z-50 font-sans">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Logo Section */}
      <div className="relative z-10 p-6 pt-8 pb-5 bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_0_20px_rgba(45,212,191,0.25)] overflow-hidden p-1">
            <img src="/smartkidcare1.png" alt="Logo" className="h-full w-full object-contain drop-shadow-sm" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
              {loading ? "Loading..." : settings?.schoolName || "Smart KidCare"}
            </h1>
            <p className="text-[10px] font-bold text-teal-400/80 uppercase tracking-widest mt-1">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="relative z-10 flex-1 space-y-7 px-4 py-6 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 transition-all">
        {navGroups.map((group) => (
          <div key={group.groupName} className="space-y-2">
            <h3 className="px-3 text-[10px] font-bold tracking-[0.15em] text-slate-500 mb-2">
              {group.groupName}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate?.(item.path)}
                    className={`relative w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out cursor-pointer group ${
                      isActive
                        ? "bg-teal-500/10 text-teal-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.6)]" />
                    )}
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-all duration-300 ${
                        isActive
                          ? "text-teal-400 scale-110"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    />
                    <span className={`text-sm tracking-wide ${isActive ? "font-semibold text-teal-50" : "font-medium"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System & Bottom Section */}
      <div className="relative z-10 p-4 border-t border-white/5 bg-black/10 backdrop-blur-md">
        <button
          onClick={() => onNavigate?.(systemItem.path)}
          className={`relative w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer group ${
            activeItem === systemItem.path
              ? "bg-teal-500/10 text-teal-300"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:-translate-y-0.5"
          }`}
        >
          {activeItem === systemItem.path && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.6)]" />
          )}
          <systemItem.icon
            size={18}
            strokeWidth={activeItem === systemItem.path ? 2.5 : 2}
            className={`transition-all duration-300 ${
              activeItem === systemItem.path
                ? "text-teal-400 scale-110"
                : "text-slate-500 group-hover:text-slate-300 group-hover:rotate-90"
            }`}
          />
          <span className={`text-sm tracking-wide ${activeItem === systemItem.path ? "font-semibold text-teal-50" : "font-medium"}`}>
            {systemItem.label}
          </span>
        </button>
      </div>
    </aside>
  );
}
