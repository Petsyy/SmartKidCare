import { Navigate, Outlet } from "react-router-dom";
import { useAuthSession } from "./useAuthSession";

export type WebRole = "barangay_captain";

const homeForRole = () => "/monitoring/dashboard";

export function RoleRoute({ role }: { role: WebRole }) {
  const { user } = useAuthSession();
  if (user?.role !== role) return <Navigate to={homeForRole()} replace />;
  return <Outlet />;
}

export function RoleHome() {
  return <Navigate to={homeForRole()} replace />;
}
