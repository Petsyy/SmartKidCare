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

export default function Sidebar({ activeItem = "users", onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 bg-linear-to-b from-teal-600 to-teal-700 text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo Section */}
      <div className="p-6 border-b border-teal-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Shield className="text-teal-600" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Smart KidCare</h1>
            <p className="text-xs text-teal-200">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => onNavigate?.(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white/20 text-white font-medium shadow-sm"
                  : "text-teal-100 hover:bg-white/10 hover:text-white"
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
