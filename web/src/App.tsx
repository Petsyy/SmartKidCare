import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import UserManagement from "./pages/UserManagement";
import ChildrenManagement from "./pages/ChildrenManagement";
import AttendanceTracking from "./pages/AttendanceTracking";
import FeedingProgram from "./pages/FeedingProgram";
import ReportAnalytics from "./pages/Reports&Analytics";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import EnrollmentRequests from "./pages/EnrollmentRequests";
import DaycareCenters from "./pages/DaycareCenters";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/children"
          element={
            <ProtectedRoute>
              <ChildrenManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enrollment-requests"
          element={
            <ProtectedRoute>
              <EnrollmentRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/centers"
          element={
            <ProtectedRoute>
              <DaycareCenters />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AttendanceTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feeding"
          element={
            <ProtectedRoute>
              <FeedingProgram />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
