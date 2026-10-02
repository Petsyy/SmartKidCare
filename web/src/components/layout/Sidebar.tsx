import {
  LayoutDashboard,
  BarChart3,
  Settings,
  X,
  UsersRound,
  UserCog,
  Utensils,
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

const captainNavGroups: NavGroup[] = [
  {
    groupName: "MONITORING",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "monitoring/dashboard" },
      { icon: UsersRound, label: "Daycare Records", path: "monitoring/records" },
      { icon: Utensils, label: "Feeding Monitoring", path: "monitoring/feeding" },
    ],
  },
  {
    groupName: "INSIGHTS",
    items: [
      { icon: BarChart3, label: "Reports & Analytics", path: "monitoring/reports" },
    ],
  },
  {
    groupName: "MANAGEMENT",
    items: [{ icon: UserCog, label: "User Management", path: "monitoring/users" }],
  },
];

type SidebarProps = {
  activeItem?: string;
  onNavigate?: (path: string) => void;
  mobile?: boolean;
  onClose?: () => void;
};

export default function Sidebar({
  activeItem = "users",
  onNavigate,
  mobile = false,
  onClose,
}: SidebarProps) {
  const { settings, loading } = useSystemSettings();
  const navGroups = captainNavGroups;
  const systemItem: NavItem = {
    icon: Settings,
    label: "Profile / Settings",
    path: "monitoring/settings",
  };

  return (
    <aside className={`${mobile ? "absolute z-10" : "fixed z-50"} left-0 top-0 flex h-dvh w-[min(18rem,86vw)] flex-col border-r border-[#0F4C4F] bg-[#082F35] font-sans text-[#A7C0C4] shadow-2xl transition-colors dark:bg-[#06252B] lg:w-64`}>
      {/* Decorative background glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -left-[20%] -top-[20%] h-[40%] w-[140%] rounded-full bg-teal-400/10 blur-[120px]" />
      </div>

      {/* Logo Section */}
      <div className="relative z-10 p-6 pt-8 pb-5 bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_0_20px_rgba(45,212,191,0.25)] overflow-hidden p-1">
            <img src="/smartkidcare1.png" alt="Logo" className="h-full w-full object-contain drop-shadow-sm" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="truncate text-lg font-bold leading-tight tracking-tight text-white">
              {loading ? "Loading..." : settings?.schoolName || "Smart KidCare"}
            </h1>
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-teal-400/80 mt-1">
              Captain Administration
            </p>
          </div>
          {mobile && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="relative z-10 flex-1 space-y-7 px-4 py-6 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 transition-all">
        {navGroups.map((group) => (
          <div key={group.groupName} className="space-y-2">
            <h3 className="mb-2 px-3 text-[10px] font-bold tracking-[0.15em] text-[#6F969B]">
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
                    aria-label={`Open ${item.label}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out cursor-pointer group ${
                      isActive
                        ? "bg-[#0F4C4F] text-[#F8FAFC] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                        : "text-[#A7C0C4] hover:translate-x-1 hover:bg-white/5 hover:text-[#F8FAFC]"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-all duration-300 ${
                        isActive
                          ? "text-teal-400 scale-110"
                          : "text-[#6F969B] group-hover:text-[#A7C0C4]"
                      }`}
                    />
                    <span className={`text-sm tracking-wide ${isActive ? "font-semibold text-[#F8FAFC]" : "font-medium"}`}>
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
      <div className="relative z-10 border-t border-[#0F4C4F] bg-[#06252B] p-4 backdrop-blur-md">
        <button
          onClick={() => onNavigate?.(systemItem.path)}
          aria-label={`Open ${systemItem.label}`}
          aria-current={activeItem === systemItem.path ? "page" : undefined}
          className={`relative w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer group ${
            activeItem === systemItem.path
              ? "bg-[#0F4C4F] text-[#F8FAFC]"
              : "text-[#A7C0C4] hover:-translate-y-0.5 hover:bg-white/5 hover:text-[#F8FAFC]"
          }`}
        >
          <systemItem.icon
            size={18}
            strokeWidth={activeItem === systemItem.path ? 2.5 : 2}
            className={`transition-all duration-300 ${
              activeItem === systemItem.path
                ? "text-teal-400 scale-110"
                : "text-[#6F969B] group-hover:rotate-90 group-hover:text-[#A7C0C4]"
            }`}
          />
          <span className={`text-sm tracking-wide ${activeItem === systemItem.path ? "font-semibold text-[#F8FAFC]" : "font-medium"}`}>
            {systemItem.label}
          </span>
        </button>
      </div>
    </aside>
  );
}
