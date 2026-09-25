import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthSession } from "./useAuthSession";

export type WebRole = "system_admin" | "barangay_captain";

const homeForRole = (role?: string) =>
  role === "system_admin" ? "/system/dashboard" : "/monitoring/dashboard";

export function RoleRoute({ role }: { role: WebRole }) {
  const { user } = useAuthSession();
  const location = useLocation();
  if (user?.role !== role) return <Navigate to={homeForRole(user?.role)} replace />;
  if (role === "barangay_captain" && user.mustChangePassword && location.pathname !== "/monitoring/settings") {
    return <Navigate to="/monitoring/settings" replace />;
  }
  return <Outlet />;
}

export function RoleHome() {
  const { user } = useAuthSession();
  return <Navigate to={homeForRole(user?.role)} replace />;
}
