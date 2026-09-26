import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedLayout from "./components/auth/ProtectedLayout";
import { RoleHome, RoleRoute } from "./components/auth/RoleRoute";
import { SystemSettingsProvider } from "./context/SystemSettingsContext";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const ChildrenManagement = lazy(() => import("./pages/ChildrenManagement"));
const FeedingProgram = lazy(() => import("./pages/FeedingProgram"));
const ReportAnalytics = lazy(() => import("./pages/Reports&Analytics"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const CaptainConcerns = lazy(() => import("./pages/CaptainConcerns"));

export default function App() {
  return (
    <SystemSettingsProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<RoleHome />} />
              <Route element={<RoleRoute role="barangay_captain" />}>
                <Route path="/monitoring/dashboard" element={<AdminDashboard />} />
                <Route path="/monitoring/users" element={<UserManagement />} />
                <Route path="/monitoring/records" element={<ChildrenManagement />} />
                <Route path="/monitoring/feeding" element={<FeedingProgram />} />
                <Route path="/monitoring/concerns" element={<CaptainConcerns />} />
                <Route path="/monitoring/reports/*" element={<ReportAnalytics />} />
                <Route path="/monitoring/settings" element={<AdminSettings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SystemSettingsProvider>
  );
}
