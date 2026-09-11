import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  CalendarClock,
  Clock,
  Building2,
  Percent,
  FileBarChart,
  UserPlus,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { LoadingState, ErrorState } from "../../components/common/States";
import CheckInOutCard from "../../components/attendance/CheckInOutCard";
import LiveAttendeesTracker from "../../components/attendance/LiveAttendeesTracker";
import { useLookups } from "../../hooks/useLookups";
import { useAsync } from "../../hooks/useAsync";
import * as attendanceService from "../../services/attendanceService";
import * as leaveService from "../../services/leaveService";
import { todayISO, formatDate } from "../../utils/dateUtils";
import { useAuth } from "../../hooks/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { employees, departments, loading: lookupsLoading, error: lookupsError } = useLookups();
  const attendanceQ = useAsync(attendanceService.getAttendance, []);
  const requestsQ = useAsync(leaveService.getLeaveRequests, []);

  const today = todayISO();

  const stats = useMemo(() => {
    const todayRecords = (attendanceQ.data || []).filter((a) => a.date === today);
    const present = todayRecords.filter((a) => a.status === "Present" || a.status === "Late").length;
    const late = todayRecords.filter((a) => a.status === "Late").length;
    const absent = todayRecords.filter((a) => a.status === "Absent").length;
    const onLeave = todayRecords.filter((a) => a.status === "On Leave").length;
    const pendingLeaves = (requestsQ.data || []).filter((r) => r.status === "Pending").length;
    const countable = todayRecords.filter((a) => a.status !== "Week Off" && a.status !== "Holiday").length;
    const attendancePct = countable > 0 ? ((present / countable) * 100).toFixed(1) : "0.0";
    return { present, late, absent, onLeave, pendingLeaves, attendancePct };
  }, [attendanceQ.data, requestsQ.data, today]);

  const loading = lookupsLoading || attendanceQ.loading || requestsQ.loading;
  const error = lookupsError || attendanceQ.error || requestsQ.error;

  function handleRefresh() {
    attendanceQ.refetch();
    requestsQ.refetch();
  }

  if (loading) return <LoadingState label="Loading expert admin portal..." />;
  if (error) return <ErrorState message={error} onRetry={handleRefresh} />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Admin Overview • ${user?.name?.split(" ")[0] || "Admin"}`}
        subtitle={`System live status for ${formatDate(today)}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/employees" className="btn-secondary text-xs">
              <UserPlus size={14} /> Manage Staff
            </Link>
            <Link to="/admin/reports" className="btn-primary text-xs">
              <FileBarChart size={14} /> Generate Report
            </Link>
          </div>
        }
      />

      {/* Interactive Check-In / Check-Out Widget */}
      <CheckInOutCard onAttendanceUpdated={handleRefresh} />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Staff Members" value={employees.length} icon={Users} tone="primary" />
        <StatCard label="Present / Checked In Today" value={stats.present} icon={UserCheck} tone="green" />
        <StatCard label="Late Arrivals Today" value={stats.late} icon={Clock} tone="amber" />
        <StatCard label="Absent / Not Arrived" value={stats.absent} icon={UserX} tone="red" />
        <StatCard label="Employees on Leave" value={stats.onLeave} icon={CalendarClock} tone="purple" />
        <StatCard label="Pending Leave Requests" value={stats.pendingLeaves} icon={Clock} tone="amber" />
        <StatCard label="Active Departments" value={departments.length} icon={Building2} tone="primary" />
        <StatCard label="Today's Attendance Rate" value={stats.attendancePct} suffix="%" icon={Percent} tone="green" />
      </div>

      {/* Live Attendees & Check-In / Out Feed for Admin */}
      <LiveAttendeesTracker
        employees={employees}
        departments={departments}
        allAttendance={attendanceQ.data || []}
        scope="all"
        canEdit={true}
        onRefresh={handleRefresh}
        title="Live Organization Check-In & Check-Out Attendee Feed"
      />
    </div>
  );
}
