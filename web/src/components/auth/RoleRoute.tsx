import { Navigate, Outlet } from "react-router-dom";
import { useAuthSession } from "./useAuthSession";

export type WebRole = "barangay_captain";

const homeForRole = (_role?: string) => "/monitoring/dashboard";

export function RoleRoute({ role }: { role: WebRole }) {
  const { user } = useAuthSession();
  if (user?.role !== role) return <Navigate to={homeForRole(user?.role)} replace />;
  return <Outlet />;
}

export function RoleHome() {
  const { user } = useAuthSession();
  return <Navigate to={homeForRole(user?.role)} replace />;
}
