import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

import LoginPage from "./pages/auth/LoginPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import DepartmentsPage from "./pages/admin/DepartmentsPage";
import ActivityHistoryPage from "./pages/admin/ActivityHistoryPage";

import HrDashboard from "./pages/hr/HrDashboard";

import ManagerDashboard from "./pages/manager/ManagerDashboard";
import TeamPage from "./pages/manager/TeamPage";

import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import ProfilePage from "./pages/employee/ProfilePage";

import EmployeesPage from "./pages/shared/EmployeesPage";
import AttendancePage from "./pages/shared/AttendancePage";
import LeaveRequestsPage from "./pages/shared/LeaveRequestsPage";
import LeaveTypesPage from "./pages/shared/LeaveTypesPage";
import ReportsPage from "./pages/shared/ReportsPage";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              className: "!bg-white !text-slate-900 !border !border-slate-200 dark:!bg-slate-800 dark:!text-slate-100 dark:!border-slate-700 shadow-lg",
            }}
          />
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/employees" element={<EmployeesPage canDelete />} />
              <Route path="/admin/departments" element={<DepartmentsPage />} />
              <Route path="/admin/attendance" element={<AttendancePage scope="all" />} />
              <Route path="/admin/leaves" element={<LeaveRequestsPage scope="all" />} />
              <Route path="/admin/leave-types" element={<LeaveTypesPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/activity" element={<ActivityHistoryPage />} />
            </Route>
          </Route>

          {/* HR */}
          <Route element={<ProtectedRoute allowedRoles={["hr"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/hr/dashboard" element={<HrDashboard />} />
              <Route path="/hr/employees" element={<EmployeesPage canDelete={false} />} />
              <Route path="/hr/attendance" element={<AttendancePage scope="all" />} />
              <Route path="/hr/leaves" element={<LeaveRequestsPage scope="all" />} />
              <Route path="/hr/leave-types" element={<LeaveTypesPage />} />
              <Route path="/hr/reports" element={<ReportsPage />} />
            </Route>
          </Route>

          {/* Manager */}
          <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/team" element={<TeamPage />} />
              <Route path="/manager/attendance" element={<AttendancePage scope="team" />} />
              <Route path="/manager/leaves" element={<LeaveRequestsPage scope="team" />} />
            </Route>
          </Route>

          {/* Employee */}
          <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee/attendance" element={<AttendancePage scope="self" />} />
              <Route path="/employee/leaves" element={<LeaveRequestsPage scope="self" />} />
              <Route path="/employee/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
