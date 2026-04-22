import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedLayout from "./components/auth/ProtectedLayout";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const ChildrenManagement = lazy(() => import("./pages/ChildrenManagement"));
const AttendanceTracking = lazy(() => import("./pages/AttendanceTracking"));
const FeedingProgram = lazy(() => import("./pages/FeedingProgram"));
const ReportAnalytics = lazy(() => import("./pages/Reports&Analytics"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const EnrollmentRequests = lazy(() => import("./pages/EnrollmentRequests"));
const DaycareCenters = lazy(() => import("./pages/DaycareCenters"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/children" element={<ChildrenManagement />} />
            <Route path="/enrollment-requests" element={<EnrollmentRequests />} />
            <Route path="/centers" element={<DaycareCenters />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/attendance" element={<AttendanceTracking />} />
            <Route path="/feeding" element={<FeedingProgram />} />
            <Route path="/reports" element={<ReportAnalytics />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
